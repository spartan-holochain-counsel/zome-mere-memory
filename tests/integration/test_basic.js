import { Logger }			from '@whi/weblogger';
const log				= new Logger("test-basic", process.env.LOG_LEVEL );


import fs				from 'fs';
import path				from 'path';
import crypto				from 'crypto';
import { expect }			from 'chai';
import {
    gzipSync,
    zlibSync,
    unzlibSync,
}					from 'fflate';

import { Holochain }			from '@spartan-hc/holochain-backdrop';
import {
    MereMemoryZomelet,
}					from '@spartan-hc/mere-memory-zomelets';
import {
    AppInterfaceClient,
}					from '@spartan-hc/app-interface-client';
import json				from '@whi/json';

import { expect_reject,
	 linearSuite }			from '../utils.js';

const delay				= (n) => new Promise(f => setTimeout(f, n));
const MEMORY_PATH			= new URL( "../../packs/dna/storage.dna", import.meta.url ).pathname;
const DNA_NAME				= "memory";

let client, installations;

describe("Mere Memory", () => {
    const holochain			= new Holochain({
	"timeout": 60_000,
	"default_stdout_loggers": log.level_rank > 3,
    });

    before(async function () {
	this.timeout( 30_000 );

	installations			= await holochain.install([
	    "alice",
	], {
	    "app_name": "test",
	    "bundle": {
		[DNA_NAME]:	MEMORY_PATH,
	    },
	});

	const app_port			= await holochain.ensureAppPort();

	client				= new AppInterfaceClient( app_port, {
	    "logging": process.env.LOG_LEVEL || "fatal",
	});
    });

    linearSuite("Basic", basic_tests.bind( this, holochain ) );

    after(async () => {
	await holochain.destroy();
    });

});


function basic_tests () {
    const bytes				= fs.readFileSync( MEMORY_PATH );
    const small_bytes			= crypto.randomBytes( 100 );

    let app_client;
    let mere_memory_api;
    let memory;
    let memory_addr, memory_block_addr;
    let compressed_memory_addr;
    let zlib_addr;

    before(async function () {
	this.timeout( 30_000 );

	const auth			= installations.alice.test.auth;
	app_client			= await client.app( auth.token, "test-alice" );

	({
	    memory,
	}				= app_client.createInterface({
	    [DNA_NAME]: {
		"mere_memory_api":	MereMemoryZomelet,
	    },
	}));

	mere_memory_api			= memory.zomes.mere_memory_api.functions;

	await mere_memory_api.make_hash_path( "trigger init" );
    });

    it("should create a memory block", async function () {
	let input			= {
	    "sequence": {
		"position": 1,
		"length": 1,
	    },
	    "bytes": small_bytes,
	};
	let addr			= await mere_memory_api.create_memory_block_entry( input );
	log.normal("New memory block address: %s", addr );

	memory_block_addr		= addr;
    });

    it("should create a memory", async function () {
	let hash			= await mere_memory_api.calculate_hash( small_bytes );
	let input			= {
	    hash,
	    "block_addresses": [
		memory_block_addr,
	    ],
	    "memory_size": 100,
	};
	let addr			= await mere_memory_api.create_memory_entry( input );
	log.normal("New memory address: %s", addr );
    });

    it("should save (uncompressed) memory", async function () {
	memory_addr			= await mere_memory_api.save( bytes, {
	    "compress": false,
	});
	log.normal("New memory address: %s", memory_addr );
    });

    it("should create the same memory", async function () {
	let addr			= await mere_memory_api.save( bytes, {
	    "compress": false,
	} );
	log.normal("New memory address: %s", addr );

	expect( addr			).to.deep.equal( memory_addr );
    });

    it("should remember (uncompressed) memory", async function () {
	let result			= await mere_memory_api.remember( memory_addr );

	expect( result			).to.deep.equal( bytes );
    });

    it("should get a memory", async function () {
	memory				= await mere_memory_api.get_memory_entry( memory_addr );
	log.normal("New memory: %s", json.debug(memory) );
    });

    it("should create a memory using 'save' (compressed)", async function () {
	compressed_memory_addr		= await mere_memory_api.save( bytes );
	let compressed_memory		= await mere_memory_api.get_memory_entry( compressed_memory_addr );
	log.normal("Compressed memory: %s", json.debug(compressed_memory) );

	expect( compressed_memory.memory_size		).to.be.lt( memory.memory_size );
	expect( compressed_memory.memory_size		).to.be.lt( compressed_memory.uncompressed_size );
	expect( compressed_memory.uncompressed_size	).to.equal( bytes.length );

	let result			= await mere_memory_api.remember( compressed_memory_addr );

	expect( result.length		).to.equal( bytes.length );
    });

    it("should create the same compressed memory", async function () {
	let addr			= await mere_memory_api.save( bytes );
	log.normal("New memory address: %s", addr );

	expect( addr			).to.deep.equal( compressed_memory_addr );
    });

    it("should create the same memory and get the compressed memory", async function () {
	let addr			= await mere_memory_api.save( bytes );
	log.normal("New memory address: %s", addr );

	expect( addr			).to.deep.equal( compressed_memory_addr );
    });

    it("should get a memory using 'remember'", async function () {
	const memory			= await mere_memory_api.remember( memory_addr );
	log.normal("Memory: %s", json.debug(memory) );
    });

    it("should find a memory based on the hash", async function () {
	{
	    const exists		= await mere_memory_api.memory_exists( bytes );
	    log.normal("Memory exists: %s", exists );

	    expect( exists		).to.have.length( 2 );
	}

	{
	    const exists		= await mere_memory_api.memory_exists( Buffer.from("hello world") );
	    log.normal("Memory exists: %s", exists );

	    expect( exists		).to.be.false;
	}
    });

    it("should create a compressed memory using custom compression", async function () {
	zlib_addr			= await mere_memory_api.save( bytes, {
	    compress ( source ) {
		return {
		    "type": "zlib",
		    "bytes": zlibSync( source ),
		};
	    },
	    "check_existing_memories": false,
	});

	expect( zlib_addr		).to.not.deep.equal( compressed_memory_addr );

	let result			= await mere_memory_api.remember( zlib_addr, {
	    decompress ( bytes ) {
		return unzlibSync( bytes );
	    },
	});

	expect( result			).to.deep.equal( bytes );
    });

    it("should get existing compressed memory with lowest memory size", async function () {
	let addr			= await mere_memory_api.save( bytes, {
	    compress ( source ) {
		return {
		    "type": "gzip",
		    "bytes": gzipSync( source, {
			"level": 0,
		    }),
		};
	    },
	    "check_existing_memories": false,
	});

	let existing_addr		= await mere_memory_api.save( bytes );

	expect( existing_addr		).to.not.deep.equal( addr );
    });

    describe("Errors", () => {
	it("should fail to create memory block because it is too big", async function () {
	    await expect_reject( async () => {
		const chunk		= new Uint8Array( 2_097_153 ).fill(0);
		const block_addr	= await app_client.call( "memory", "mere_memory_api", "create_memory_block_entry", {
		    "sequence": {
			"position": 1,
			"length": 1,
		    },
		    "bytes": Array.from(chunk),
		});
	    }, "MemoryBlockEntry cannot be larger than 2MB (2,097,152 bytes)" );
	});

	it("should fail to create memory with wrong byte size", async function () {
	    await expect_reject( async () => {
		const chunk		= crypto.randomBytes( 64 );
		const block_addr	= await mere_memory_api.create_memory_block_entry({
		    "sequence": {
			"position": 1,
			"length": 1,
		    },
		    "bytes": chunk,
		});
		await app_client.call( "memory", "mere_memory_api", "create_memory_entry", {
		    "hash":		await mere_memory_api.calculate_hash( chunk ),
		    "block_addresses": [ block_addr ],
		    "memory_size":	65,
		});
	    }, "MemoryEntry 'memory_size' does not equal the sum of its blocks" );
	});

	it("should fail remember custom compression without decompress option", async function () {
	    await expect_reject( async () => {
		await mere_memory_api.remember( zlib_addr );
	    }, "Cannot decompress memory with compression type 'zlib'" );
	});
    });

    after(async function () {
	await client.close();
    });
}
