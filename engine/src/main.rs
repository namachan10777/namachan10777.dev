extern crate engine;
use std::fs;

fn main() {
    let app = clap::App::new("blog engine")
        .arg(clap::Arg::with_name("ROOT").required(true).index(1))
        .get_matches();

    let s = fs::read_to_string(app.value_of("ROOT").unwrap()).unwrap();
	let ast = engine::frontend::parse(&s);
	let xml = engine::conv(ast);
    println!("{}", xml);
}
