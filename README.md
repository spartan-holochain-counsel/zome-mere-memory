
# Mere Memory
This package is intended to be built as WASM and used as a Zome in Holochain DNAs.


[![](https://img.shields.io/github/issues-raw/mjbrisebois/hc-zome-mere-memory?style=flat-square)](https://github.com/mjbrisebois/hc-zome-mere-memory/issues)
[![](https://img.shields.io/github/issues-closed-raw/mjbrisebois/hc-zome-mere-memory?style=flat-square)](https://github.com/mjbrisebois/hc-zome-mere-memory/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/mjbrisebois/hc-zome-mere-memory?style=flat-square)](https://github.com/mjbrisebois/hc-zome-mere-memory/pulls)


### Holochain Version Map
For information on which versions of this package work for each Holochain release, see
[docs/Holochain_Version_Map.md](docs/Holochain_Version_Map.md)


### Build the WASM
Clone the Github repo
[mjbrisebois/hc-zome-mere-memory](https://github.com/mjbrisebois/hc-zome-mere-memory) and run

```bash
nix-shell
[nix-shell$] make zomes/target/wasm32-unknown-unknown/release/mere_memory.wasm
```


### Include `mere_memory` WASM in DNA
Add the WASM for this zome to your DNA manifest (example)

```yaml
manifest_version: "1"
...
zomes:
  - name: mere_memory
    bundled: path/to/mere_memory.wasm
  # ...other zomes
```


### Usage

## Add calls to your other zomes
Then, from your other zomes, you can call zome functions in 'mere_memory' (example)

```rust
let bytes : Vec<u8> = vec![188, 100, 88, 152, 212, 211, 212, 13];
let response = call(
    None,
    "mere_memory".into(),
    "save_bytes".into(),
    None,
    bytes,
)?;
```
