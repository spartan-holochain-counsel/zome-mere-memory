use essence::{ EssenceResponse };
use hdk::prelude::*;
use hex;

mod errors;
mod handlers;

pub use mere_memory_types::{
    MemoryEntry,
    MemoryBlockEntry,
};
pub use mere_memory::{
    EntryTypes, LinkTypes,
};

type Response<T> = EssenceResponse<T, (), ()>;

fn success<T>(payload: T) -> Response<T> {
    Response::success( payload, None )
}



#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}


#[hdk_extern]
fn save_bytes(sbytes: SerializedBytes) -> ExternResult<Response<EntryHash>> {
    let entry = catch!( handlers::remember_bytes( sbytes.bytes() ) );

    Ok(success( entry ))
}

#[hdk_extern]
fn retrieve_bytes(addr: EntryHash) -> ExternResult<Response<Vec<u8>>> {
    let bytes = catch!( handlers::retrieve_bytes( addr ) );

    Ok(success( bytes ))
}

#[hdk_extern]
fn calculate_hash(sbytes: SerializedBytes) -> ExternResult<Response<String>> {
    let hash = mere_memory_types::calculate_hash( &sbytes.bytes() );

    Ok(success( hex::encode( hash ) ))
}

#[hdk_extern]
fn memory_exists(sbytes: SerializedBytes) -> ExternResult<Response<bool>> {
    let answer = catch!( handlers::memory_exists( sbytes.bytes() ) );

    Ok(success( answer ))
}


// Memory
#[hdk_extern]
fn create_memory(input: handlers::CreateInput) -> ExternResult<Response<EntryHash>> {
    let entry = catch!( handlers::create_memory_entry( input ) );

    Ok(success( entry ))
}

#[hdk_extern]
fn get_memory(addr: EntryHash) -> ExternResult<Response<MemoryEntry>> {
    let hash = catch!( handlers::get_memory_entry( addr) );

    Ok(success( hash ))
}


// Memory Blocks
#[hdk_extern]
fn create_memory_block(input: MemoryBlockEntry) -> ExternResult<Response<EntryHash>> {
    let entry = catch!( handlers::create_memory_block_entry( input ) );

    Ok(success( entry ))
}

#[hdk_extern]
fn get_memory_block(addr: EntryHash) -> ExternResult<Response<MemoryBlockEntry>> {
    let hash = catch!( handlers::get_memory_block_entry( addr ) );

    Ok(success( hash ))
}
