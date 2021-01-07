extern crate engine;

use clap::{App, Arg};
use std::fs;
use std::path::Path;

#[allow(dead_code)]
fn unwrap<T, E, F>(input: Result<T, E>, f: F) -> T
where
    F: FnOnce(E),
{
    match input {
        Ok(x) => x,
        Err(e) => {
            f(e);
            std::process::exit(-1)
        }
    }
}

fn main() {
    let matches = App::new("engine")
        .arg(Arg::with_name("SOURCE").required(true).takes_value(true))
        .arg(Arg::with_name("DEST").required(true).takes_value(true))
        .get_matches();
    let dir_path = Path::new(matches.value_of("SOURCE").unwrap());
    let mut writer = fs::File::create(matches.value_of("DEST").unwrap()).unwrap();
    engine::compile_and_write(&mut writer, &dir_path).unwrap();
}
