use super::super::{Inline,Block};
use super::super::ArticleSource;
use std::collections::HashMap;

fn read_header(article: &ArticleSource) -> Option<Vec<Inline>> {
    for elem in &article.body {
        if let Block::Section(heading, _) = elem {
            return Some(heading.to_vec())
        }
    }
    None
}

pub fn f(articles: Vec<ArticleSource>) -> Vec<ArticleSource> {
    let mut hash = HashMap::new();
    for article in &articles {
        hash.insert(article.path.clone(), read_header(&article));
    }
    println!("{:?}", hash);
    articles
}
