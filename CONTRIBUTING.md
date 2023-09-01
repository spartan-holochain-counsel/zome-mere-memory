[back to README.md](README.md)

# Contributing

## Overview
The purpose of this project is to build Holochain zomes that implement simple byte storage.


## Development


### Environment

- Developed using rustc `1.66.1 (90743e729 2023-01-10)`
- Enter `nix develop` for development environment dependencies.

### Building

Make targets
```
make target/wasm32-unknown-unknown/release/mere_memory.wasm
make target/wasm32-unknown-unknown/release/mere_memory_api.wasm
```

#### Crate Documentation

```
make build-docs
```

### Release Process
Each release involves publishing the `mere_memory_types` crate and creating a Github release.

#### Publishing Types Crate

https://crates.io/crates/mere_memory_types

```
make preview-crate
make publish-crate
```

#### Github Release
https://github.com/spartan-holochain-counsel/hc-zome-mere-memory/releases

##### Version Tag
Follow semantic versioning rules

##### Release title format
Replace
- `<Version>` with the tagged version

```
Mere Memory v<Version>
```

##### Release desciption format
Replace in description
- `<Holochain version>` with the Holochain version that is being used in [`flake.nix`](flake.nix)
- `<HDI version>` with the `hdi` version used in [`mere_memory/Cargo.toml`](mere_memory/Cargo.toml)
- `<HDK version>` with the `hdk` version used in [`Cargo.toml`](Cargo.toml)

```
## Context

- Tested using [Holochain `v<Holochain version>`](https://github.com/holochain/holochain/tree/holochain-<Holochain version>)
- [HDI `v<HDI version>`](https://docs.rs/hdi/<HDI version>/)
- [HDK `v<HDK version>`](https://docs.rs/hdk/<HDK version>/)

### Types crate
https://docs.rs/mere_memory_types/0.88.0/
```

Upload WASMS
- Integrity - `mere_memory.wasm`
- Coordinatory - `mere_memory_api.wasm`

#### Update Holochain Version Map

Add new version to [docs/Holochain_Version_Map.md](docs/Holochain_Version_Map.md)


### Testing

To run all tests with logging
```
make test-debug
```

> **NOTE:** remove `-debug` to run tests without logging
