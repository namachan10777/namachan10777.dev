extern crate pest;
#[macro_use]
extern crate pest_derive;
#[macro_use]
extern crate serde_derive;
extern crate serde;

pub mod ast2xml;
pub mod codegen;
pub mod parser;
pub mod paths;

use std::path;

#[derive(Debug, PartialEq)]
pub enum Inline {
    Text(String),
    Code(String),
    Link(Vec<Inline>, String),
    Img(String, String),
    Ext(String, String),
}

#[derive(Debug, PartialEq)]
pub enum ListItem {
    Block(Block),
    Dummy,
    Nest(Vec<ListItem>),
}

#[derive(Debug, PartialEq)]
pub enum Block {
    Section(Vec<Inline>, Vec<Block>),
    ExtBlock(String, Vec<Block>),
    P(Vec<Inline>),
    Ul(Vec<ListItem>),
    Code(String, String),
}

#[derive(Deserialize, Debug)]
pub struct Config {
    pub article: String,
}

pub struct ArticleSource<'a> {
    body: Vec<Block>,
    path: &'a path::Path,
}
