use std::{cell::RefCell, path::PathBuf};

use comrak::{
    arena_tree::Node,
    nodes::{Ast, NodeHeading, NodeValue},
};
use itertools::Itertools;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("frontmatter parse error {0}")]
    ParseFrontmatter(crate::parser::frontmatter::Error),
    #[error("h1 heading tag not found")]
    H1NotFound,
    #[error("transpile error")]
    TranspileError(crate::transpiler::Error),
    #[error("non utf-8 path {0:?}")]
    NonUtf8Path(PathBuf),
}

pub fn get_flat_inner_text<'a>(md: &'a Node<'a, RefCell<Ast>>) -> String {
    if let NodeValue::Text(text) = &md.data.borrow().value {
        text.clone()
    } else {
        md.children().map(get_flat_inner_text).join("")
    }
}

pub fn get_h1_inner_text<'a>(md: &'a Node<'a, RefCell<Ast>>) -> Option<String> {
    if let NodeValue::Heading(NodeHeading { level: 1, .. }) = md.data.borrow().value {
        Some(get_flat_inner_text(md))
    } else {
        md.children().flat_map(get_h1_inner_text).next()
    }
}
