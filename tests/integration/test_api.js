const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});


const fs				= require('fs');
const expect				= require('chai').expect;
const { HoloHash }			= require('@whi/holo-hash');
const { Holochain }			= require('@whi/holochain-backdrop');
const json				= require('@whi/json');

const { backdrop }			= require('./setup.js');


const delay				= (n) => new Promise(f => setTimeout(f, n));
const MEMORY_PATH			= path.join(__dirname, "../../packs/dna/storage.dna");
let clients;


function basic_tests () {
    let memory_addr;

    it("should create a memory using 'save_bytes'", async function () {
	this.timeout( 10_000 );

	const input			= Buffer.from("Somewhere over the rainbow");

	let addr			= new HoloHash( await clients.alice.call( "memory", "mere_memory", "save_bytes", input ) );
	log.normal("New memory address: %s", String(addr) );

	memory_addr			= addr;
    });

    it("should get  a memory using 'retrieve_bytes'", async function () {
	this.timeout( 10_000 );

	let memory			= await clients.alice.call( "memory", "mere_memory", "get_memory", memory_addr );
	log.normal("New memory: %s", json.debug(memory) );
    });
}

function errors_tests () {
}

describe("Zome: Mere Memory", () => {

    const holochain			= new Holochain();

    before(async function () {
	this.timeout( 30_000 );

	clients				= await backdrop( holochain, {
	    "memory": MEMORY_PATH,
	}, [
	    "alice",
	], {
	    "parse_entities": false,
	});
    });

    describe("Basic", basic_tests.bind( this, holochain ) );
    describe("Errors", errors_tests.bind( this, holochain ) );

    after(async () => {
	await holochain.stop();
	await holochain.destroy();
    });

});
