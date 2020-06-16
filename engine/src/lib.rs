#[macro_use]
extern crate pest_derive;

#[macro_use]
pub mod xml;
pub mod parser;

use std::collections::HashMap;
use xml::{XMLElem, XML};

#[derive(Debug)]
pub enum Pos {
    At(String, usize, usize),
    Span(String, (usize, usize), (usize, usize)),
}

#[derive(Debug)]
pub enum Error {
    SyntaxError(Pos, String),
    ProcessError(String),
}

type EResult<T> = Result<T, Error>;

#[derive(PartialEq, Debug, Clone)]
pub enum Value {
    Int(i64),
    Float(f64),
    Str(String),
    Text(Vec<TextElem>),
}

#[derive(PartialEq, Debug, Clone)]
pub struct Cmd {
    name: String,
    attrs: HashMap<String, Value>,
    inner: Vec<TextElem>,
}

#[derive(PartialEq, Debug, Clone)]
pub enum TextElem {
    Cmd(Cmd),
    Plain(String),
}

pub fn root(cmd: Cmd) -> EResult<XML> {
    Ok(XML::new("1.0", "UTF-8", "html", process_cmd(cmd)?))
}

fn process_text_elem(elem: TextElem) -> EResult<XMLElem> {
    match elem {
        TextElem::Plain(s) => Ok(xml!(s)),
        TextElem::Cmd(cmd) => process_cmd(cmd),
    }
}

fn execute_index(attrs: HashMap<String, Value>, inner: Vec<TextElem>) -> EResult<XMLElem> {
    let title = attrs
        .get("title")
        .ok_or(Error::ProcessError(format!(
            "missing attribute title in \\index"
        )))
        .and_then(|v| match v {
            Value::Text(t) => Ok(t.clone()),
            _ => Err(Error::ProcessError(format!(
                "wrong attribute type at title in index"
            ))),
        })?;
    Ok(
        xml!(html [xmlns="http://www.w3.org/1999/xhtml", lang="ja"] [
             xml!(head [] [
                  xml!(title []
                       title
                       .into_iter()
                       .map(process_text_elem)
                       .collect::<EResult<Vec<_>>>()?
                  )
             ]),
             xml!(body [] 
                       inner
                       .into_iter()
                       .map(process_text_elem)
                       .collect::<EResult<Vec<_>>>()?
             )
        ]),
    )
}

fn process_cmd(cmd: Cmd) -> EResult<XMLElem> {
    match cmd.name.as_str() {
        "index" => execute_index(cmd.attrs, cmd.inner),
        _ => Err(Error::ProcessError(format!(
            "invalid root cmd {}",
            cmd.name
        ))),
    }
}
