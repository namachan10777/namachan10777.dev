extern crate engine;

use std::fs;
use clap::{App, Arg};

fn main() {
    let args = App::new("engine")
        .arg(Arg::with_name("SOURCE")
              .required(true)
              .takes_value(true)
              .short("s"))
        .get_matches();
    let file_name = args.value_of("SOURCE").unwrap();
    let src = fs::read_to_string(file_name).unwrap();
    let ast = engine::parser::parse(src.as_str());
    println!("{}", engine::root(ast).unwrap());
}
