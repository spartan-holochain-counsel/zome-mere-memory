mod validation;

pub use mere_memory_types::*;

use hdi::prelude::*;

pub trait ToInput<T>
where
    ScopedEntryDefIndex: TryFrom<T, Error = WasmError>,
{
    fn to_input(&self) -> T;
}

impl ToInput<EntryTypes> for MemoryEntry {
    fn to_input(&self) -> EntryTypes {
	EntryTypes::Memory(self.clone())
    }
}

impl ToInput<EntryTypes> for MemoryBlockEntry {
    fn to_input(&self) -> EntryTypes {
	EntryTypes::MemoryBlock(self.clone())
    }
}


#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    #[entry_type(required_validations = 5)]
    Memory(MemoryEntry),
    #[entry_type(required_validations = 5)]
    MemoryBlock(MemoryBlockEntry),
}


#[hdk_link_types]
pub enum LinkTypes {
    Memory,
    ByHash,
}
