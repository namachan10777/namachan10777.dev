extern crate pest;
#[macro_use]
extern crate pest_derive;
#[macro_use]
extern crate serde_derive;
extern crate serde;

pub mod ast2xml;
pub mod codegen;
pub mod parser;

use std::path;

#[derive(Deserialize, Debug)]
pub struct Config {
    pub article: String,
}

struct ArticleSource {
    body: Vec<parser::Block>,
    path: path::Path,
}
