use essence::{ EssenceResponse };
use hdk::prelude::*;

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
fn memory_exists(hash: String) -> ExternResult<Response<bool>> {
    let answer = catch!( handlers::memory_exists( hash ) );

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
