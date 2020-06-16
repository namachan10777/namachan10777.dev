#[macro_use]
extern crate pest_derive;

#[macro_use]
pub mod xml;
mod parser;

use std::collections::HashMap;
#[derive(PartialEq, Debug)]
pub enum Value {
    Int(i64),
    Float(f64),
    Str(String),
    Text(Vec<TextElem>),
}

#[derive(PartialEq, Debug)]
pub struct Cmd {
    name: String,
    attrs: HashMap<String, Value>,
    inner: Vec<TextElem>,
}

#[derive(PartialEq, Debug)]
pub enum TextElem {
    Cmd(Cmd),
    Plain(String),
}
