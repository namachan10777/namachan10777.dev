#[macro_use]
extern crate pest_derive;
extern crate sha2;
extern crate syntect;
extern crate zip;

#[macro_use]
pub mod xml;
pub mod analysis;
pub mod convert;
pub mod parser;

use std::cmp;
use std::collections::HashMap;
use std::ffi::OsStr;
use std::fmt;
use std::fs;
use std::io;
use std::io::{Seek, Write};
use std::path::Path;
use std::path::PathBuf;

#[derive(Debug, PartialEq, Clone, Eq)]
pub struct Position {
    fname: String,
    // 1-indexed
    line: usize,
    // 1-indexed
    col: usize,
}

#[derive(Debug)]
pub enum Error {
    SyntaxError(Location),
    MissingAttribute {
        name: String,
        loc: Location,
    },
    InvalidAttributeType {
        name: String,
        expected: String,
        found: String,
        loc: Location,
    },
    NoSuchCmd {
        name: String,
        loc: Location,
    },
    ProcessError {
        loc: Location,
        desc: String,
    },
    FsError {
        path: PathBuf,
        desc: String,
        because: io::Error,
    },
    CannotInterpretPathAsUTF8(PathBuf),
    ZipError {
        desc: String,
        because: zip::result::ZipError,
    },
    ZipIOError {
        desc: String,
        because: io::Error,
    },
}

impl Position {
    pub fn new(fname: &str, line: usize, col: usize) -> Position {
        Self {
            fname: fname.to_owned(),
            line,
            col,
        }
    }
}

impl PartialOrd for Position {
    fn partial_cmp(&self, other: &Self) -> Option<cmp::Ordering> {
        if self.fname != other.fname {
            self.fname.partial_cmp(&other.fname)
        } else if self.line != other.line {
            self.line.partial_cmp(&other.line)
        } else {
            self.col.partial_cmp(&other.col)
        }
    }
}

impl Ord for Position {
    fn cmp(&self, other: &Self) -> cmp::Ordering {
        if self.fname != other.fname {
            self.fname.cmp(&other.fname)
        } else if self.line != other.line {
            self.line.cmp(&other.line)
        } else {
            self.col.cmp(&other.col)
        }
    }
}

#[derive(Debug, PartialEq, Clone)]
pub enum Location {
    Span(Position, Position),
    At(Position),
    Generated,
}

impl Location {
    pub fn merge(&self, other: &Self) -> Self {
        match (self, other) {
            (Location::Span(a1, a2), Location::Span(b1, b2)) => {
                Location::Span(cmp::min(a1, b1).clone(), cmp::max(a2, b2).clone())
            }
            (Location::At(a), Location::At(b)) => {
                Location::Span(cmp::min(a, b).clone(), cmp::max(a, b).clone())
            }
            (Location::Span(a1, a2), Location::At(b)) => {
                Location::Span(cmp::min(a1, b).clone(), cmp::max(a2, b).clone())
            }
            (Location::At(a), Location::Span(b1, b2)) => {
                Location::Span(cmp::min(a, b1).clone(), cmp::max(a, b2).clone())
            }
            (loc, Location::Generated) => loc.clone(),
            (Location::Generated, loc) => loc.clone(),
        }
    }
}

impl fmt::Display for Location {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> Result<(), fmt::Error> {
        match self {
            Location::Generated => write!(f, "nowhere:nowhere:nowhere"),
            Location::At(p) => write!(f, "{}:{}:{}", p.fname, p.line, p.col),
            Location::Span(p1, p2) => write!(
                f,
                "{}:{}:{} -- {}:{}:{}",
                p1.fname, p1.line, p1.col, p2.fname, p2.line, p2.col
            ),
        }
    }
}

#[cfg(test)]
mod test_loc {
    use super::*;
    #[test]
    fn test_pos() {
        assert!(Position::new("", 1, 1) == Position::new("", 1, 1));
        assert!(Position::new("", 1, 2) > Position::new("", 1, 1));
    }

    #[test]
    fn test_merge() {
        let p1 = Position::new("", 1, 1);
        let p2 = Position::new("", 2, 1);
        let p3 = Position::new("", 3, 1);
        let p4 = Position::new("", 4, 1);
        let s1 = Location::Span(p1.clone(), p2.clone());
        let s2 = Location::Span(p2.clone(), p3.clone());
        assert_eq!(
            s1.merge(&Location::At(p3.clone())),
            Location::Span(p1.clone(), p3.clone())
        );
        assert_eq!(s1.merge(&s2), Location::Span(p1.clone(), p3.clone()));
        assert_eq!(
            Location::At(p4.clone()).merge(&Location::At(p2.clone())),
            Location::Span(p2.clone(), p4.clone())
        );
    }
}

#[derive(PartialEq, Debug, Clone)]
pub enum Value {
    Int(i64),
    Float(f64),
    Str(String),
    Text(Vec<TextElemAst>),
    List(Vec<ValueAst>),
}

impl Value {
    pub fn type_name(&self) -> String {
        match self {
            Value::Int(_) => "int".to_owned(),
            Value::Float(_) => "float".to_owned(),
            Value::Str(_) => "string".to_owned(),
            Value::Text(_) => "text".to_owned(),
        }
    }
}

type ValueAst = (Value, Location);

#[derive(PartialEq, Debug, Clone)]
pub struct Cmd {
    name: String,
    attrs: HashMap<String, ValueAst>,
    inner: Vec<TextElemAst>,
}

#[derive(PartialEq, Debug, Clone)]
pub enum TextElem {
    Cmd(Cmd),
    Plain(String),
    Str(String),
}

type TextElemAst = (TextElem, Location);

#[derive(Debug)]
pub enum File {
    Tml((Cmd, Location), String),
    Blob(Vec<u8>),
}

pub type Parsed = HashMap<PathBuf, File>;

fn enumerate_all_file_paths<P>(dir_path: P) -> Vec<PathBuf>
where
    P: AsRef<Path>,
{
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

pub fn compile_and_write<W: Write + Seek, P>(writer: &mut W, dir_path: P) -> Result<(), Error>
where
    P: AsRef<Path>,
{
    let mut files = HashMap::new();
    let source_paths: Vec<PathBuf> = enumerate_all_file_paths(dir_path);
    for p in &source_paths {
        println!("{:?}", p);
        if p.extension() == Some(OsStr::new(".tml")) && p.is_dir() {
            let source = fs::read_to_string(p).map_err(|e| Error::FsError {
                path: p.to_owned(),
                desc: "Cannot read tml file".to_owned(),
                because: e,
            })?;
            let fname = p
                .as_os_str()
                .to_str()
                .ok_or(Error::CannotInterpretPathAsUTF8(p.to_owned()))?;
            let ast = parser::parse(fname, &source)?;
            files.insert(p.to_owned(), File::Tml(ast, source));
        } else {
            let binary = fs::read(p).map_err(|e| Error::FsError {
                path: p.to_owned(),
                desc: "Cannot read blob file".to_owned(),
                because: e,
            })?;
            files.insert(p.to_owned(), File::Blob(binary));
        }
    }
    let report = analysis::analyze(&files)?;
    let out = files
        .into_iter()
        .map(|(p, file)| match file {
            File::Blob(binary) => Ok((p, binary)),
            File::Tml(cmd, _) => {
                let xml = convert::root(report.get_context(&p).unwrap(), cmd.0).unwrap();
                Ok((p, xml.to_string().into_bytes()))
            }
        })
        .collect::<Result<HashMap<_, _>, Error>>()?;
    let dist_writer = io::BufWriter::new(writer);
    let mut dist_zip = zip::ZipWriter::new(dist_writer);
    let options = zip::write::FileOptions::default()
        .compression_method(zip::CompressionMethod::Bzip2)
        .unix_permissions(0o444);
    for (p, bin) in out {
        dist_zip
            .start_file_from_path(&p, options)
            .map_err(|e| Error::ZipError {
                desc: "Failed to create file in zip archive".to_owned(),
                because: e,
            })?;
        dist_zip.write_all(&bin).map_err(|e| Error::ZipIOError {
            desc: "Failed to write to zip archive".to_owned(),
            because: e,
        })?;
    }
    dist_zip.finish().map_err(|e| Error::ZipError {
        desc: "Failed to flush zip file".to_owned(),
        because: e,
    })?;
    Ok(())
}
