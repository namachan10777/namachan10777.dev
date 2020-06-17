extern crate engine;

use clap::{App, Arg};
use regex::Regex;
use std::fs;
use std::io::{Read, Write};

fn unwrap<T, E, F>(input: Result<T, E>, f: F) -> T
where
    F: FnOnce(E) -> (),
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
    let args = App::new("engine")
        .arg(Arg::with_name("SOURCE").required(true).takes_value(true))
        .arg(Arg::with_name("DEST").required(true).takes_value(true))
        .get_matches();
    let source_path = args.value_of("SOURCE").unwrap();
    let dest_path = args.value_of("DEST").unwrap();
    let source = unwrap(fs::read_dir(source_path), |e| eprintln!("{:?}", e));
    let tml_pat = Regex::new(".*\\.tml").unwrap();
    let mut proj = engine::Project::new();
    let zipfile = unwrap(fs::File::create(dest_path), |e| eprintln!("{:?}", e));
    let default_permission = zip::write::FileOptions::default()
        .unix_permissions(0o444)
        .compression_method(zip::CompressionMethod::Deflated);
    let mut zip = zip::ZipWriter::new(zipfile);
    for entry in source {
        let entry = unwrap(entry, |e| eprintln!("{:?}", e));
        let path = entry.path();
        let path_str = path.to_str().unwrap();
        if tml_pat.is_match(path_str) {
            let dest_path = path_str.trim_end_matches(".tml").to_owned() + ".xhtml";
            let src = unwrap(fs::read_to_string(path), |e| eprintln!("{:?}", e));
            proj.insert(
                dest_path,
                engine::File::Article(engine::Article::new(unwrap(
                    engine::parser::parse(&src),
                    |e| eprintln!("{:?}", e),
                ))),
            );
        } else {
            let mut src = Vec::new();
            let mut f = unwrap(fs::File::open(path.clone()), |e| eprintln!("{:?}", e));
            unwrap(f.read_to_end(&mut src), |e| eprintln!("{:?}", e));
            proj.insert(path_str.to_owned(), engine::File::Misc(src));
        }
    }
    let ctx = unwrap(engine::analysis::parse(&proj), |e| eprintln!("{:?}", e));
    for (dest_path, file) in proj {
        unwrap(zip.start_file_from_path(std::path::Path::new(&dest_path), default_permission), |e| eprintln!("{:?}", e));
        match file {
            engine::File::Article(article) => {
                let xml = unwrap(engine::root(ctx, article.body), |e| eprintln!("{:?}", e));
                unwrap(zip.write_all(format!("{}", xml).as_bytes()), |e| eprintln!("{:?}", e));
            }
            engine::File::Misc(blob) => {
                unwrap(zip.write_all(&blob), |e| eprintln!("{:?}", e));
            }
        }
    }
    unwrap(zip.finish(), |e| eprintln!("{:?}", e));
}
