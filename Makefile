
MERE_MEMORY_WASM	= target/wasm32-unknown-unknown/release/mere_memory.wasm
STORAGE_DNA		= packs/dna/storage.dna
STORAGE_APP		= packs/app/storage.happ

mere-memory-zome:	$(MERE_MEMORY_WASM)

$(MERE_MEMORY_WASM):	Cargo.toml src/*.rs default.nix
	@echo "Building zome: $@"; \
	RUST_BACKTRACE=1 CARGO_TARGET_DIR=target cargo build \
		--release --target wasm32-unknown-unknown
	@touch $@ # Cargo must have a cache somewhere because it doesn't update the file time

$(STORAGE_DNA):		$(MERE_MEMORY_WASM)
	hc dna pack packs/dna/
$(STORAGE_APP):		$(STORAGE_DNA)
	hc app pack packs/app/


test:			$(STORAGE_DNA)
	cd tests; npx mocha integration/test_api.js
test-debug:		$(STORAGE_DNA)
	cd tests; LOG_LEVEL=silly npx mocha integration/test_api.js
