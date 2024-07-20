[back to README.md](README.md)

[![](https://img.shields.io/github/checks-status/spartan-holochain-counsel/zome-mere-memory/master?style=flat-square&label=master)](https://github.com/spartan-holochain-counsel/zome-mere-memory/actions/workflows/all-tests.yml)
[![](https://img.shields.io/github/checks-status/spartan-holochain-counsel/zome-mere-memory/develop?style=flat-square&label=develop)](https://github.com/spartan-holochain-counsel/zome-mere-memory/actions/workflows/all-tests.yml)

# Contributing

## Overview
The purpose of this project is to build Holochain zomes that implement simple byte storage.


## Development

### Environment

- Developed using rustc rustc `1.71.1 (eb26296b5 2023-08-03)`
- Enter `nix develop` for development environment dependencies.

### Building

Make targets
```
nix develop
[nix-shell$] make target/wasm32-unknown-unknown/release/mere_memory.wasm
[nix-shell$] make target/wasm32-unknown-unknown/release/mere_memory_api.wasm
```

#### Crate Documentation

```
make build-docs
```


### Release Process
Each release involves

1. (if changed) Publishing the `mere_memory_types` crate
2. (if changed) Publishing the `@spartan-hc/mere-memory-zomelets` NPM package
3. Creating a Github release.


#### Publishing Types Crate

https://crates.io/crates/mere_memory_types

```
make preview-crate
make publish-crate
```

#### Publishing Zomelets NPM Package

https://www.npmjs.com/package/@spartan-hc/mere-memory-zomelets

```
make preview-zomelets-package
make publish-zomelets-package
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
- `<Types version>` with the Types crate version that is in [`mere_memory_types/Cargo.toml`](mere_memory_types/Cargo.toml)
- `<Zomelets version>` with the NPM package version in [`./zomelets/package.json`](./zomelets/package.json)

```
## Context

- [@spartan-hc/mere-memory-zomelets `v<Zomelets version>`](https://www.npmjs.com/package/@spartan-hc/mere-memory-zomelets/v/<Zomelets version>)
- Tested using [Holochain `v<Holochain version>`](https://github.com/holochain/holochain/tree/holochain-<Holochain version>)
- [HDI `v<HDI version>`](https://docs.rs/hdi/<HDI version>/)
- [HDK `v<HDK version>`](https://docs.rs/hdk/<HDK version>/)

### Types crate
https://docs.rs/mere_memory_types/<Types version>/
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
