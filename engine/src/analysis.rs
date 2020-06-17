#[macro_use]
use super::{Value, Cmd, TextElem, Project, Article, Context};

use std::collections::HashMap;

pub enum Error {
}

pub fn parse(proj: Project) -> Context {
    let mut map = HashMap::new();
    Context {
        level: 0,
    }
}
