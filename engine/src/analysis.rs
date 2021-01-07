use super::convert::Context;
use super::{Parsed, Location, TextElemAst};
use std::path::{Path, PathBuf};
use std::collections::HashMap;
use syntect::parsing::SyntaxSet;

type ArticleHeading<'a> = (PathBuf, Vec<TextElemAst<'a>>);

type ArticleInfo<'a> = (Location<'a>, Option<ArticleHeading<'a>>, Option<ArticleHeading<'a>>, String);

pub struct Report<'a> {
    hash: HashMap<PathBuf, ArticleInfo<'a>>,
    titles: HashMap<PathBuf, Vec<(PathBuf, Vec<TextElemAst<'a>>)>>,
    ss: SyntaxSet,
}

impl<'a> Report<'a> {
    pub fn get_context(&'a self, p: &'a Path) -> Option<Context<'a>> {
        if let Some((loc, prev, next, sha256)) = &self.hash.get(p) {
            Some(Context {
                location: loc.to_owned(),
                level: 1,
                prev,
                next,
                titles: &self.titles,
                ss: &self.ss,
                sha256,
                path: p
            })
        }
        else {
            None
        }
    }
}

pub fn analyze<'a>(_: &Parsed<'a>) -> Report<'a> {
    unimplemented!()
}
