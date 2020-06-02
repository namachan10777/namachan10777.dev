use super::{ArticleSource, Articles, Block, Inline};
use std::collections::HashMap;

fn read_header(article: &ArticleSource) -> Option<Vec<Inline>> {
    for elem in &article.body {
        if let Block::Section(heading, _) = elem {
            return Some(heading.to_vec());
        }
    }
    None
}

pub fn f(articles: Vec<ArticleSource>) -> Articles {
    let mut hash = HashMap::new();
    for article in &articles {
        hash.insert(article.path.to_str().unwrap().to_owned(), read_header(&article).unwrap());
    }
    Articles { articles, hash }
}
