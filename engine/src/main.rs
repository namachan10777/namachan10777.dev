extern crate engine;
extern crate serde_json;
extern crate regex;
use std::fs;
use std::path;

fn main() {
    let app = clap::App::new("blog engine")
        .arg(clap::Arg::with_name("CONFIG")
             .required(true)
             .short("c")
             .takes_value(true)
             .long("config"))
        .arg(clap::Arg::with_name("DEST")
             .required(true)
             .short("d")
             .takes_value(true)
             .long("dest"))
        .get_matches();
    let cfg_path = path::Path::new(app.value_of("CONFIG").unwrap());
    let cfg_str = fs::read_to_string(cfg_path).unwrap();
    let cfg = serde_json::from_str::<engine::Config>(cfg_str.as_str()).unwrap();
    let article_re = regex::Regex::new(cfg.article.as_str()).unwrap();
    for entry in fs::read_dir(cfg_path.parent().unwrap()).unwrap() {
        let entry_path = entry.unwrap().path();
        let pathstr = entry_path.to_str().unwrap();
        if article_re.is_match(pathstr) {
            let src = fs::read_to_string(&entry_path).unwrap();
            let ast = engine::frontend::parse(src.as_str());
            println!("article: {:#?}", ast);
        }
        else if cfg_path != entry_path {
            println!("other: {:?}", pathstr);
        }
    }
}
