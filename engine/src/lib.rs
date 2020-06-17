#[macro_use]
extern crate pest_derive;

#[macro_use]
pub mod xml;
pub mod parser;
pub mod analysis;

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

pub struct Article {
    fname: String,
    body: Cmd,
}

pub enum File {
    Article(Article),
    Misc(Vec<u8>),
}

pub type Project = HashMap<String, File>;

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
pub struct Context {
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
    let title = get!(attrs, "title", Text)?;
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

fn execute_article(
    ctx: Context,
    attrs: HashMap<String, Value>,
    inner: Vec<TextElem>,
) -> EResult<XMLElem> {
    let title = get!(attrs, "title", Text)?;
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
    let title = get!(attrs, "title", Text)?;
    let mut header = vec![xml!(header [] [
         xml!(head [] [
            XMLElem::WithElem(format!("h{}", ctx.level), vec![],
                title
                .into_iter()
                .map(|e| process_text_elem(ctx, e))
                .collect::<EResult<Vec<_>>>()?
            )
        ])
    ])];
    let ctx_child = Context {
        level: ctx.level + 1,
    };
    let mut body = inner
        .into_iter()
        .map(|e| process_text_elem(ctx_child, e))
        .collect::<EResult<Vec<_>>>()?;
    header.append(&mut body);
    Ok(xml!(section [] header))
}

fn execute_img(attrs: HashMap<String, Value>) -> EResult<XMLElem> {
    let url = get!(attrs, "url", Str)?;
    let alt = get!(attrs, "alt", Str)?;
    Ok(xml!(img [src=url, alt=alt]))
}

fn execute_p(ctx: Context, inner: Vec<TextElem>) -> EResult<XMLElem> {
    Ok(
        xml!(p [] inner.into_iter().map(|e| process_text_elem(ctx, e)).collect::<EResult<Vec<_>>>()?),
    )
}

fn execute_address(ctx: Context, inner: Vec<TextElem>) -> EResult<XMLElem> {
    Ok(
        xml!(address [] inner.into_iter().map(|e| process_text_elem(ctx, e)).collect::<EResult<Vec<_>>>()?),
    )
}

fn execute_ul(ctx: Context, inner: Vec<TextElem>) -> EResult<XMLElem> {
    let inner = inner
        .into_iter()
        .map(|e| match e {
            TextElem::Cmd(cmd) => match cmd.name.as_str() {
                "n" => {
                    let inner = cmd
                        .inner
                        .into_iter()
                        .map(|e| process_text_elem(ctx, e))
                        .collect::<EResult<Vec<_>>>()?;
                    Ok(xml!(li [] inner))
                }
                _ => Ok(xml!(li [] [process_cmd(ctx, cmd)?])),
            },
            _ => Err(Error::ProcessError(
                "ul cannot process plain text".to_owned(),
            )),
        })
        .collect::<EResult<Vec<_>>>()?;
    Ok(xml!(address [] inner))
}

fn execute_link(
    ctx: Context,
    attrs: HashMap<String, Value>,
    inner: Vec<TextElem>,
) -> EResult<XMLElem> {
    let url = get!(attrs, "url", Str)?;
    Ok(xml!(a [href=url] inner.into_iter()
        .map(|e| process_text_elem(ctx, e))
        .collect::<EResult<Vec<_>>>()?))
}

fn execute_n(ctx: Context, inner: Vec<TextElem>) -> EResult<XMLElem> {
    Ok(xml!(div [] inner.into_iter()
        .map(|e| process_text_elem(ctx, e))
        .collect::<EResult<Vec<_>>>()?))
}

fn execute_articles(_ctx: Context) -> EResult<XMLElem> {
    Ok(xml!(ul [] []))
}

fn process_cmd(ctx: Context, cmd: Cmd) -> EResult<XMLElem> {
    match cmd.name.as_str() {
        "index" => execute_index(ctx, cmd.attrs, cmd.inner),
        "article" => execute_article(ctx, cmd.attrs, cmd.inner),
        "articles" => execute_articles(ctx),
        "section" => execute_section(ctx, cmd.attrs, cmd.inner),
        "img" => execute_img(cmd.attrs),
        "p" => execute_p(ctx, cmd.inner),
        "address" => execute_address(ctx, cmd.inner),
        "ul" => execute_ul(ctx, cmd.inner),
        "link" => execute_link(ctx, cmd.attrs, cmd.inner),
        "n" => execute_n(ctx, cmd.inner),
        _ => Err(Error::ProcessError(format!(
            "invalid root cmd {}",
            cmd.name
        ))),
    }
}
