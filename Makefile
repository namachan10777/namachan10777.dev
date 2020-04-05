DIST := ./dist
ARTICLE_DIR := ./articles
ARTICLE_SRCS := $(wildcard $(ARTICLE_DIR)/*.saty)
ARTICLES := $(addprefix $(DIST)/,$(patsubst %.saty,%.xhtml,$(ARTICLE_SRCS)))

CSS_TARGET := $(DIST)/index.css
ABOUTME_TARGET := $(DIST)/aboutme.md
KEYBASE_TARGET := $(DIST)/keybase.txt
REDIRECTS_TAREGET := $(DIST)/_redirects

COPY_SRCS := \
	index.css \
	aboutme.md \
	keybase.txt \
	index.xhtml \
	_redirects
COPY_TARGETS := $(addprefix $(DIST)/,$(COPY_SRCS))

RESOURCE_SRCS += $(shell find res -type f)
RESOURCE_TARGETS += $(addprefix $(DIST)/,$(RESOURCE_SRCS))

.PHONY: all clean
all: $(ARTICLES) $(COPY_TARGETS) $(RESOURCE_TARGETS)

$(COPY_TARGETS): $(COPY_SRCS) Makefile
	cp $< $@

$(RESOURCE_TARGETS): $(RESOURCE_SRCS) Makefile
	mkdir -p $(DIST)/res
	cp $< $@

$(DIST)/$(ARTICLE_DIR)/%.xhtml: $(ARTICLE_DIR)/%.saty Makefile
	mkdir -p $(DIST)/$(ARTICLE_DIR)
	satysfi -b --text-mode xhtml $< -o $@

clean:
	rm -rf $(DIST)
