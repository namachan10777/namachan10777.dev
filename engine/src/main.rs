extern crate engine;

use clap::{App, Arg};
use regex::Regex;
use std::fs;
use std::io::{Read, Write};

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

fn enumerate_entries(dir: &std::path::Path) -> Result<Vec<fs::DirEntry>, String> {
    let mut entries = Vec::new();
    for entry in fs::read_dir(dir).map_err(|e| format!("{:?}", e))? {
        let entry = entry.map_err(|e| format!("{:?}", e))?;
        let metadata = entry.metadata().map_err(|e| format!("{:?}", e))?;
        if metadata.is_file() {
            entries.push(entry);
        } else {
            entries.append(&mut enumerate_entries(&entry.path()).map_err(|e| format!("{:?}", e))?);
        }
    }
    Ok(entries)
}

fn main() {
    let args = App::new("engine")
        .arg(Arg::with_name("SOURCE").required(true).takes_value(true))
        .arg(Arg::with_name("DEST").required(true).takes_value(true))
        .get_matches();
    let source_path = std::path::Path::new(args.value_of("SOURCE").unwrap());
    let dest_path = std::path::Path::new(args.value_of("DEST").unwrap());
    let tml_pat = Regex::new(".*\\.tml").unwrap();
    let mut proj = engine::Project::new();
    let zipfile = unwrap(fs::File::create(dest_path), |e| eprintln!("{:?}", e));
    let default_permission = zip::write::FileOptions::default()
        .unix_permissions(0o444)
        .compression_method(zip::CompressionMethod::Deflated);
    let mut zip = zip::ZipWriter::new(zipfile);
    for entry in unwrap(enumerate_entries(&source_path), |e| eprintln!("{:?}", e)) {
        let path = entry.path();
        let path_str = path.to_str().unwrap();
        if tml_pat.is_match(path_str) {
            let dest_path = path
                .strip_prefix(source_path)
                .unwrap()
                .with_extension("html");
            let src = unwrap(fs::read_to_string(&path), |e| eprintln!("{:?}", e));
            proj.insert(
                dest_path,
                engine::File::Article(engine::Article::new(unwrap(
                    engine::parser::parse(&src),
                    |e| eprintln!("{:?}: {:?}", path, e),
                ))),
            );
        } else {
            let mut src = Vec::new();
            let mut f = unwrap(fs::File::open(path.clone()), |e| eprintln!("{:?}", e));
            unwrap(f.read_to_end(&mut src), |e| eprintln!("{:?}", e));
            let dest_path = path.strip_prefix(source_path).unwrap().to_owned();
            proj.insert(dest_path, engine::File::Misc(src));
        }
    }
    let report = unwrap(engine::analysis::parse(&proj), |e| eprintln!("{:?}", e));
    for (dest_path, file) in proj {
        let ctx = engine::Context::new(&report, &dest_path);
        unwrap(
            zip.start_file_from_path(std::path::Path::new(&dest_path), default_permission),
            |e| eprintln!("{:?}", e),
        );
        match file {
            engine::File::Article(article) => {
                let xml = unwrap(engine::root(ctx, article.body), |e| eprintln!("{:?}", e));
                unwrap(zip.write_all(format!("{}", xml).as_bytes()), |e| {
                    eprintln!("{:?}", e)
                });
            }
            engine::File::Misc(blob) => {
                unwrap(zip.write_all(&blob), |e| eprintln!("{:?}", e));
            }
        }
    }
    unwrap(
        zip.start_file_from_path(std::path::Path::new("syntect.css"), default_permission),
        |e| eprintln!("{:?}", e),
    );
    let theme_set = syntect::highlighting::ThemeSet::load_defaults();
    let light_theme = &theme_set.themes["Solarized (light)"];
    let css_light = syntect::html::css_for_theme(light_theme);
    unwrap(zip.write_all(css_light.as_bytes()), |e| {
        eprintln!("{:?}", e)
    });
    unwrap(zip.finish(), |e| eprintln!("{:?}", e));
}
