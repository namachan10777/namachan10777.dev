extern crate engine;
extern crate regex;
extern crate serde_json;
extern crate zip;
use std::fmt;
use std::fs;
use std::io::Write;
use std::path;

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
    for entry in fs::read_dir(cfg_path.parent().unwrap()).unwrap() {
        let entry_path = entry.unwrap().path();
        let pathstr = entry_path.to_str().unwrap();
        if article_re.is_match(pathstr) {
            let target_name = pathstr.trim_end_matches(".md").to_owned() + ".xhtml";
            let src = fs::read_to_string(&entry_path).unwrap();
            let ast = engine::parser::parse(src.as_str());
            articles.push(engine::ArticleSource {
                path: path::Path::new(&target_name).to_owned(),
                body: ast,
            });
        } else if cfg_path != entry_path {
            println!("other: {:?}", pathstr);
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
    zipfile.finish().unwrap();
}
