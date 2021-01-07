use super::convert::Context;
use super::{Location, Parsed, TextElemAst};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use syntect::parsing::SyntaxSet;

type ArticleHeading = (PathBuf, Vec<TextElemAst>);

type ArticleInfo = (
    Location,
    Option<ArticleHeading>,
    Option<ArticleHeading>,
    String,
);

pub struct Report {
    hash: HashMap<PathBuf, ArticleInfo>,
    titles: HashMap<PathBuf, Vec<(PathBuf, Vec<TextElemAst>)>>,
    ss: SyntaxSet,
}

impl Report {
    pub fn get_context<'a>(&'a self, p: &'a Path) -> Option<Context<'a>> {
        if let Some((loc, prev, next, sha256)) = &self.hash.get(p) {
            Some(Context {
                location: loc.to_owned(),
                level: 1,
                prev,
                next,
                titles: &self.titles,
                ss: &self.ss,
                sha256,
                path: p,
            })
        } else {
            None
        }
    }
}

pub fn analyze(_: &Parsed) -> Report {
    unimplemented!()
}
