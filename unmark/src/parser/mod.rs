use std::cell::RefCell;

use comrak::{
    arena_tree::Node,
    nodes::{Ast, AstNode},
    Arena,
};
use serde::Deserialize;

pub mod custom_component;
pub mod frontmatter;

pub fn parse<'a, 'b, T: 'a + Deserialize<'a>>(
    arena: &'b Arena<AstNode<'b>>,
    src: &'a str,
) -> Result<(T, &'b Node<'b, RefCell<Ast>>), frontmatter::Error> {
    let (frontmatter, src): (T, &str) = frontmatter::parse_frontmatter(src)?;
    let root = comrak::parse_document(arena, src, &comrak::ComrakOptions::default());
    Ok((frontmatter, root))
}
