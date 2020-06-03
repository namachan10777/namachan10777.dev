use super::{ArticleSource, Articles, Block, Inline};
use std::collections::HashMap;
use std::path;

fn read_header(article: &ArticleSource) -> Option<Vec<Inline>> {
    for elem in &article.body {
        if let Block::Section(heading, _) = elem {
            return Some(heading.to_vec());
        }
    }
    None
}

pub fn f<'a>(articles: Vec<ArticleSource>, rootpath: &'a path::Path) -> Articles {
    let mut hash = HashMap::new();
    for article in &articles {
        hash.insert(article.relpath.clone(), read_header(&article).unwrap());
    }
    Articles {
        articles,
        hash,
        rootpath,
    }
}
