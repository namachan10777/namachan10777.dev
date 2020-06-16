#[macro_use]
extern crate pest_derive;

#[macro_use]
pub mod xml;
mod parser;

#[derive(PartialEq, Debug)]
pub enum Value {
    Int(i64),
    Float(f64),
    Str(String),
}
