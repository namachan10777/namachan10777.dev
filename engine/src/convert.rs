use sha2::Digest;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use syntect::html::ClassedHTMLGenerator;
use syntect::parsing::SyntaxSet;
use super::xml::{XMLElem, XML};
use super::{TextElemAst, ValueAst, Value, TextElem, Cmd, Location};

#[derive(Debug)]
pub enum Error<'a> {
    SyntaxError(Location<'a>, String),
    ProcessError(Location<'a>, String),
}

type EResult<'a, T> = Result<T, Error<'a>>;


type ArticleList<'a> = Vec<(PathBuf, Vec<TextElemAst<'a>>, chrono::NaiveDate)>;
#[derive(Clone)]
pub struct Context<'a> {
    location: Location<'a>,
    level: usize,
    prevs: &'a HashMap<PathBuf, (PathBuf, Vec<TextElemAst<'a>>)>,
    nexts: &'a HashMap<PathBuf, (PathBuf, Vec<TextElemAst<'a>>)>,
    articles: &'a HashMap<PathBuf, ArticleList<'a>>,
    ss: &'a SyntaxSet,
    path: &'a std::path::Path,
    src: &'a str,
}

impl<'a> Context<'a> {
    fn fork_with_loc(&self, loc: Location<'a>) -> Self {
        Self {
            location: loc,
            ..self.clone()
        }
    }
}

pub fn root<'a>(ctx: Context<'a>, cmd: Cmd<'a>) -> EResult<'a, XML> {
    Ok(XML::new("1.0", "UTF-8", "html", process_cmd(ctx, cmd)?))
}

fn process_text_elem<'a>(ctx: Context<'a>, elem: TextElem<'a>) -> EResult<'a, XMLElem> {
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

fn header_common<'a>(ctx: Context<'a>) -> Vec<XMLElem> {
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

fn execute_index<'a>(
    ctx: Context<'a>,
    attrs: HashMap<String, ValueAst<'a>>,
    inner: Vec<TextElemAst<'a>>,
) -> EResult<'a, XMLElem> {
    let title = get!(ctx.location, attrs, "title", Text)?;
    let title = title
        .into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<'a, Vec<_>>>()?;
    let mut body = vec![xml!(header [] [xml!(h1 [] title.clone())])];
    body.append(
        &mut inner
            .into_iter()
            .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
            .collect::<EResult<'a, Vec<_>>>()?,
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

fn execute_article<'a>(
    ctx: Context<'a>,
    attrs: HashMap<String, ValueAst<'a>>,
    inner: Vec<TextElemAst<'a>>,
) -> EResult<'a, XMLElem> {
    let mut hasher = sha2::Sha256::new();
    hasher.update(ctx.src);
    let hashed = hasher.finalize();
    let hashed_full = hex::encode(hashed);
    let hashed_short = &hashed_full[..7];
    let title = get!(ctx.location, attrs, "title", Text)?;
    let title = title
        .into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<'a, Vec<_>>>()?;
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
                .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc.to_owned()), e.clone())).collect::<EResult<'a, Vec<_>>>()?
        ));
    }
    if let Some((next_path, next_title)) = ctx.nexts.get(ctx.path) {
        let href_path = resolve_link(next_path, ctx.path);
        footer_inner.push(xml!(a
            [href=href_path.to_str().unwrap(), class="next-article"]
            next_title
                .iter()
                .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc.to_owned()), e.clone())).collect::<EResult<'a, Vec<_>>>()?
        ));
    }
    let mut header = header_common(ctx.clone());
    let mut body_xml = inner
        .into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<'a, Vec<_>>>()?;
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

fn execute_section<'a>(
    ctx: Context<'a>,
    attrs: HashMap<String, ValueAst<'a>>,
    inner: Vec<TextElemAst<'a>>,
) -> EResult<'a, XMLElem> {
    let title = get!(ctx.location, attrs, "title", Text)?;
    let mut header = vec![xml!(header [] [
        XMLElem::WithElem(format!("h{}", ctx.level), vec![],
            title
            .into_iter()
            .map(|(e, loc)| process_text_elem(Context {location: loc, level: ctx.level+1, ..ctx.clone()}, e))
            .collect::<EResult<'a, Vec<_>>>()?
        )
    ])];
    let ctx_child = Context {
        level: ctx.level + 1,
        ..ctx.clone()
    };
    let mut body = inner
        .into_iter()
        .map(|(e, loc)| process_text_elem(ctx_child.fork_with_loc(loc), e))
        .collect::<EResult<'a, Vec<_>>>()?;
    header.append(&mut body);
    Ok(xml!(section [] header))
}

fn execute_img<'a>(ctx: Context<'a>, attrs: HashMap<String, ValueAst<'a>>) -> EResult<'a, XMLElem> {
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

fn execute_p<'a>(ctx: Context<'a>, inner: Vec<TextElemAst<'a>>) -> EResult<'a, XMLElem> {
    Ok(
        xml!(p [] inner.into_iter().map(|(e,loc)| process_text_elem(ctx.fork_with_loc(loc), e)).collect::<EResult<'a, Vec<_>>>()?),
    )
}

fn execute_line<'a>(ctx: Context<'a>, inner: Vec<TextElemAst<'a>>) -> EResult<'a, XMLElem> {
    Ok(
        xml!(span [] inner.into_iter().map(|(e,loc)| process_text_elem(ctx.fork_with_loc(loc), e)).collect::<EResult<'a, Vec<_>>>()?),
    )
}

fn execute_address<'a>(ctx: Context<'a>, inner: Vec<TextElemAst<'a>>) -> EResult<'a, XMLElem> {
    Ok(
        xml!(address [] inner.into_iter().map(|(e,loc)| process_text_elem(ctx.fork_with_loc(loc), e)).collect::<EResult<'a, Vec<_>>>()?),
    )
}

fn execute_ul<'a>(ctx: Context<'a>, inner: Vec<TextElemAst<'a>>) -> EResult<'a, XMLElem> {
    let inner = inner
        .into_iter()
        .map(|(e, loc)| match e {
            TextElem::Cmd(cmd) => match cmd.name.as_str() {
                "n" => {
                    let inner = cmd
                        .inner
                        .into_iter()
                        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
                        .collect::<EResult<'a, Vec<_>>>()?;
                    Ok(xml!(li [] inner))
                }
                _ => Ok(xml!(li [] [process_cmd(ctx.fork_with_loc(loc), cmd)?])),
            },
            _ => Err(Error::ProcessError(
                loc,
                "ul cannot process plain text".to_owned(),
            )),
        })
        .collect::<EResult<'a, Vec<_>>>()?;
    Ok(xml!(ul [] inner))
}

fn execute_link<'a>(
    ctx: Context<'a>,
    attrs: HashMap<String, ValueAst<'a>>,
    inner: Vec<TextElemAst<'a>>,
) -> EResult<'a, XMLElem> {
    let url = get!(ctx.location, attrs, "url", Str)?;
    Ok(xml!(a [href=url] inner.into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<'a, Vec<_>>>()?))
}

fn execute_n<'a>(ctx: Context<'a>, inner: Vec<TextElemAst<'a>>) -> EResult<'a, XMLElem> {
    Ok(xml!(div [] inner.into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<'a, Vec<_>>>()?))
}

fn execute_articles<'a>(ctx: Context<'a>, attrs: HashMap<String, ValueAst<'a>>) -> EResult<'a, XMLElem> {
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
                    title.iter().map(|(e,loc)| process_text_elem(ctx.fork_with_loc(loc.to_owned()), e.clone())).collect::<EResult<'a, Vec<_>>>()?
                )]))
            })
            .collect::<EResult<'a, Vec<_>>>())
        .unwrap_or_else(|| Ok(Vec::new()))?
    ))
}

fn execute_code<'a>(ctx: Context<'a>, inner: Vec<TextElemAst<'a>>) -> EResult<'a, XMLElem> {
    Ok(xml!(code [] inner.into_iter()
            .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
            .collect::<EResult<'a, Vec<_>>>()?))
}

fn execute_blockcode<'a>(ctx: Context<'a>, attrs: HashMap<String, ValueAst<'a>>) -> EResult<'a, XMLElem> {
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
fn process_inlinestr<'a>(_: Context<'a>, s: String) -> EResult<'a, XMLElem> {
    Ok(xml!(span[class = "inline-code"][xml!(s)]))
}

fn execute_iframe<'a>(ctx: Context<'a>, attrs: HashMap<String, ValueAst<'a>>) -> EResult<'a, XMLElem> {
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

fn execute_figure<'a>(
    ctx: Context<'a>,
    attrs: HashMap<String, ValueAst<'a>>,
    inner: Vec<TextElemAst<'a>>,
) -> EResult<'a, XMLElem> {
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
        .collect::<EResult<'a, Vec<XMLElem>>>()?;
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

fn process_text<'a>(ctx: Context<'a>, textelems: Vec<TextElemAst<'a>>) -> EResult<'a, Vec<XMLElem>> {
    textelems
        .into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<'a, Vec<_>>>()
}

fn process_cmd<'a>(ctx: Context<'a>, cmd: Cmd<'a>) -> EResult<'a, XMLElem> {
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
