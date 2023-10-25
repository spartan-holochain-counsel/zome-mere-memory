[![](https://img.shields.io/crates/v/mere_memory_types?style=flat-square)](https://crates.io/crates/mere_memory_types)

# Mere Memory
An implementation of simple byte storage for including in Holochain DNAs.

[![](https://img.shields.io/github/issues-raw/spartan-holochain-counsel/hc-zome-mere-memory?style=flat-square)](https://github.com/spartan-holochain-counsel/hc-zome-mere-memory/issues)
[![](https://img.shields.io/github/issues-closed-raw/spartan-holochain-counsel/hc-zome-mere-memory?style=flat-square)](https://github.com/spartan-holochain-counsel/hc-zome-mere-memory/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/spartan-holochain-counsel/hc-zome-mere-memory?style=flat-square)](https://github.com/spartan-holochain-counsel/hc-zome-mere-memory/pulls)


## Overview

### Features

- Breakdown large objects into 2MB or less (2,097,152 bytes)
- Lookup memory by hash


## Usage

### Include `mere_memory` WASMs in DNA

Example using Mere Memory zomes in a DNA manifest (example)
```yaml
manifest_version: "1"
name: storage
integrity:
  uid: "00000000-0000-0000-0000-000000000000"
  properties: ~
  origin_time: "2022-07-21T00:00:00.000000Z"
  zomes:
    - name: mere_memory
      bundled: ./path/to/mere_memory.wasm
    # ...other integrity zomes
coordinator:
  zomes:
    - name: mere_memory_api
      bundled: ./path/to/mere_memory_api.wasm
      dependencies:
        - name: mere_memory
    # ...other coordinator zomes
```

### Example using `@spartan-hc/app-interface-client`

**NOTES:** replace `APP_PORT`, `APP_ID`, and `DNA_NAME` with runtime specific values.

```js
import { AppInterfaceClient } from '@spartan-hc/app-interface-client';
import { MereMemoryZomelet } from '@spartan-hc/mere-memory-zomelets';

const client = new AppInterfaceClient( APP_PORT );
const app_client = await client.app( APP_ID );

const cell = app_client.createCellInterface( DNA_NAME, {
    "mere_memory_api": MereMemoryZomelet,
});

const mere_memory = cell.zomes.mere_memory_api.functions;

let addr = await mere_memory.save( bytes );
// EntryHash
let memory = await mere_memory.remember( addr );
// {
//     "author": Uint8Array { 132, 32, 36, 161, 226, 10, 210, 252, 95, 97, 22, 166, 218, 112, 206, 215, 16, 18, 223, 224, 167, 38, 207, 69, 26, 174, 146, 123, 163, 163, 159, 5, 44, 98, 57, 10, 121, 88, 173 },
//     "published_at": 1696629542906,
//     "hash": "1a0c2184ebeaeb1ac7949d10699e728e9218d9cf340ca99cd9412413cd07e599",
//     "memory_size": 2954,
//     "block_addresses": [
//          Uint8Array { 132, 33, 36, 17, 76, 124, 124, 162, 198, 86, 83, 2, 196, 220, 74, 85, 113, 42, 191, 113, 202, 78, 140, 15, 247, 220, 148, 164, 35, 40, 242, 91, 127, 88, 54, 246, 28, 0, 148 }
//     ]
// }
```


### Holochain Compatibility Map
For information on which versions of this package work for each Holochain release, see
[docs/Holochain_Version_Map.md](docs/Holochain_Version_Map.md)


### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)


## Mere Memory Types Crate
See [mere_memory_types/README.md](mere_memory_types/README.md)


## Zomelets NPM Package

See [zomelets/README.md](zomelets/README.md)
