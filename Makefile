
STORAGE_DNA		= tests/storage.dna
STORAGE_APP		= tests/storage.happ

# Integrity Zomes
MERE_MEMORY_WASM	= zomes/mere_memory.wasm

# Coordinator WASMs
MERE_MEMORY_CSR_WASM	= zomes/mere_memory_csr.wasm

TARGET			= release
TARGET_DIR		= target/wasm32-unknown-unknown/release

TYPES_DIR		= crates/mere_memory_types
INT_DIR			= zomes/mere_memory
CSR_DIR			= zomes/mere_memory_csr
COMMON_SOURCE_FILES	= Makefile Cargo.toml \
				$(TYPES_DIR)/Cargo.toml $(TYPES_DIR)/src/*.rs
INT_SOURCE_FILES	= $(COMMON_SOURCE_FILES) \
				$(INT_DIR)/Cargo.toml $(INT_DIR)/src/*.rs
CSR_SOURCE_FILES	= $(INT_SOURCE_FILES) \
				$(CSR_DIR)/Cargo.toml $(CSR_DIR)/src/*.rs


#
# Project
#
rust_comile_fix:
	touch crates/mere_memory_types/src/lib.rs # force rebuild otherwise rust fails

zomes:
	mkdir $@

$(MERE_MEMORY_WASM):
$(MERE_MEMORY_CSR_WASM):
zomes/%.wasm:			$(TARGET_DIR)/%.wasm
	@echo -e "\x1b[38;2mCopying WASM ($<) to 'zomes' directory: $@\x1b[0m"; \
	cp $< $@

$(TARGET_DIR)/%.wasm:		$(INT_SOURCE_FILES)
	rm -f zomes/$*.wasm
	@echo -e "\x1b[37mBuilding zome '$*' -> $@\x1b[0m";
	RUST_BACKTRACE=1 cargo build --release \
	    --target wasm32-unknown-unknown \
	    --package $*
	@touch $@ # Cargo must have a cache somewhere because it doesn't update the file time

$(TARGET_DIR)/%_csr.wasm:	zomes $(CSR_SOURCE_FILES)
	rm -f zomes/$*_csr.wasm
	@echo -e "\x1b[37mBuilding zome '$*_csr' -> $@\x1b[0m";
	RUST_BACKTRACE=1 cargo build --release \
	    --target wasm32-unknown-unknown \
	    --package $*_csr
	@touch $@ # Cargo must have a cache somewhere because it doesn't update the file time

$(STORAGE_DNA):			tests/dna/dna.yaml $(MERE_MEMORY_WASM) $(MERE_MEMORY_CSR_WASM)
	hc dna pack -o $@ $$(dirname $<)
$(STORAGE_APP):			tests/app/happ.yaml $(STORAGE_DNA)
	hc app pack -o $@ $$(dirname $<)

npm-reinstall-local:
	cd tests; npm uninstall $(NPM_PACKAGE); npm i --save $(LOCAL_PATH)
npm-reinstall-public:
	cd tests; npm uninstall $(NPM_PACKAGE); npm i --save $(NPM_PACKAGE)

npm-use-app-interface-client-public:
npm-use-app-interface-client-local:
npm-use-app-interface-client-%:
	NPM_PACKAGE=@spartan-hc/app-interface-client LOCAL_PATH=../../app-interface-client-js make npm-reinstall-$*

npm-use-backdrop-public:
npm-use-backdrop-local:
npm-use-backdrop-%:
	NPM_PACKAGE=@spartan-hc/holochain-backdrop LOCAL_PATH=../../node-backdrop make npm-reinstall-$*

npm-use-holo-hash-public:
npm-use-holo-hash-local:
npm-use-holo-hash-%:
	NPM_PACKAGE=@spartan-hc/holo-hash LOCAL_PATH=../../holo-hash-js make npm-reinstall-$*


#
# Packages
#
preview-crate:
	DEBUG_LEVEL=debug make -s test
	cargo publish -p mere_memory_types --dry-run --allow-dirty
publish-crate:			.cargo/credentials
	make -s test
	cargo publish -p mere_memory_types
.cargo/credentials:
	mkdir -p .cargo
	cp ~/$@ $@



#
# Testing
#
DEBUG_LEVEL	       ?= warn
TEST_ENV_VARS		= LOG_LEVEL=$(DEBUG_LEVEL)
MOCHA_OPTS		= -n enable-source-maps -t 5000

%/package-lock.json:	%/package.json
	touch $@
%/node_modules:		%/package-lock.json
	cd $*; npm install
	touch $@

# 'build' target used by workflow
build:			$(CORE_WASM) $(MERE_MEMORY_WASM)
test:
	make -s test-integration

test-integration:
	make -s test-integration-basic
	make -s test-integration-large-memory

test-integration-basic:		$(STORAGE_DNA) tests/node_modules zomelets/node_modules
	cd tests; $(TEST_ENV_VARS) npx mocha $(MOCHA_OPTS) integration/test_basic.js

test-integration-large-memory:	$(STORAGE_DNA) tests/node_modules zomelets/node_modules
	cd tests; $(TEST_ENV_VARS) npx mocha $(MOCHA_OPTS) integration/test_large_memory.js



#
# Documentation
#
test-docs:
	cargo test -p mere_memory_types --doc
build-docs:			test-docs
	cargo doc -p mere_memory_types

PRE_HDI_VERSION = hdi = "0.5.0-dev.10"
NEW_HDI_VERSION = hdi = "0.5.0-dev.12"

PRE_HDK_VERSION = hdk = "0.4.0-dev.10"
NEW_HDK_VERSION = hdk = "0.4.0-dev.14"

PRE_HH_VERSION = version = "0.4.0-dev.9"
NEW_HH_VERSION = version = "0.4.0-dev.11"

GG_REPLACE_LOCATIONS = ':(exclude)*.lock' types/ zomes/ dnas/ tests/

update-hdi-version:
	git grep -l '$(PRE_HDI_VERSION)' -- $(GG_REPLACE_LOCATIONS) | xargs sed -i 's|$(PRE_HDI_VERSION)|$(NEW_HDI_VERSION)|g'
update-hdk-version:
	git grep -l '$(PRE_HDK_VERSION)' -- $(GG_REPLACE_LOCATIONS) | xargs sed -i 's|$(PRE_HDK_VERSION)|$(NEW_HDK_VERSION)|g'
update-holo-hash-version:
	git grep -l '$(PRE_HH_VERSION)' -- $(GG_REPLACE_LOCATIONS) | xargs sed -i 's|$(PRE_HH_VERSION)|$(NEW_HH_VERSION)|g'



#
# Repository
#
clean-remove-chaff:
	@find . -name '*~' -exec rm {} \;
clean-files:		clean-remove-chaff
	git clean -nd
clean-files-force:	clean-remove-chaff
	git clean -fd
clean-files-all:	clean-remove-chaff
	git clean -ndx
clean-files-all-force:	clean-remove-chaff
	git clean -fdx



#
# NPM packaging
#
prepare-zomelets-package:	zomelets/node_modules
	cd zomelets; rm -f dist/*
	cd zomelets; npx webpack
	cd zomelets; MODE=production npx webpack
	cd zomelets; gzip -kf dist/*.js
preview-zomelets-package:	clean-files prepare-zomelets-package
	DEBUG_LEVEL=trace make -s test
	cd zomelets; npm pack --dry-run .
create-zomelets-package:	clean-files prepare-zomelets-package
	DEBUG_LEVEL=trace make -s test
	cd zomelets; npm pack .
publish-zomelets-package:	clean-files prepare-zomelets-package
	DEBUG_LEVEL=trace make -s test
	cd zomelets; npm publish --access public .
