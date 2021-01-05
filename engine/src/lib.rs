#[macro_use]
extern crate pest_derive;
extern crate sha2;
extern crate syntect;

#[macro_use]
pub mod xml;
pub mod analysis;
pub mod parser;

use sha2::Digest;
use std::cmp;
use std::collections::HashMap;
use std::fmt;
use std::path::{Path, PathBuf};
use syntect::html::ClassedHTMLGenerator;
use syntect::parsing::SyntaxSet;
use xml::{XMLElem, XML};

#[derive(Debug)]
pub enum Error {
    SyntaxError(Location, String),
    ProcessError(Location, String),
}

type EResult<T> = Result<T, Error>;

pub struct Article {
    pub body: Cmd,
    pub start_location: Location,
    pub src: String,
}

impl Article {
    pub fn new(body: Cmd, src: String, start_location: Location) -> Self {
        Article {
            body,
            src,
            start_location,
        }
    }
}

pub enum File {
    Article(Article),
    Misc(Vec<u8>),
}

pub type Project = HashMap<PathBuf, File>;

#[derive(Debug, PartialEq, Clone, Eq)]
pub struct Position {
    fname: String,
    // 1-indexed
    line: usize,
    // 1-indexed
    col: usize,
}

impl Position {
    pub fn new(fname: String, line: usize, col: usize) -> Self {
        Self { fname, line, col }
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
        assert!(Position::new(String::new(), 1, 1) == Position::new(String::new(), 1, 1));
        assert!(Position::new(String::new(), 1, 2) > Position::new(String::new(), 1, 1));
    }

    #[test]
    fn test_merge() {
        let p1 = Position::new(String::new(), 1, 1);
        let p2 = Position::new(String::new(), 2, 1);
        let p3 = Position::new(String::new(), 3, 1);
        let p4 = Position::new(String::new(), 4, 1);
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

type ArticleList = Vec<(PathBuf, Vec<TextElemAst>, chrono::NaiveDate)>;

#[derive(Clone)]
pub struct Context<'a> {
    location: Location,
    level: usize,
    prevs: &'a HashMap<PathBuf, (PathBuf, Vec<TextElemAst>)>,
    nexts: &'a HashMap<PathBuf, (PathBuf, Vec<TextElemAst>)>,
    articles: &'a HashMap<PathBuf, ArticleList>,
    ss: &'a SyntaxSet,
    path: &'a std::path::Path,
    src: &'a str,
}

impl<'a> Context<'a> {
    pub fn new(
        report: &'a analysis::Report,
        path: &'a std::path::Path,
        src: &'a str,
        start_location: Location,
    ) -> Self {
        Context {
            location: start_location,
            level: 1,
            prevs: &report.prevs,
            nexts: &report.nexts,
            articles: &report.articles,
            ss: &report.ss,
            path,
            src,
        }
    }

    fn fork_with_loc(&self, loc: Location) -> Self {
        Self {
            location: loc,
            ..self.clone()
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
    ( $loc:expr, $hash:expr, $key:expr, $tp:ident ) => {
        $hash
            .get($key)
            .ok_or(Error::ProcessError(
                $loc.to_owned(),
                format!("missing attribute {} in \\index", $key),
            ))
            .and_then(|v| match v {
                (Value::$tp(v), _) => Ok(v.clone()),
                (_, loc) => Err(Error::ProcessError(
                    loc.to_owned(),
                    format!("wrong attribute type at {}", $key),
                )),
            })
    };
}

macro_rules! verify {
    ( $hash:expr, $key:expr, $tp:ident ) => {
        if let Some(v) = $hash.get($key) {
            match v {
                (Value::$tp(v), _) => Ok(Some(v.clone())),
                (_, loc) => Err(Error::ProcessError(
                    loc.to_owned(),
                    format!("wrong attribute type at {}", $key),
                )),
            }
        } else {
            Ok(None)
        }
    };
}

fn resolve_link(target: &std::path::Path, from: &std::path::Path) -> std::path::PathBuf {
    if target == from {
        return from
            .file_name()
            .map(|s| Path::new(s))
            .unwrap_or_else(|| Path::new(""))
            .to_path_buf();
    }
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

#[cfg(test)]
mod test {
    use super::*;
    #[test]
    fn test_resolve_link() {
        let from = Path::new("index.tml");
        let to = Path::new("index.tml");
        assert_eq!(resolve_link(to, from), Path::new("index.tml"));

        let from = Path::new("index.tml");
        let to = Path::new("article/a1.tml");
        assert_eq!(resolve_link(to, from), Path::new("article/a1.tml"));

        let from = Path::new("article/a1.tml");
        let to = Path::new("index.tml");
        assert_eq!(resolve_link(to, from), Path::new("../index.tml"));

        let from = Path::new("article/a1.tml");
        let to = Path::new("diary/d1.tml");
        assert_eq!(resolve_link(to, from), Path::new("../diary/d1.tml"));

        let from = Path::new("article/a1.tml");
        let to = Path::new("article/a2.tml");
        assert_eq!(resolve_link(to, from), Path::new("a2.tml"));
    }
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
    attrs: HashMap<String, ValueAst>,
    inner: Vec<TextElemAst>,
) -> EResult<XMLElem> {
    let title = get!(ctx.location, attrs, "title", Text)?;
    let title = title
        .into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<Vec<_>>>()?;
    let mut body = vec![xml!(header [] [xml!(h1 [] title.clone())])];
    body.append(
        &mut inner
            .into_iter()
            .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
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
    attrs: HashMap<String, ValueAst>,
    inner: Vec<TextElemAst>,
) -> EResult<XMLElem> {
    let mut hasher = sha2::Sha256::new();
    hasher.update(ctx.src);
    let hashed = hasher.finalize();
    let hashed_full = hex::encode(hashed);
    let hashed_short = &hashed_full[..7];
    let title = get!(ctx.location, attrs, "title", Text)?;
    let title = title
        .into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<Vec<_>>>()?;
    let index_path = resolve("index.html", ctx.path);
    let mut body = vec![xml!(header [] [
        xml!(a [href=index_path.to_str().unwrap().to_owned()] [xml!("戻る".to_owned())]),
        xml!(div [class="hash"] [xml!(hashed_short.to_owned())]),
        xml!(h1 [] title.clone())
    ])];
    let mut footer_inner = Vec::new();
    if let Some((prev_path, prev_title)) = ctx.prevs.get(ctx.path) {
        let href_path = resolve_link(prev_path, ctx.path);
        footer_inner.push(xml!(a
            [href=href_path.to_str().unwrap(), class="prev-article"]
            prev_title
                .iter()
                .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc.to_owned()), e.clone())).collect::<EResult<Vec<_>>>()?
        ));
    }
    if let Some((next_path, next_title)) = ctx.nexts.get(ctx.path) {
        let href_path = resolve_link(next_path, ctx.path);
        footer_inner.push(xml!(a
            [href=href_path.to_str().unwrap(), class="next-article"]
            next_title
                .iter()
                .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc.to_owned()), e.clone())).collect::<EResult<Vec<_>>>()?
        ));
    }
    let mut header = header_common(ctx.clone());
    let mut body_xml = inner
        .into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
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
    attrs: HashMap<String, ValueAst>,
    inner: Vec<TextElemAst>,
) -> EResult<XMLElem> {
    let title = get!(ctx.location, attrs, "title", Text)?;
    let mut header = vec![xml!(header [] [
        XMLElem::WithElem(format!("h{}", ctx.level), vec![],
            title
            .into_iter()
            .map(|(e, loc)| process_text_elem(Context {location: loc, level: ctx.level+1, ..ctx.clone()}, e))
            .collect::<EResult<Vec<_>>>()?
        )
    ])];
    let ctx_child = Context {
        level: ctx.level + 1,
        ..ctx.clone()
    };
    let mut body = inner
        .into_iter()
        .map(|(e, loc)| process_text_elem(ctx_child.fork_with_loc(loc), e))
        .collect::<EResult<Vec<_>>>()?;
    header.append(&mut body);
    Ok(xml!(section [] header))
}

fn execute_img(ctx: Context, attrs: HashMap<String, ValueAst>) -> EResult<XMLElem> {
    let url = get!(ctx.location, attrs, "url", Str)?;
    let alt = get!(ctx.location, attrs, "alt", Str)?;
    if let Some((Value::Str(classes), _)) = attrs.get("class") {
        Ok(xml!(img [src=url, class=classes, alt=alt]))
    } else if let Some(v) = attrs.get("class") {
        Err(Error::ProcessError(
            ctx.location,
            format!("invalid element {:?} for property of \"class\"", v),
        ))
    } else {
        Ok(xml!(img [src=url, alt=alt]))
    }
}

fn execute_p(ctx: Context, inner: Vec<TextElemAst>) -> EResult<XMLElem> {
    Ok(
        xml!(p [] inner.into_iter().map(|(e,loc)| process_text_elem(ctx.fork_with_loc(loc), e)).collect::<EResult<Vec<_>>>()?),
    )
}

fn execute_line(ctx: Context, inner: Vec<TextElemAst>) -> EResult<XMLElem> {
    Ok(
        xml!(span [] inner.into_iter().map(|(e,loc)| process_text_elem(ctx.fork_with_loc(loc), e)).collect::<EResult<Vec<_>>>()?),
    )
}

fn execute_address(ctx: Context, inner: Vec<TextElemAst>) -> EResult<XMLElem> {
    Ok(
        xml!(address [] inner.into_iter().map(|(e,loc)| process_text_elem(ctx.fork_with_loc(loc), e)).collect::<EResult<Vec<_>>>()?),
    )
}

fn execute_ul(ctx: Context, inner: Vec<TextElemAst>) -> EResult<XMLElem> {
    let inner = inner
        .into_iter()
        .map(|(e, loc)| match e {
            TextElem::Cmd(cmd) => match cmd.name.as_str() {
                "n" => {
                    let inner = cmd
                        .inner
                        .into_iter()
                        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
                        .collect::<EResult<Vec<_>>>()?;
                    Ok(xml!(li [] inner))
                }
                _ => Ok(xml!(li [] [process_cmd(ctx.fork_with_loc(loc), cmd)?])),
            },
            _ => Err(Error::ProcessError(
                loc,
                "ul cannot process plain text".to_owned(),
            )),
        })
        .collect::<EResult<Vec<_>>>()?;
    Ok(xml!(ul [] inner))
}

fn execute_link(
    ctx: Context,
    attrs: HashMap<String, ValueAst>,
    inner: Vec<TextElemAst>,
) -> EResult<XMLElem> {
    let url = get!(ctx.location, attrs, "url", Str)?;
    Ok(xml!(a [href=url] inner.into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<Vec<_>>>()?))
}

fn execute_n(ctx: Context, inner: Vec<TextElemAst>) -> EResult<XMLElem> {
    Ok(xml!(div [] inner.into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<Vec<_>>>()?))
}

fn execute_articles(ctx: Context, attrs: HashMap<String, ValueAst>) -> EResult<XMLElem> {
    let dir = get!(ctx.location, attrs, "dir", Str)?;
    let parent = Path::new(&dir);
    Ok(xml!(ul [] ctx
        .articles
        .get(parent)
        .map(|articles|
             articles
            .iter()
            .map(|(path, title, _)| {
                let href_path = resolve_link(Path::new(path), ctx.path);
                Ok(xml!(li [] [xml!(a
                    [href=href_path.to_str().unwrap()]
                    title.iter().map(|(e,loc)| process_text_elem(ctx.fork_with_loc(loc.to_owned()), e.clone())).collect::<EResult<Vec<_>>>()?
                )]))
            })
            .collect::<EResult<Vec<_>>>())
        .unwrap_or_else(|| Ok(Vec::new()))?
    ))
}

fn execute_code(ctx: Context, inner: Vec<TextElemAst>) -> EResult<XMLElem> {
    Ok(xml!(code [] inner.into_iter()
            .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
            .collect::<EResult<Vec<_>>>()?))
}

fn execute_blockcode(ctx: Context, attrs: HashMap<String, ValueAst>) -> EResult<XMLElem> {
    let src = get!(ctx.location, attrs, "src", Str)?;
    let lang = get!(ctx.location, attrs, "lang", Str)?;
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
    let mut code = Vec::new();
    for line in lines[empty_line_cnt_from_head..lines.len() - empty_line_cnt_from_tail].to_vec() {
        code.push(line.get(padding_n..).unwrap_or(""));
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
extern crate hex;
fn process_inlinestr(_: Context, s: String) -> EResult<XMLElem> {
    Ok(xml!(span[class = "inline-code"][xml!(s)]))
}

fn execute_iframe(ctx: Context, attrs: HashMap<String, ValueAst>) -> EResult<XMLElem> {
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
        ("src", Some(get!(ctx.location, attrs, "src", Str)?)),
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

fn execute_figure(
    ctx: Context,
    attrs: HashMap<String, ValueAst>,
    inner: Vec<TextElemAst>,
) -> EResult<XMLElem> {
    let caption = get!(ctx.location, attrs, "caption", Text)?;
    let id = verify!(attrs, "id", Str)?;
    let figures = inner
        .iter()
        .map(|(e, loc)| {
            if let TextElem::Cmd(cmd) = e {
                if cmd.name.as_str() == "img" {
                    execute_img(ctx.fork_with_loc(loc.to_owned()), cmd.attrs.clone())
                } else {
                    Err(Error::ProcessError(
                        ctx.location.clone(),
                        "\\figure can only have \\img as child element.".to_owned(),
                    ))
                }
            } else {
                Err(Error::ProcessError(
                    ctx.location.clone(),
                    "\\figure can only have \\img as child element.".to_owned(),
                ))
            }
        })
        .collect::<EResult<Vec<XMLElem>>>()?;
    let inner = vec![
        xml!(div [class="images"] figures),
        xml!(figurecaption [] process_text(ctx, caption)?),
    ];
    if let Some(id) = id {
        Ok(xml!(figure [id=id] inner))
    } else {
        Ok(xml!(figure [] inner))
    }
}

fn process_text(ctx: Context, textelems: Vec<TextElemAst>) -> EResult<Vec<XMLElem>> {
    textelems
        .into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<Vec<_>>>()
}

fn process_cmd(ctx: Context, cmd: Cmd) -> EResult<XMLElem> {
    match cmd.name.as_str() {
        "index" => execute_index(ctx, cmd.attrs, cmd.inner),
        "article" => execute_article(ctx, cmd.attrs, cmd.inner),
        "articles" => execute_articles(ctx, cmd.attrs),
        "section" => execute_section(ctx, cmd.attrs, cmd.inner),
        "img" => execute_img(ctx, cmd.attrs),
        "p" => execute_p(ctx, cmd.inner),
        "address" => execute_address(ctx, cmd.inner),
        "ul" => execute_ul(ctx, cmd.inner),
        "link" => execute_link(ctx, cmd.attrs, cmd.inner),
        "n" => execute_n(ctx, cmd.inner),
        "line" => execute_line(ctx, cmd.inner),
        "code" => execute_code(ctx, cmd.inner),
        "blockcode" => execute_blockcode(ctx, cmd.attrs),
        "iframe" => execute_iframe(ctx, cmd.attrs),
        "figure" => execute_figure(ctx, cmd.attrs, cmd.inner),
        _ => Err(Error::ProcessError(
            ctx.location,
            format!("invalid root cmd {}", cmd.name),
        )),
    }
}
