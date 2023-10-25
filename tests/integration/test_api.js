import { Logger }			from '@whi/weblogger';
const log				= new Logger("test-basic", process.env.LOG_LEVEL );


import fs				from 'fs';
import path				from 'path';
import crypto				from 'crypto';
import { expect }			from 'chai';
import {
    gzipSync,
    zlibSync,
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
const APP_PORT				= 23_567;
const DNA_NAME				= "memory";


describe("Zome: Mere Memory", () => {
    const holochain			= new Holochain({
	"timeout": 60_000,
	"default_stdout_loggers": log._level > 3,
    });

    before(async function () {
	this.timeout( 30_000 );

	const actors			= await holochain.backdrop({
	    "test": {
		[DNA_NAME]:	MEMORY_PATH,
	    },
	}, {
	    "app_port": APP_PORT,
	});

	const cell			= actors.alice.test.cells[ DNA_NAME ];
	await holochain.admin.grantUnrestrictedCapability(
	    "testing", cell.agent, cell.dna, "*"
	);
    });

    linearSuite("Basic", basic_tests.bind( this, holochain ) );

    after(async () => {
	await holochain.stop();
	await holochain.destroy();
    });

});


function basic_tests () {
    const bytes				= fs.readFileSync( MEMORY_PATH );
    const small_bytes			= crypto.randomBytes( 100 );

    let client;
    let app_client;
    let mere_memory_api;
    let memory;
    let memory_addr, memory_block_addr;
    let compressed_memory_addr;

    before(async function () {
	client				= new AppInterfaceClient( APP_PORT, {
	    "logging": process.env.LOG_LEVEL || "fatal",
	    // "logging": "normal",
	});
	app_client			= await client.app( "test-alice" );

	({
	    memory,
	}				= app_client.createInterface({
	    [DNA_NAME]: {
		"mere_memory_api":	MereMemoryZomelet,
	    },
	}));

	mere_memory_api			= memory.zomes.mere_memory_api.functions;
    });

    it("should create a memory block", async function () {
	this.timeout( 10_000 );

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
	this.timeout( 10_000 );

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

    it("should create a memory using 'save'", async function () {
	this.timeout( 10_000 );

	memory_addr			= await mere_memory_api.save( bytes );
	log.normal("New memory address: %s", memory_addr );
    });

    it("should create the same memory", async function () {
	this.timeout( 20_000 );

	let addr			= await mere_memory_api.save( bytes );
	log.normal("New memory address: %s", addr );

	expect( addr			).to.deep.equal( memory_addr );
    });

    it("should get a memory", async function () {
	this.timeout( 10_000 );

	memory				= await mere_memory_api.get_memory_entry( memory_addr );
	log.normal("New memory: %s", json.debug(memory) );
    });

    it("should create a memory using 'save' with compress flag", async function () {
	this.timeout( 10_000 );

	compressed_memory_addr		= await mere_memory_api.save( bytes, {
	    "compress": true,
	});
	let compressed_memory		= await mere_memory_api.get_memory_entry( compressed_memory_addr );
	log.normal("Compressed memory: %s", json.debug(compressed_memory) );

	expect( compressed_memory.memory_size		).to.be.lt( memory.memory_size );
	expect( compressed_memory.memory_size		).to.be.lt( compressed_memory.uncompressed_size );
	expect( compressed_memory.uncompressed_size	).to.equal( bytes.length );

	let result			= await mere_memory_api.remember( compressed_memory_addr, {
	    "decompress": true,
	});

	expect( result.length		).to.equal( bytes.length );
    });

    it("should create the same compressed memory", async function () {
	this.timeout( 10_000 );

	let addr			= await mere_memory_api.save( bytes, {
	    "compress": true,
	});
	log.normal("New memory address: %s", addr );

	expect( addr			).to.deep.equal( compressed_memory_addr );
    });

    it("should create the same memory and get the compressed memory", async function () {
	this.timeout( 10_000 );

	let addr			= await mere_memory_api.save( bytes );
	log.normal("New memory address: %s", addr );

	expect( addr			).to.deep.equal( compressed_memory_addr );
    });

    it("should get a memory using 'remember'", async function () {
	this.timeout( 10_000 );

	const memory			= await mere_memory_api.remember( memory_addr );
	log.normal("Memory: %s", json.debug(memory) );
    });

    it("should find a memory based on the hash", async function () {
	this.timeout( 10_000 );

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
	this.timeout( 10_000 );

	let addr			= await mere_memory_api.save( bytes, {
	    compress ( source ) {
		return {
		    "type": "zlib",
		    "bytes": zlibSync( source ),
		};
	    },
	    "check_existing_memories": false,
	});

	expect( addr			).to.not.deep.equal( compressed_memory_addr );
    });

    it("should get existing compressed memory with lowest memory size", async function () {
	this.timeout( 10_000 );

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

	let existing_addr		= await mere_memory_api.save( bytes, {
	    "compress": true,
	});

	expect( existing_addr		).to.not.deep.equal( addr );
    });

    describe("Errors", () => {
	it("should fail to create memory block because it is too big", async function () {
	    this.timeout( 10_000 );

	    await expect_reject( async () => {
		const chunk		= new Uint8Array( 2_097_153 ).fill(0);
		const block_addr	= await app_client.call( "memory", "mere_memory_api", "create_memory_block_entry", {
		    "sequence": {
			"position": 1,
			"length": 1,
		    },
		    "bytes": Array.from(chunk),
		});
	    }, "InvalidCommit error: MemoryBlockEntry cannot be larger than 2MB (2,097,152 bytes)" );
	});

	it("should fail to create memory with wrong byte size", async function () {
	    this.timeout( 10_000 );

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
	    }, "InvalidCommit error: MemoryEntry 'memory_size' does not equal the sum of its blocks" );
	});
    });

    after(async function () {
	await client.close();
    });
}
