import HoloHashes			from '@spartan-hc/holo-hash';
import Essence				from '@whi/essence';
import {
    Transformer,
    Zomelet,
}					from '@spartan-hc/zomelets';
import { sha256 }			from 'js-sha256';


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


const Interpreter			= new Essence.Translator();
const essence_transformer		= new Transformer({
    async output ( resp ) {
	const payload			= Interpreter.parse( resp ).value();

	if ( payload instanceof Error )
	    throw payload;

	return payload;
    },
}, "Essence Payload Parser" );


export const MereMemoryZomelet		= new Zomelet({
    // Memory Block CRUD
    "create_memory_block": true,
    "get_memory_block": true,

    // Memory CRUD
    "create_memory": true,
    "get_memory": true,

    // Other
    "calculate_hash": true,
    "memory_exists": true,

    // Virtual functions
    async save ( source ) {
	if ( !(source instanceof Uint8Array ) )
	    throw new TypeError(`Input must be a Uint8Array; not type ${typeof source}`);

	const hash			= sha256.digest( source );
	const chunks			= new Chunker( source );
	const block_addresses		= [];

	// TODO: use promise.all
	let position			= 1;
	for ( let chunk of chunks ) {
	    this.log.trace("Chunk %s/%s (%s bytes)", position, chunks.length, chunk.length.toLocaleString() );
	    let response		= await this.functions.create_memory_block({
		"sequence": {
		    "position": position++,
		    "length": chunks.length,
		},
		"bytes": chunk,
	    });

	    block_addresses.push( new HoloHashes.HoloHash( response ) );
	}

	let response			= await this.functions.create_memory({
	    hash,
	    block_addresses,
	    "memory_size":	source.length,
	});

	return new HoloHashes.HoloHash( response );
    },
    async remember ( addr ) {
	let memory			= await this.functions.get_memory( addr );

	const bytes			= new Uint8Array( memory.memory_size );

	let index			= 0;
	for ( let block_addr of memory.block_addresses ) {
	    const block			= await this.functions.get_memory_block( block_addr );
	    bytes.set( block.bytes, index );

	    index		       += block.bytes.length;
	}

	return bytes;
    }
});
MereMemoryZomelet.addTransformer( essence_transformer );


export default {
    Chunker,
    MereMemoryZomelet,
}
