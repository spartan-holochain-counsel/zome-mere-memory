use crate::{
    LinkTypes,
    MemoryEntry,
    ToInput,
    make_hash_path,
};

use hdk::prelude::*;


#[hdk_extern]
fn memory_exists(hash: String) -> ExternResult<Option<Vec<EntryHash>>> {
    let path = make_hash_path( hash )?;

    let links = get_links(
        GetLinksInputBuilder::try_new(
            path.path_entry_hash()?,
            LinkTypes::ByHash,
        )?.build()
    )?;

    Ok(
        match links.len() {
            0 => None,
            _ => Some(
                links.into_iter()
                    .filter_map( |link| link.target.into_entry_hash() )
                    .collect()
            ),
        }
    )
}


#[hdk_extern]
fn create_memory_entry(memory: MemoryEntry) -> ExternResult<EntryHash> {
    debug!("Creating 'MemoryEntry' ({} bytes): {}", memory.memory_size, memory.block_addresses.len() );
    let agent_id = agent_info()?.agent_initial_pubkey;
    let entry_hash = hash_entry( &memory )?;

    create_entry( memory.to_input() )?;

    let path = make_hash_path( memory.hash )?;

    create_link( path.path_entry_hash()?, entry_hash.to_owned(), LinkTypes::ByHash, () )?;
    create_link( agent_id, entry_hash.clone(), LinkTypes::Memory, () )?;

    Ok( entry_hash )
}



#[hdk_extern]
fn get_memory_entry(addr: EntryHash) -> ExternResult<MemoryEntry> {
    debug!("Get memory: {}", addr );
    let record = get( addr.clone(), GetOptions::network() )?
        .ok_or(wasm_error!(WasmErrorInner::Guest(format!("Entry not found for address: {}", addr ))))?;
    let memory = MemoryEntry::try_from( &record )?;

    Ok( memory )
}


#[hdk_extern]
fn get_memory_entries_for_agent(maybe_agent_id: Option<AgentPubKey>) -> ExternResult<Vec<MemoryEntry>> {
    let agent_id = match maybe_agent_id {
        Some(agent_id) => agent_id,
        None => agent_info()?.agent_initial_pubkey,
    };
    let memories = get_links(
        GetLinksInputBuilder::try_new(
            agent_id,
            LinkTypes::Memory,
        )?.build()
    )?.into_iter()
        .filter_map(|link| {
            let addr = link.target.into_entry_hash()?;
            get_memory_entry( addr ).ok()
        })
        .collect();

    Ok( memories )
}
