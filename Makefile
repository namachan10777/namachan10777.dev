DIST := ./dist
ARTICLE_DIR := ./articles
ARTICLE_SRCS := $(wildcard $(ARTICLE_DIR)/*.saty)
ARTICLES := $(addprefix $(DIST)/,$(patsubst %.saty,%.xhtml,$(ARTICLE_SRCS)))

.PHONY: all clean
all: $(ARTICLES)

$(DIST)/$(ARTICLE_DIR)/%.xhtml: $(ARTICLE_DIR)/%.saty Makefile
	mkdir -p $(DIST)/$(ARTICLE_DIR)
	satysfi -b --text-mode xhtml $< -o $@

clean:
	rm -rf $(DIST)
