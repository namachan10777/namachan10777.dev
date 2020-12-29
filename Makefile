.PHONY: all preview clean test

ENGINE_DIR = engine
RUST_SOURCES = $(shell find $(ENGINE_DIR)/src -type f -name *.rs) $(ENGINE_DIR)/Cargo.lock $(ENGINE_DIR)/Cargo.toml
ENGINE_EXE = $(ENGINE_DIR)/target/release/engine
DIST = dist
PUBLIC_DIR = public
WEB_RESOURCES = $(shell find $(PUBLIC_DIR) -type f)

$(ENGINE_EXE): $(RUST_SOURCES)
	cd $(ENGINE_DIR) && cargo build --release

$(DIST)/public.zip: $(WEB_RESOURCES) $(ENGINE_EXE)
	mkdir -p $(DIST)
	./$(ENGINE_EXE) $(PUBLIC_DIR) $@

preview: $(DIST)/public.zip
	cd $(DIST) && unzip -o public.zip

all: $(DIST)/public.zip

clean:
	rm -f $(shell find . -type f -name '*.html')
	rm -rf $(DIST)/*

test:
	cd $(ENGINE_DIR) && cargo test
