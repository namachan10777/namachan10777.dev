DIST := dist
ARTICLE_DIR := articles
ARTICLE_SRCS := $(wildcard $(ARTICLE_DIR)/*.saty)
ARTICLES := $(addprefix $(DIST)/,$(patsubst %.saty,%.html,$(ARTICLE_SRCS)))

SPECIAL_DIR := specials
SPECIAL_SRCS := $(wildcard $(SPECIAL_DIR)/*)
SPECIAL_TARGETS := $(subst specials,$(DIST),$(SPECIAL_SRCS))

RESOURCE_DIR := res
RESOURCE_SRCS := $(wildcard $(RESOURCE_DIR)/*)
RESOURCE_TARGETS := $(addprefix $(DIST)/,$(RESOURCE_SRCS))

THIRDPARTY_DIR := 3rdparty
THIRDPARTY_SRCS := $(wildcard $(THIRDPARTY_DIR)/*)
THIRDPARTY_TARGETS := $(addprefix $(DIST)/,$(THIRDPARTY_SRCS))

ENTRY_SRC := index.saty
ENTRY_TARGET := $(DIST)/index.html

NOTFOUND_SRC := 404.saty
NOTFOUND_TARGET := $(DIST)/404.html

.PHONY: all clean 

all: $(ARTICLES) $(RESOURCE_TARGETS) $(THIRDPARTY_TARGETS) $(SPECIAL_TARGETS) $(ENTRY_TARGET) $(NOTFOUND_TARGET) $(DIST)/$(ARTICLE_DIR)/article.css $(DIST)/index.css Makefile

$(DIST)/$(ARTICLE_DIR):
	mkdir -p $(DIST)/$(ARTICLE_DIR)

$(DIST)/$(RESOURCE_DIR):
	mkdir -p $(DIST)/$(RESOURCE_DIR)

$(DIST)/%: $(SPECIAL_DIR)/% Makefile
	cp $< $@

$(DIST)/%: $(SPECIAL_DIR)/% Makefile
	cp $< $@

$(DIST)/$(RESOURCE_DIR)/%: $(RESOURCE_DIR)/% Makefile
	mkdir -p $(DIST)/res
	cp $< $@

$(DIST)/$(THIRDPARTY_DIR)/%: $(THIRDPARTY_DIR)/% Makefile
	mkdir -p $(DIST)/3rdparty
	cp $< $@

$(DIST)/index.css: index.css Makefile
	cp $< $@

$(DIST)/$(ARTICLE_DIR)/article.css: $(ARTICLE_DIR)/article.css $(DIST)/$(ARTICLE_DIR) Makefile
	cp $< $@

$(ENTRY_TARGET): $(ENTRY_SRC) jsblog.satyh-html Makefile
	satysfi -b --text-mode html $< -o $@

$(NOTFOUND_TARGET): $(NOTFOUND_SRC) jsblog.satyh-html Makefile
	satysfi -b --text-mode html $< -o $@

$(DIST)/$(ARTICLE_DIR)/%.html: $(ARTICLE_DIR)/%.saty jsblog.satyh-html $(DIST)/$(ARTICLE_DIR) Makefile
	mkdir -p $(DIST)/$(ARTICLE_DIR)
	satysfi -b --text-mode html $< -o $@

clean:
	rm -rf $(DIST)
	rm *.satysfi-aux
