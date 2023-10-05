import { Logger }			from '@whi/weblogger';
const log				= new Logger("test-basic", process.env.LOG_LEVEL );


import fs				from 'fs';
import path				from 'path';
import crypto				from 'crypto';
import { expect }			from 'chai';

import { Holochain }			from '@spartan-hc/holochain-backdrop';
import {
    MereMemoryZomelet,
}					from '@spartan-hc/mere-memory-zomelets';
import {
    AppInterfaceClient,
}					from '@spartan-hc/app-interface-client';
import json				from '@whi/json';

import { expect_reject }		from '../utils.js';

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

    describe("Basic", basic_tests.bind( this, holochain ) );

    after(async () => {
	await holochain.stop();
	await holochain.destroy();
    });

});


function basic_tests () {
    const bytes				= (new Uint8Array(3_000_000)).fill(1);
    let client;
    let app_client;
    let mere_memory_api;
    let memory;
    let memory_addr, memory_block_addr;

    before(async function () {
	client				= new AppInterfaceClient( APP_PORT, {
	    "logging": process.env.LOG_LEVEL || "fatal",
	});
	app_client			= await client.app( "test-alice" );

	app_client.setCellZomelets( DNA_NAME, {
	    "mere_memory_api": MereMemoryZomelet,
	});

	mere_memory_api			= app_client.cells[DNA_NAME].zomes.mere_memory_api.functions;
    });

    it("should create a memory block", async function () {
	this.timeout( 10_000 );

	let input			= {
	    "sequence": {
		"position": 1,
		"length": 1,
	    },
	    "bytes": crypto.randomBytes( 100 ),
	};
	let addr			= await mere_memory_api.create_memory_block( input );
	log.normal("New memory block address: %s", addr );

	memory_block_addr		= addr;
    });

    it("should create a memory", async function () {
	this.timeout( 10_000 );

	let hash			= new Array(32).fill(0);
	let input			= {
	    hash,
	    "block_addresses": [
		memory_block_addr,
	    ],
	    "memory_size": 100,
	};
	let addr			= await mere_memory_api.create_memory( input );
	log.normal("New memory address: %s", addr );
    });

    it("should create a memory using 'save'", async function () {
	this.timeout( 10_000 );

	let addr			= await mere_memory_api.save( bytes );
	log.normal("New memory address: %s", addr );

	memory_addr			= addr;
    });

    it("should get a memory", async function () {
	this.timeout( 10_000 );

	memory				= await mere_memory_api.get_memory( memory_addr );
	log.normal("New memory: %s", json.debug(memory) );
    });

    it("should get a memory using 'remember'", async function () {
	this.timeout( 10_000 );

	const memory			= await mere_memory_api.remember( memory_addr );
	log.normal("Memory: %s", json.debug(memory) );
    });

    it("should calculate hash of the memory bytes", async function () {
	this.timeout( 10_000 );

	{
	    const hash			= await mere_memory_api.calculate_hash( bytes );
	    log.normal("Calculated hash: %s", hash );

	    expect( hash		).to.deep.equal( memory.hash );
	}

	{
	    const hash			= await mere_memory_api.calculate_hash( Buffer.from("hello world") );
	    log.normal("Calculated hash: %s", hash );

	    expect( hash		).to.equal("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
	}
    });

    it("should find a memory based on the hash", async function () {
	this.timeout( 10_000 );

	{
	    const exists		= await mere_memory_api.memory_exists( bytes );
	    log.normal("Memory exists: %s", exists );

	    expect( exists		).to.be.true;
	}

	{
	    const exists		= await mere_memory_api.memory_exists( Buffer.from("hello world") );
	    log.normal("Memory exists: %s", exists );

	    expect( exists		).to.be.false;
	}
    });

    describe("Errors", () => {
	it("should fail to create memory block because it is too big", async function () {
	    this.timeout( 10_000 );

	    await expect_reject( async () => {
		const chunk		= new Uint8Array( 2_097_153 ).fill(0);
		const block_addr	= await app_client.call( "memory", "mere_memory_api", "create_memory_block", {
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
		const block_addr	= await mere_memory_api.create_memory_block({
		    "sequence": {
			"position": 1,
			"length": 1,
		    },
		    "bytes": Array.from(chunk),
		});
		await app_client.call( "memory", "mere_memory_api", "create_memory", {
		    "hash":		new Array(32).fill(0),
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
