use super::{ArticleSource, Articles, Block, Inline};
use std::collections::HashMap;
use std::path;

pub enum Error {
    H1Notfound(String),
}

fn read_header(article: &ArticleSource) -> Option<Vec<Inline>> {
    for elem in &article.body {
        if let Block::Section(heading, _) = elem {
            return Some(heading.to_vec());
        }
    }
    None
}

pub fn f<'a>(
    articles: Vec<ArticleSource>,
    rootpath: &'a path::Path,
    syntax_set: syntect::parsing::SyntaxSet,
) -> Result<Articles, Error> {
    let mut hash = HashMap::new();
    for article in &articles {
        hash.insert(
            article.relpath.clone(),
            read_header(&article).ok_or_else(|| Error::H1Notfound(article.relpath.clone()))?,
        );
    }
    Ok(Articles {
        articles,
        hash,
        rootpath,
        syntax_set,
    })
}
