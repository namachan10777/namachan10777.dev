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
    let mut previous = HashMap::new();
    let mut next = HashMap::new();
    let mut dates_with_relpath = articles
        .iter()
        .map(|article| article.date.map(|date| (article.relpath.clone(), date)))
        .filter_map(|x| x)
        .collect::<Vec<(String, usize)>>();
    dates_with_relpath.sort_by(|(_, d1), (_, d2)| d1.partial_cmp(d2).unwrap());
    let mut article_relpath_series = dates_with_relpath.iter();
    article_relpath_series.next().map(|(first, _)| {
        article_relpath_series.fold(first, |acc, (relpath, _)| {
            previous.insert(acc.clone(), relpath.clone());
            next.insert(relpath.clone(), acc.clone());
            relpath
        })
    });
    Ok(Articles {
        articles,
        hash,
        rootpath,
        syntax_set,
        previous,
        next,
    })
}
