//! Other Resources
//!
//! - Source code - [github.com/spartan-holochain-counsel/zome-mere-memory](https://github.com/spartan-holochain-counsel/zome-mere-memory)
//! - Cargo package - [crates.io/crates/mere_memory_types](https://crates.io/crates/mere_memory_types)
//!
pub use hdi;

use hdi::prelude::*;



//
// Memory Entry
//
/// An Entry that represents a full byte-set by grouping a set of MemoryBlockEntry
///
/// Example values
/// ```
/// # use std::convert::TryFrom;
/// # use holo_hash::{ EntryHash };
/// use mere_memory_types::{ MemoryEntry };
///
/// MemoryEntry {
///     hash: "bdff630d3f1c11ef".to_string(),
///     compression: None,
///     uncompressed_size: None,
///     memory_size: 712837,
///     block_addresses: vec![
///         EntryHash::try_from("uhCEkBh2fW3K2RE41X3MOO3LdrMUYPPXWPGtuDjwRrXQZk-94N7Ku").unwrap(),
///     ],
/// };
/// ```
#[hdk_entry_helper]
#[derive(Clone)]
pub struct MemoryEntry {
    pub hash: String,
    pub compression: Option<String>,
    pub uncompressed_size: Option<u64>,
    pub memory_size: u64,
    pub block_addresses: Vec<EntryHash>,
}


//
// Memory Block Entry
//
/// Indicates where a memory block fits in a byte-set
///
/// Example (indicating block 1 of a 2 block set)
/// ```
/// use mere_memory_types::SequencePosition;
///
/// SequencePosition {
///     position: 1, // Indexing is intended to start at 1, not 0
///     length: 2,
/// };
/// ```
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SequencePosition {
    pub position: u64,
    pub length: u64,
}

/// An Entry that contains 1 part of a MemoryEntry byte-set
///
/// Example
/// ```
/// use mere_memory_types::{ MemoryBlockEntry, SequencePosition };
///
/// MemoryBlockEntry {
///     sequence: SequencePosition {
///         position: 1, // Indexing is intended to start at 1, not 0
///         length: 2,
///     },
///     bytes: vec![ 34, 129, 87, 2 ],
/// };
/// ```
#[hdk_entry_helper]
#[derive(Clone)]
pub struct MemoryBlockEntry {
    pub sequence: SequencePosition,
    #[serde(with = "serde_bytes")]
    pub bytes: Vec<u8>,
}
