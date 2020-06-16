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

#[derive(Clone, Copy)]
struct Context {
    level: usize,
}

pub fn root(cmd: Cmd) -> EResult<XML> {
    let ctx = Context { level: 1 };
    Ok(XML::new("1.0", "UTF-8", "html", process_cmd(ctx, cmd)?))
}

fn process_text_elem(ctx: Context, elem: TextElem) -> EResult<XMLElem> {
    match elem {
        TextElem::Plain(s) => Ok(xml!(s)),
        TextElem::Cmd(cmd) => process_cmd(ctx, cmd),
    }
}

macro_rules! get {
    ( $hash:expr, $key:expr, $tp:ident ) => {
        $hash
            .get($key)
            .ok_or(Error::ProcessError(format!(
                "missing attribute {} in \\index",
                $key
            )))
            .and_then(|v| match v {
                Value::$tp(v) => Ok(v.clone()),
                _ => Err(Error::ProcessError(format!(
                    "wrong attribute type at {}",
                    $key
                ))),
            })
    };
}

fn execute_index(
    ctx: Context,
    attrs: HashMap<String, Value>,
    inner: Vec<TextElem>,
) -> EResult<XMLElem> {
    let title = get!(attrs, "tite", Text)?;
    Ok(
        xml!(html [xmlns="http://www.w3.org/1999/xhtml", lang="ja"] [
             xml!(head [] [
                  xml!(title []
                       title
                       .into_iter()
                       .map(|e| process_text_elem(ctx, e))
                       .collect::<EResult<Vec<_>>>()?
                  )
             ]),
             xml!(body []
                       inner
                       .into_iter()
                       .map(|e| process_text_elem(ctx, e))
                       .collect::<EResult<Vec<_>>>()?
             )
        ]),
    )
}

fn execute_section(
    ctx: Context,
    attrs: HashMap<String, Value>,
    inner: Vec<TextElem>,
) -> EResult<XMLElem> {
    let title = get!(attrs, "tite", Text)?;
    let mut header = vec![xml!(header [] [
         xml!(head [] [
             xml!(title []
                  title
                  .into_iter()
                  .map(|e| process_text_elem(ctx, e))
                  .collect::<EResult<Vec<_>>>()?
             )
        ])
    ])];
    let ctx_child = Context {
        level: ctx.level + 1,
        ..ctx
    };
    let mut body = inner
        .into_iter()
        .map(|e| process_text_elem(ctx_child, e))
        .collect::<EResult<Vec<_>>>()?;
    header.append(&mut body);
    Ok(xml!(section [] header))
}

fn process_cmd(ctx: Context, cmd: Cmd) -> EResult<XMLElem> {
    match cmd.name.as_str() {
        "index" => execute_index(ctx, cmd.attrs, cmd.inner),
        "section" => execute_section(ctx, cmd.attrs, cmd.inner),
        _ => Err(Error::ProcessError(format!(
            "invalid root cmd {}",
            cmd.name
        ))),
    }
}
