extern crate engine;

use clap::{App, Arg};
use std::collections::HashMap;
use std::ffi::OsStr;
use std::fs;
use std::io;
use std::io::Write;
use std::path::{Path, PathBuf};

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

fn enumerate_all_file_paths(dir_path: &Path) -> Vec<PathBuf> {
    let mut paths = Vec::new();
    for child in fs::read_dir(dir_path).unwrap() {
        if let Ok(child) = child {
            if let Ok(metadata) = child.metadata() {
                if metadata.is_dir() {
                    paths.append(&mut enumerate_all_file_paths(&child.path()));
                } else {
                    paths.push(child.path().to_owned());
                }
            }
        }
    }
    paths
}

fn main() {
    let matches = App::new("engine")
        .arg(Arg::with_name("SOURCE").required(true).takes_value(true))
        .arg(Arg::with_name("DEST").required(true).takes_value(true))
        .get_matches();
    let mut files = HashMap::new();
    let source_paths = enumerate_all_file_paths(&Path::new(matches.value_of("SOURCE").unwrap()));
    for p in &source_paths {
        println!("{:?}", p);
        if p.extension() == Some(OsStr::new(".tml")) && p.is_dir() {
            let source = fs::read_to_string(p).unwrap();
            let ast = engine::parser::parse(p.as_os_str().to_str().unwrap(), &source).unwrap();
            files.insert(p.to_owned(), engine::File::Tml(ast, source.into_bytes()));
        } else {
            let binary = fs::read(p).unwrap();
            files.insert(p.to_owned(), engine::File::Blob(binary));
        }
    }
    let report = engine::analysis::analyze(&files);
    let out = files
        .into_iter()
        .map(|(p, file)| match file {
            engine::File::Blob(binary) => (p, binary),
            engine::File::Tml(cmd, _) => {
                let xml = engine::convert::root(report.get_context(&p).unwrap(), cmd.0).unwrap();
                (p, xml.to_string().into_bytes())
            }
        })
        .collect::<HashMap<_, _>>();
    let mut dist = fs::File::create(Path::new(matches.value_of("DEST").unwrap())).unwrap();
    let dist_writer = io::BufWriter::new(&mut dist);
    let mut dist_zip = zip::ZipWriter::new(dist_writer);
    let options = zip::write::FileOptions::default()
        .compression_method(zip::CompressionMethod::Bzip2)
        .unix_permissions(0o444);
    for (p, bin) in out {
        dist_zip.start_file_from_path(&p, options).unwrap();
        dist_zip.write_all(&bin).unwrap();
    }
    dist_zip.finish().unwrap();
}
