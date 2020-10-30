#[macro_use]
extern crate pest_derive;
extern crate syntect;

#[macro_use]
pub mod xml;
pub mod analysis;
pub mod parser;

use std::collections::HashMap;
use syntect::html::ClassedHTMLGenerator;
use syntect::parsing::SyntaxSet;
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
    pub body: Cmd,
}

impl Article {
    pub fn new(body: Cmd) -> Self {
        Article { body }
    }
}

pub enum File {
    Article(Article),
    Misc(Vec<u8>),
}

pub type Project = HashMap<std::path::PathBuf, File>;

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
    Str(String),
}

#[derive(Clone, Copy)]
pub struct Context<'a> {
    level: usize,
    prevs: &'a HashMap<std::path::PathBuf, (std::path::PathBuf, Vec<TextElem>)>,
    nexts: &'a HashMap<std::path::PathBuf, (std::path::PathBuf, Vec<TextElem>)>,
    article_list: &'a Vec<(std::path::PathBuf, Vec<TextElem>, chrono::NaiveDate)>,
    ss: &'a SyntaxSet,
    path: &'a std::path::Path,
}

impl<'a> Context<'a> {
    pub fn new(report: &'a analysis::Report, path: &'a std::path::Path) -> Self {
        Context {
            level: 1,
            prevs: &report.prevs,
            nexts: &report.nexts,
            article_list: &report.article_list,
            ss: &report.ss,
            path,
        }
    }
}

pub fn root(ctx: Context, cmd: Cmd) -> EResult<XML> {
    Ok(XML::new("1.0", "UTF-8", "html", process_cmd(ctx, cmd)?))
}

fn process_text_elem(ctx: Context, elem: TextElem) -> EResult<XMLElem> {
    match elem {
        TextElem::Plain(s) => Ok(xml!(s)),
        TextElem::Cmd(cmd) => process_cmd(ctx, cmd),
        TextElem::Str(s) => process_inlinestr(ctx, s),
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

macro_rules! verify {
    ( $hash:expr, $key:expr, $tp:ident ) => {
        if let Some(v) = $hash.get($key) {
            match v {
                Value::$tp(v) => Ok(Some(v.clone())),
                _ => Err(Error::ProcessError(format!(
                    "wrong attribute type at {}",
                    $key
                ))),
            }
        } else {
            Ok(None)
        }
    };
}

fn resolve_link(target: &std::path::Path, from: &std::path::Path) -> std::path::PathBuf {
    let target_ancestors = target.ancestors().collect::<Vec<_>>().into_iter().rev();
    let from_ancestors = from.ancestors().collect::<Vec<_>>().into_iter().rev();
    let common = target_ancestors
        .zip(from_ancestors)
        .filter(|(a, b)| a == b)
        .rev()
        .next()
        .map(|(a, _)| a)
        .unwrap_or_else(|| std::path::Path::new(""));
    let target_congenital = target.strip_prefix(common).unwrap();
    let from_congenital = from.strip_prefix(common).unwrap();
    let climb_count = from_congenital.iter().count();
    let climb_src = "../".repeat(climb_count - 1);
    let climb = std::path::Path::new(&climb_src);
    climb.join(target_congenital)
}

fn resolve(target: &str, from: &std::path::Path) -> std::path::PathBuf {
    resolve_link(&std::path::Path::new(target), from)
}

fn header_common(ctx: Context) -> Vec<XMLElem> {
    let url = "https://namachan10777.dev/".to_owned() + ctx.path.to_str().unwrap();
    vec![
        xml!(link [href=resolve("index.css", &ctx.path).to_str().unwrap(), rel="stylesheet", type="text/css"]),
        xml!(link [href=resolve("syntect.css", &ctx.path).to_str().unwrap(), rel="stylesheet", type="text/css"]),
        xml!(link [href=resolve("res/favicon.ico", &ctx.path).to_str().unwrap(), rel="icon", type="image/vnd.microsoft.icon"]),
        xml!(meta [name="twitter:card", content="summary"]),
        xml!(meta [name="twitter:site", content="@namachan10777"]),
        xml!(meta [name="twitter:creator", content="@namachan10777"]),
        xml!(meta [property="og:url", content=&url]),
        xml!(meta [property="og:site_name", content="namachan10777"]),
        xml!(meta [property="og:image", content="https://namachan10777.dev/res/icon.jpg"]),
        xml!(meta [name="twitter:image", content="https://namachan10777.dev/res/icon.jpg"]),
    ]
}

fn execute_index(
    ctx: Context,
    attrs: HashMap<String, Value>,
    inner: Vec<TextElem>,
) -> EResult<XMLElem> {
    let title = get!(attrs, "title", Text)?;
    let title = title
        .into_iter()
        .map(|e| process_text_elem(ctx, e))
        .collect::<EResult<Vec<_>>>()?;
    let mut body = vec![xml!(header [] [xml!(h1 [] title.clone())])];
    body.append(
        &mut inner
            .into_iter()
            .map(|e| process_text_elem(ctx, e))
            .collect::<EResult<Vec<_>>>()?,
    );
    let mut header = header_common(ctx);
    let title_str = title
        .iter()
        .map(|xml| xml.extract_string())
        .collect::<Vec<_>>()
        .join("");
    header.push(xml!(meta [property="og:title", content=&title_str]));
    header.push(xml!(meta [name="twitter:title", content=&title_str]));
    header.push(xml!(meta [property="og:type", content="website"]));
    header.push(xml!(meta [property="og:description", content="about me"]));
    header.push(xml!(meta [name="description", content="about me"]));
    header.push(xml!(meta [name="twitter:description", content="about me"]));
    header.push(xml!(title [] title));
    Ok(
        xml!(html [xmlns="http://www.w3.org/1999/xhtml", lang="ja"] [
             xml!(head [prefix="og: http://ogp.me/ns# article: http://ogp.me/ns/article#"] header),
             xml!(body [] [xml!(div [id="root"] body)])
        ]),
    )
}

fn execute_article(
    ctx: Context,
    attrs: HashMap<String, Value>,
    inner: Vec<TextElem>,
) -> EResult<XMLElem> {
    let title = get!(attrs, "title", Text)?;
    let title = title
        .into_iter()
        .map(|e| process_text_elem(ctx, e))
        .collect::<EResult<Vec<_>>>()?;
    let mut body = vec![xml!(header [] [
        xml!(a [href="index.html"] [xml!("戻る".to_owned())]),
        xml!(h1 [] title.clone())
    ])];
    let mut footer_inner = Vec::new();
    if let Some((prev_path, prev_title)) = ctx.prevs.get(ctx.path) {
        footer_inner.push(xml!(a
            [href=prev_path.to_str().unwrap(), class="prev-article"]
            prev_title
                .iter()
                .map(|e| process_text_elem(ctx, e.clone())).collect::<EResult<Vec<_>>>()?
        ));
    }
    if let Some((next_path, next_title)) = ctx.nexts.get(ctx.path) {
        footer_inner.push(xml!(a
            [href=next_path.to_str().unwrap(), class="next-article"]
            next_title
                .iter()
                .map(|e| process_text_elem(ctx, e.clone())).collect::<EResult<Vec<_>>>()?
        ));
    }
    let mut header = header_common(ctx);
    let mut body_xml = inner
        .into_iter()
        .map(|e| process_text_elem(ctx, e))
        .collect::<EResult<Vec<_>>>()?;
    let title_str = title
        .iter()
        .map(|xml| xml.extract_string())
        .collect::<Vec<_>>()
        .join("");
    let body_str = body_xml
        .iter()
        .map(|xml| xml.extract_string())
        .collect::<Vec<_>>()
        .join("");
    let chars = body_str.chars();
    let body_str = if chars.clone().count() > 64 {
        chars
            .take(64)
            .map(|c| c.to_string())
            .collect::<Vec<_>>()
            .join("")
    } else {
        body_str
    };
    let body_str = body_str.trim().to_owned() + "……";
    header.push(xml!(title [] title));
    header.push(xml!(meta [property="og:title", content=&title_str]));
    header.push(xml!(meta [name="twitter:title", content=&title_str]));
    header.push(xml!(meta [property="og:type", content="article"]));
    header.push(xml!(meta [property="og:description", content=body_str]));
    header.push(xml!(meta [name="description", content=body_str]));
    header.push(xml!(meta [name="twitter:description", content=body_str]));
    body.append(&mut body_xml);
    body.push(xml!(footer [] footer_inner));

    Ok(
        xml!(html [xmlns="http://www.w3.org/1999/xhtml", lang="ja"] [
             xml!(head [prefix="og: http://ogp.me/ns# object: http://ogp.me/ns/object#"] header),
             xml!(body [] [xml!(div [id="root"] body)])
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
        XMLElem::WithElem(format!("h{}", ctx.level), vec![],
            title
            .into_iter()
            .map(|e| process_text_elem(Context {level: ctx.level+1, ..ctx}, e))
            .collect::<EResult<Vec<_>>>()?
        )
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

fn execute_line(ctx: Context, inner: Vec<TextElem>) -> EResult<XMLElem> {
    Ok(
        xml!(span [] inner.into_iter().map(|e| process_text_elem(ctx, e)).collect::<EResult<Vec<_>>>()?),
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
    Ok(xml!(ul [] inner))
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

fn execute_articles(ctx: Context) -> EResult<XMLElem> {
    Ok(xml!(ul [] ctx
        .article_list
        .iter()
        .map(|(path, title, _)| {
            Ok(xml!(li [] [xml!(a
                [href=path.to_str().unwrap()]
                title.iter().map(|e| process_text_elem(ctx, e.clone())).collect::<EResult<Vec<_>>>()?
            )]))
        })
        .collect::<EResult<Vec<_>>>()?
    ))
}

fn execute_code(ctx: Context, inner: Vec<TextElem>) -> EResult<XMLElem> {
    Ok(xml!(code [] inner.into_iter()
            .map(|e| process_text_elem(ctx, e))
            .collect::<EResult<Vec<_>>>()?))
}

fn execute_blockcode(ctx: Context, attrs: HashMap<String, Value>) -> EResult<XMLElem> {
    let src = get!(attrs, "src", Str)?;
    let lang = get!(attrs, "lang", Str)?;
    let lines = src.split('\n').collect::<Vec<_>>();
    let white = regex::Regex::new(r"^[ \t\r\n]*$").unwrap();
    assert!(!white.is_match("abc"));
    let empty_line_cnt_from_head = lines.iter().take_while(|l| white.is_match(l)).count();
    let empty_line_cnt_from_tail = lines.iter().rev().take_while(|l| white.is_match(l)).count();
    let mut padding_n = 100_000;
    for line in &lines {
        if white.is_match(line) {
            continue;
        }
        padding_n = padding_n.min(line.chars().take_while(|c| *c == ' ').count());
    }
    println!("cut {}", padding_n);
    let mut code = Vec::new();
    for line in lines[empty_line_cnt_from_head..lines.len() - empty_line_cnt_from_tail].to_vec() {
        code.push(line.get(padding_n..).unwrap_or_else(|| ""));
    }
    if let Some(sr) = ctx.ss.find_syntax_by_extension(&lang) {
        let mut generator = ClassedHTMLGenerator::new(sr, ctx.ss);
        for line in code {
            generator.parse_html_for_line(&line);
        }
        Ok(xml!(code [] [xml!(pre [] [XMLElem::Raw(generator.finalize())])]))
    } else {
        eprintln!("language {} is not found!", lang);
        Ok(xml!(code [] [xml!(pre [] [XMLElem::Raw(code.join("\n"))])]))
    }
}

fn process_inlinestr(_: Context, s: String) -> EResult<XMLElem> {
    Ok(xml!(span[class = "inline-code"][xml!(s)]))
}

fn execute_iframe(_: Context, attrs: HashMap<String, Value>) -> EResult<XMLElem> {
    let attrs = [
        (
            "width",
            verify!(attrs, "width", Int)?.map(|i| format!("{}", i)),
        ),
        (
            "height",
            verify!(attrs, "height", Int)?.map(|i| format!("{}", i)),
        ),
        (
            "frameborder",
            verify!(attrs, "frameborder", Int)?.map(|i| format!("{}", i)),
        ),
        ("style", verify!(attrs, "style", Str)?),
        ("scrolling", verify!(attrs, "scrolling", Str)?),
        ("src", Some(get!(attrs, "src", Str)?)),
    ]
    .iter()
    .filter_map(|(name, value)| {
        value
            .as_ref()
            .map(|value| (name.to_owned().to_owned(), value.to_owned()))
    })
    .collect::<Vec<(String, String)>>();
    Ok(XMLElem::Single("iframe".to_owned(), attrs))
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
        "line" => execute_line(ctx, cmd.inner),
        "code" => execute_code(ctx, cmd.inner),
        "blockcode" => execute_blockcode(ctx, cmd.attrs),
        "iframe" => execute_iframe(ctx, cmd.attrs),
        _ => Err(Error::ProcessError(format!(
            "invalid root cmd {}",
            cmd.name
        ))),
    }
}
