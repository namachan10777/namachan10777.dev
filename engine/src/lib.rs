#[macro_use]
extern crate pest_derive;
extern crate sha2;
extern crate syntect;

#[macro_use]
pub mod xml;
pub mod parser;
pub mod convert;

use std::collections::HashMap;
use std::fmt;
use std::cmp;

#[derive(Debug, PartialEq, Clone, Eq)]
pub struct Position<'a> {
    fname: &'a str,
    // 1-indexed
    line: usize,
    // 1-indexed
    col: usize,
}

impl<'a> Position<'a> {
    pub fn new(fname: &'a str, line: usize, col: usize) -> Position<'a> {
        Self { fname, line, col }
    }
}

impl<'a> PartialOrd for Position<'a> {
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

impl<'a> Ord for Position<'a> {
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
pub enum Location<'a> {
    Span(Position<'a>, Position<'a>),
    At(Position<'a>),
    Generated,
}

impl<'a> Location<'a> {
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

impl<'a> fmt::Display for Location<'a> {
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
pub enum Value<'a> {
    Int(i64),
    Float(f64),
    Str(String),
    Text(Vec<TextElemAst<'a>>),
}

type ValueAst<'a> = (Value<'a>, Location<'a>);

#[derive(PartialEq, Debug, Clone)]
pub struct Cmd<'a> {
    name: String,
    attrs: HashMap<String, ValueAst<'a>>,
    inner: Vec<TextElemAst<'a>>,
}

#[derive(PartialEq, Debug, Clone)]
pub enum TextElem<'a> {
    Cmd(Cmd<'a>),
    Plain(String),
    Str(String),
}

type TextElemAst<'a> = (TextElem<'a>, Location<'a>);
