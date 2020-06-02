extern crate engine;
extern crate regex;
extern crate serde_json;
extern crate zip;
use std::fmt;
use std::fs;
use std::io::{Read, Write};
use std::path;
use std::fs::DirEntry;

fn enumerate_files(path: &path::Path) -> Vec<path::PathBuf> {
    let mut entires = Vec::new();
    for entry in fs::read_dir(path).unwrap() {
        let path = entry.unwrap().path();
        if path.is_file() {
            entires.push(path.to_owned());
        }
        else {
            entires.append(&mut enumerate_files(&path));
        }
    }
    entires
}

fn main() {
    let app = clap::App::new("blog engine")
        .arg(
            clap::Arg::with_name("CONFIG")
                .required(true)
                .short("c")
                .takes_value(true)
                .long("config"),
        )
        .arg(
            clap::Arg::with_name("DEST")
                .required(true)
                .short("d")
                .takes_value(true)
                .long("dest"),
        )
        .get_matches();
    let cfg_path = path::Path::new(app.value_of("CONFIG").unwrap());
    let cfg_str = fs::read_to_string(cfg_path).unwrap();
    let cfg = serde_json::from_str::<engine::Config>(cfg_str.as_str()).unwrap();
    let article_re = regex::Regex::new(cfg.article.as_str()).unwrap();
    let mut zipfile = zip::ZipWriter::new(fs::File::create(app.value_of("DEST").unwrap()).unwrap());
    let mut articles = Vec::new();
    let options = zip::write::FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);
    let mut miscs = Vec::new();
    for entry_path in enumerate_files(cfg_path.parent().unwrap()) {
        let pathstr = entry_path.to_str().unwrap();
        if article_re.is_match(pathstr) {
            println!("article: {:?}", entry_path);
            let target_name = pathstr.trim_end_matches(".md").to_owned() + ".xhtml";
            let src = fs::read_to_string(&entry_path).unwrap();
            let ast = engine::parser::parse(src.as_str());
            articles.push(engine::ArticleSource {
                path: path::Path::new(&target_name).to_owned(),
                body: ast,
            });
        } else if cfg_path != entry_path {
            println!("misc: {:?}", entry_path);
            miscs.push(entry_path);
        }
    }
    let article = engine::analysis::f(articles, &cfg_path.parent().unwrap());
    println!("{:?}", article.hash);
    for (path, xml) in article.into_xmls() {
        zipfile.start_file_from_path(&path, options).unwrap();
        let mut buf = String::new();
        fmt::write(&mut buf, format_args!("{}", xml)).unwrap();
        zipfile.write_all(&buf.as_bytes()).unwrap();
    }
    for misc_path in miscs {
        zipfile.start_file_from_path(&misc_path, options).unwrap();
        let mut buf = Vec::new();
        let mut f = fs::File::open(misc_path).unwrap();
        f.read_to_end(&mut buf).unwrap();
        zipfile.write_all(&buf).unwrap();
    }
    zipfile.finish().unwrap();
}
