import {
    ActionHash, EntryHash,
}					from '@spartan-hc/holo-hash'; // approx. 11kb
import {
    Zomelet,
}					from '@spartan-hc/zomelets'; // approx. 7kb
import {
    intoStruct,
    OptionType, VecType,
}					from '@whi/into-struct';
import { Bytes }			from '@whi/bytes-class';

import { sha256 }			from 'js-sha256'; // approx. 9kb
import {
    gzipSync,
    gunzipSync,
}					from 'fflate'; // approx. 9kb


function toHex( uint8Array ) {
    return Array.from(
	uint8Array, n => n.toString(16).padStart(2, '0')
    ).join('');
}


export const MemoryStruct = {
    "hash":			String,
    "compression":		OptionType( String ),
    "uncompressed_size":	OptionType( Number ),
    "memory_size":		Number,
    "block_addresses":		VecType( EntryHash ),
};

export function MemoryEntry ( entry ) {
    return intoStruct( entry, MemoryStruct );
}


export const MemoryBlockStruct = {
    "sequence": {
	"position":		Number,
	"length":		Number,
    },
    "bytes":			Bytes,
};

export function MemoryBlockEntry ( entry ) {
    return intoStruct( entry, MemoryBlockStruct );
}



export class Chunker {
    #chunk_size				= 1024*1024*2;
    #bytes				= null;

    constructor ( bytes, chunk_size ) {
	if ( typeof bytes !== "object" || bytes === null )
	    throw new TypeError(`Expected byte input; not type '${typeof bytes}'`);
	if ( !(bytes instanceof Uint8Array) )
	    throw new TypeError(`Byte input must be Uint8Array; not type '${bytes.constructor.name}'`);

	this.#bytes			= bytes;

	if ( chunk_size !== undefined )
	    this.#chunk_size		= chunk_size;
    }

    get chunkSize () {
	return this.#chunk_size;
    }

    get bytes () {
	return this.#bytes;
    }

    get length () {
	return Math.ceil( this.bytes.length / this.chunkSize );
    }

    *iterator () {
	let index			= -1;

	while ( ((index+1) * this.chunkSize) < this.bytes.length ) {
	    index++;

	    let start			= index * this.chunkSize;
	    let end			= Math.min( (index + 1) * this.chunkSize, this.bytes.length );

	    yield this.bytes.slice( start, end );
	}
    }

    [Symbol.iterator]() {
	return this.iterator();
    }

    toString () {
	return `Chunker { length: ${this.length} }`;
    }

    toJSON () {
	return `Chunker { length: ${this.length} }`;
    }
}


const DEFAULT_OPTS			= {
    "compress": true,
    "decompress": true,
    "check_existing_memories": true,
};

export const MereMemoryZomelet		= new Zomelet({
    async make_hash_path ( input ) {
	const result			= await this.call( input );

	return result;
    },

    // Memory Block CRUD
    async create_memory_block_entry ( input ) {
	const result			= await this.call( input );

	return new EntryHash( result );
    },
    async get_memory_block_entry ( input ) {
	const result			= await this.call( new EntryHash(input) );

	return MemoryBlockEntry( result );
    },

    // Memory CRUD
    async create_memory_entry ( input ) {
	const result			= await this.call( input );

	return new EntryHash( result );
    },
    async get_memory_entry ( input ) {
	const result			= await this.call( new EntryHash(input) );

	return MemoryEntry( result );
    },
    async get_memory_bytes ( input ) {
	const result			= await this.call( new EntryHash(input) );

	return new Uint8Array( result );
    },
    async get_memory_with_bytes ( input ) {
	const result			= await this.call( new EntryHash(input) );

	return [
	    MemoryEntry( result[0] ),
	    new Uint8Array( result[1] ),
	];
    },

    // Other
    async memory_exists ( input ) {
	if ( typeof input !== "string" )
	    input			= await this.functions.calculate_hash( input );

	const result			= await this.call( input );

	if ( result === null )
	    return false;

	// Remove duplicate addresses
	return Array.from(
	    new Set(
		result.map( addr => String(new EntryHash(addr)) )
	    )
	).map( addr => new EntryHash(addr) );
    },

    // Virtual functions
    async memory_exists_by_hash ( hash ) {
	if ( typeof hash !== "string" )
	    hash			= toHex( hash );

	return await this.functions.memory_exists( hash );
    },
    async calculate_hash ( bytes ) {
	return sha256.hex( bytes );
    },
    async gzip_compress ( input ) {
	const bytes			= gzipSync( input, {
	    "mtime": 0,
	});

	return new Uint8Array( bytes );
    },
    async gzip_uncompress ( input ) {
	return gunzipSync( input );
    },
    async get_existing_memory ( hash, options ) {
	const matches			= await this.functions.memory_exists_by_hash( hash );

	if ( !matches )
	    return null;

	this.log.info("Found %s matches for hash '%s'", matches.length, hash );
	const matched_memories		= (await Promise.all(
	    matches.map( async target => {
		try {
		    return [ target, await this.functions.get_memory_entry( target ) ];
		} catch (err) {
		    return [ target, null ];
		}
	    })
	)).filter( ([_, memory]) => memory !== null );

	const memories			= matched_memories.filter( ([_, memory]) => memory.compression === null );
	const compressed_memories	= matched_memories.filter( ([_, memory]) => memory.compression === "gzip" );
	// Sort by memory size so that we check the smallest memories first
	compressed_memories.sort( (a,b) => {
	    return a[1].memory_size - b[1].memory_size;
	});

	// Check compressed memories first
	this.log.debug("Checking %s compressed (gzip) memories:", compressed_memories.length );
	for ( let [addr, memory] of compressed_memories ) {
	    try {
		// - Verify that the memory actually matches our hash
		const result		= await this.functions.remember( addr, { "compress": true });
		const true_hash		= await this.functions.calculate_hash( result );

		if ( hash === true_hash ) {
		    this.log.normal("Found matching memory for hash '%s': %s", hash, addr );
		    return addr;
		}
	    } catch (err) {
		this.log.warn("Failed to check existing memory '%s': %s", addr, String(err) );
	    }
	}

	// Ignore uncompressed memories if compression is required
	if ( options.compress === false ) {
	    this.log.debug("Checking %s uncompressed memories:", memories.length );
	    for ( let [addr, memory] of memories ) {
		try {
		    // - Verify that the memory actually matches our hash
		    const result		= await this.functions.remember( addr );
		    const true_hash		= await this.functions.calculate_hash( result );

		    if ( hash === true_hash )
			return addr;
		} catch (err) {
		    this.log.warn("Failed to check existing memory '%s': %s", addr, String(err) );
		}
	    }
	}

	return null;
    },
    async save ( bytes, options ) {
	if ( !(bytes instanceof Uint8Array ) )
	    throw new TypeError(`Input must be a Uint8Array; not type ${typeof bytes}`);

	const opts			= Object.assign( {}, DEFAULT_OPTS, options );
	const hash			= await this.functions.calculate_hash( bytes );

	let compression			= null;
	let uncompressed_size		= null;

	if ( opts.compress ) {
	    uncompressed_size		= bytes.length;

	    if ( typeof opts.compress === "function" ) {
		this.log.info("Using custom compression");
		const result		= await opts.compress( bytes )

		compression		= result.type;
		bytes			= new Uint8Array( result.bytes );
	    }
	    else {
		compression		= "gzip";
		bytes			= await this.functions.gzip_compress( bytes );
	    }
	}

	const memory_size		= bytes.length;

	if ( opts.check_existing_memories === true ) {
	    const addr			= await this.functions.get_existing_memory( hash, {
		"compress": opts.compress,
	    });

	    if ( addr !== null )
		return addr;
	}
	else
	    this.log.warn("Check existing memories is turned off");

	const chunks			= new Chunker( bytes );
	const block_addresses		= [];

	let position			= 1;
	// We cannot use 'Promise.all' for this because it will cause a chain head moved error
	for ( let chunk of chunks ) {
	    this.log.trace("Chunk %s/%s (%s bytes)", position, chunks.length, chunk.length.toLocaleString() );
	    let response		= await this.functions.create_memory_block_entry({
		"sequence": {
		    "position": position++,
		    "length": chunks.length,
		},
		"bytes": chunk,
	    });

	    block_addresses.push( new EntryHash( response ) );
	}

	let response			= await this.functions.create_memory_entry({
	    hash,
	    compression,
	    uncompressed_size,
	    memory_size,
	    block_addresses,
	});

	return new EntryHash( response );
    },
    async remember ( addr, options ) {
	const opts			= Object.assign( {}, DEFAULT_OPTS, options );
	const memory			= await this.functions.get_memory_entry( addr );

	if ( ![ null, "gzip" ].includes( memory.compression ) && typeof options.decompress !== "function" )
	    throw new Error(`Cannot decompress memory with compression type '${memory.compression}' unless custom decompress is provided`);

	const bytes			= new Uint8Array( memory.memory_size );

	let index			= 0;
	for ( let block_addr of memory.block_addresses ) {
	    const block			= await this.functions.get_memory_block_entry( block_addr );
	    bytes.set( block.bytes, index );

	    index		       += block.bytes.length;
	}

	if ( memory.compression === null )
	    return bytes;

	if ( memory.compression !== "gzip" )
	    return await options.decompress( bytes );

	return await this.functions.gzip_uncompress( bytes );
    }
});


export default {
    Chunker,
    MereMemoryZomelet,
}
