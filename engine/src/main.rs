extern crate engine;
extern crate regex;
extern crate serde_json;
extern crate syntect;
extern crate zip;
use std::ffi::OsStr;
use std::fmt;
use std::fs;
use std::io::{Read, Write};
use std::path;

fn process(cfg_path: &path::Path, dest_path: &path::Path) -> Result<(), String> {
    let cfg_str =
        fs::read_to_string(cfg_path).map_err(|e| format!("{}: {:?}", cfg_path.display(), e))?;
    let cfg = serde_json::from_str::<engine::Config>(cfg_str.as_str()).map_err(|e| {
        format!(
            "{}: syntax error at {}:{}",
            cfg_path.display(),
            e.line(),
            e.column()
        )
    })?;
    let syntax_set = syntect::parsing::SyntaxSet::load_defaults_newlines();
    let root = cfg_path.parent().unwrap();
    let article_re = regex::Regex::new(cfg.article.as_str()).map_err(|e| format!("{}", e))?;
    let mut zipfile = zip::ZipWriter::new(
        fs::File::create(dest_path).map_err(|e| format!("{}: {:?}", dest_path.display(), e))?,
    );
    let mut articles = Vec::new();
    let options = zip::write::FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);
    let mut miscs = Vec::new();
    for entry_path in enumerate_files(cfg_path.parent().unwrap()) {
        let pathstr = entry_path.to_str().unwrap();
        if article_re.is_match(pathstr) {
            println!("article: {:?}", entry_path);
            let cnt = entry_path.iter().zip(&mut root.iter()).count();
            let relpath = entry_path.iter().collect::<Vec<&OsStr>>()[cnt..]
                .iter()
                .map(|s| s.to_str().unwrap())
                .collect::<Vec<&str>>()
                .join("/");
            let src = fs::read_to_string(&entry_path)
                .map_err(|e| format!("{}: {:?}", entry_path.display(), e))?;
            let ast = engine::parser::parse(entry_path.to_str().unwrap().to_owned(), src.as_str());
            articles.push(engine::ArticleSource {
                path: entry_path.canonicalize().unwrap().to_owned(),
                body: ast.unwrap(),
                relpath,
            });
        } else if cfg_path != entry_path {
            let cnt = entry_path.iter().zip(&mut root.iter()).count();
            let relpath = entry_path.iter().collect::<Vec<&OsStr>>()[cnt..]
                .iter()
                .map(|s| s.to_str().unwrap())
                .collect::<Vec<&str>>()
                .join("/");
            let mut buf = Vec::new();
            let mut f = fs::File::open(entry_path.clone())
                .map_err(|e| format!("{}: {:?}", entry_path.display(), e))?;
            f.read_to_end(&mut buf)
                .map_err(|e| format!("{}: {:?}", entry_path.display(), e))?;
            miscs.push((buf, relpath));
        }
    }
    let rootpath = cfg_path.parent().unwrap().canonicalize().unwrap();
    let article = engine::analysis::f(articles, &rootpath, syntax_set).map_err(|e| match e {
        engine::analysis::Error::H1Notfound(relpath) => format!("h1 not found from {}", relpath),
    })?;
    println!("{:?}", article.hash);
    for (path, xml) in article.into_xmls().map_err(|e| match e {
        engine::Error::UnresolvedLink(link) => format!("unresolved link {}", link),
        engine::Error::UnresolvedBlockExt(ext) => format!("unresolved block extension {}", ext),
        engine::Error::UnresolvedInlineExt(ext) => format!("unresolved inline extension {}", ext),
    })? {
        println!("{:?}", &path::Path::new(&path).with_extension("xhtml"));
        zipfile
            .start_file_from_path(&path::Path::new(&path).with_extension("xhtml"), options)
            .unwrap();
        let mut buf = String::new();
        fmt::write(&mut buf, format_args!("{}", xml)).unwrap();
        zipfile.write_all(&buf.as_bytes()).unwrap();
    }
    for (buf, relpath) in miscs {
        zipfile
            .start_file_from_path(path::Path::new(&relpath), options)
            .unwrap();
        zipfile.write_all(&buf).unwrap();
    }
    let ts = syntect::highlighting::ThemeSet::load_defaults();
    let light_theme = &ts.themes["Solarized (light)"];
    let css_light = syntect::html::css_for_theme(light_theme);
    zipfile
        .start_file_from_path(path::Path::new("syntect-highlight.css"), options)
        .unwrap();
    zipfile.write_all(&css_light.as_bytes()).unwrap();
    zipfile.finish().unwrap();
    Ok(())
}

fn enumerate_files(path: &path::Path) -> Vec<path::PathBuf> {
    let mut entires = Vec::new();
    for entry in fs::read_dir(path).unwrap() {
        let path = entry.unwrap().path();
        if path.is_file() {
            entires.push(path.to_owned());
        } else {
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
    let dest_path = path::Path::new(app.value_of("DEST").unwrap());
    match process(cfg_path, dest_path) {
        Ok(()) => {
            std::process::exit(0);
        }
        Err(msg) => {
            eprintln!("{}", msg);
            std::process::exit(-1);
        }
    }
}
