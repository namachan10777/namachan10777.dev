DIST := dist
ARTICLE_DIR := articles
ARTICLE_SRCS := $(wildcard $(ARTICLE_DIR)/*.saty)
ARTICLES := $(addprefix $(DIST)/,$(patsubst %.saty,%.xhtml,$(ARTICLE_SRCS)))

SPECIAL_DIR := specials
SPECIAL_SRCS := $(wildcard $(SPECIAL_DIR)/*)
SPECIAL_TARGETS := $(subst specials,$(DIST),$(SPECIAL_SRCS))

RESOURCE_DIR := res
RESOURCE_SRCS := $(wildcard $(RESOURCE_DIR)/*)
RESOURCE_TARGETS := $(addprefix $(DIST)/,$(RESOURCE_SRCS))

ENTRY_SRC := index.saty
ENTRY_TARGET := $(DIST)/index.xhtml

.PHONY: all clean 

all: $(ARTICLES) $(RESOURCE_TARGETS) $(SPECIAL_TARGETS) $(ENTRY_TARGET) $(DIST)/$(ARTICLE_DIR)/article.css $(DIST)/index.css Makefile

$(DIST)/$(ARTICLE_DIR):
	mkdir -p $(DIST)/$(ARTICLE_DIR)

$(DIST)/$(RESOURCE_DIR):
	mkdir -p $(DIST)/$(RESOURCE_DIR)

$(DIST)/%: $(SPECIAL_DIR)/% Makefile
	cp $< $@

$(DIST)/%: $(SPECIAL_DIR)/% Makefile
	cp $< $@

$(DIST)/$(RESOURCE_DIR)/%: $(RESOURCE_DIR)/% $(DIST)/$(RESOURCE_DIR) Makefile
	mkdir -p $(DIST)/res
	cp $< $@

$(DIST)/index.css: index.css Makefile
	cp $< $@

$(DIST)/$(ARTICLE_DIR)/article.css: $(ARTICLE_DIR)/article.css $(DIST)/$(ARTICLE_DIR) Makefile
	cp $< $@

$(ENTRY_TARGET): $(ENTRY_SRC) Makefile
	satysfi -b --text-mode xhtml $< -o $@

$(DIST)/$(ARTICLE_DIR)/%.xhtml: $(ARTICLE_DIR)/%.saty $(DIST)/$(ARTICLE_DIR) Makefile
	mkdir -p $(DIST)/$(ARTICLE_DIR)
	satysfi -b --text-mode xhtml $< -o $@

clean:
	rm -rf $(DIST)
	rm *.satysfi-aux
