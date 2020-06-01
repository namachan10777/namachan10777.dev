use super::super::ArticleSource;
use super::super::{Block, Inline, ListItem};
use std::collections::HashMap;

fn read_header(article: &ArticleSource) -> Option<Vec<Inline>> {
    for elem in &article.body {
        if let Block::Section(heading, _) = elem {
            return Some(heading.to_vec());
        }
    }
    None
}

fn conv_block(map: &HashMap<String, Vec<Inline>>, block: Block) -> Block {
    match block {
        Block::Section(inlines, blocks) => Block::Section(
            inlines.into_iter().map(|i| conv_inline(map, i)).collect(),
            blocks.into_iter().map(|b| conv_block(map, b)).collect(),
        ),
        Block::ExtBlock(extname, blocks) => Block::ExtBlock(
            extname,
            blocks.into_iter().map(|b| conv_block(map, b)).collect(),
        ),
        Block::P(inlines) => Block::P(inlines.into_iter().map(|i| conv_inline(map, i)).collect()),
        Block::Ul(li) => Block::Ul(li.into_iter().map(|li| conv_listitem(map, li)).collect()),
        Block::Code(lang, src) => Block::Code(lang, src),
    }
}

fn conv_inline(map: &HashMap<String, Vec<Inline>>, inline: Inline) -> Inline {
    match inline {
        Inline::Ext(extname, extvalue) => match extname.as_str() {
            "link" => Inline::Link(map.get(&extvalue).unwrap().to_vec(), extvalue),
            _ => Inline::Ext(extname, extvalue),
        },
        Inline::Link(inlines, url) => Inline::Link(
            inlines.into_iter().map(|i| conv_inline(map, i)).collect(),
            url,
        ),
        Inline::Img(alt, url) => Inline::Img(alt, url),
        Inline::Code(src) => Inline::Code(src),
        Inline::Text(txt) => Inline::Text(txt),
    }
}

fn conv_listitem(map: &HashMap<String, Vec<Inline>>, listitem: ListItem) -> ListItem {
    match listitem {
        ListItem::Block(block) => ListItem::Block(conv_block(map, block)),
        ListItem::Nest(li) => {
            ListItem::Nest(li.into_iter().map(|li| conv_listitem(map, li)).collect())
        }
        ListItem::Dummy => ListItem::Dummy,
    }
}

pub fn f(articles: Vec<ArticleSource>) -> Vec<ArticleSource> {
    let mut hash = HashMap::new();
    for article in &articles {
        hash.insert(
            article.path.to_str().unwrap().to_owned(),
            read_header(&article).unwrap(),
        );
    }
    articles
        .into_iter()
        .map(|article| {
            let ArticleSource { body, path } = article;
            ArticleSource {
                path,
                body: body.into_iter().map(|b| conv_block(&hash, b)).collect(),
            }
        })
        .collect()
}
