[![](https://img.shields.io/npm/v/@spartan-hc/mere-memory-zomelets/latest?style=flat-square)](http://npmjs.com/package/@spartan-hc/mere-memory-zomelets)

# Mere Memory Zomelets
Zomelet implementations for the Mere Memory zomes.

[![](https://img.shields.io/github/issues-raw/spartan-holochain-counsel/zome-mere-memory?style=flat-square)](https://github.com/spartan-holochain-counsel/zome-mere-memory/issues)
[![](https://img.shields.io/github/issues-closed-raw/spartan-holochain-counsel/zome-mere-memory?style=flat-square)](https://github.com/spartan-holochain-counsel/zome-mere-memory/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/spartan-holochain-counsel/zome-mere-memory?style=flat-square)](https://github.com/spartan-holochain-counsel/zome-mere-memory/pulls)


## Install

```bash
npm i @spartan-hc/mere-memory-zomelets
```

## Basic Usage

```js
import { CellZomelets } from '@spartan-hc/zomelets';
import { MereMemoryZomelet } from '@spartan-hc/mere-memory-zomelets';

const cell_interface = CellZomelets({
    "mere_memory_api": MereMemoryZomelet,
    // ...your other zomes
});
// Then use `cell_interface` in your Zomelet compatible client
```

See [@spartan-hc/app-interface-client](https://www.npmjs.com/package/@spartan-hc/app-interface-client) for how to use Zomelets.
