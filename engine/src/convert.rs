use super::value_utils;
use super::xml::{XMLElem, XML};
use super::{Cmd, Error, Location, TextElem, TextElemAst, ValueAst};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use syntect::html::ClassedHTMLGenerator;
use syntect::parsing::SyntaxSet;
use log::warn;

type EResult<T> = Result<T, Error>;

#[derive(Clone)]
pub struct Context<'a> {
    pub location: Location,
    pub level: usize,
    pub prev: Option<&'a (PathBuf, Vec<TextElemAst>)>,
    pub next: Option<&'a (PathBuf, Vec<TextElemAst>)>,
    pub titles: &'a HashMap<PathBuf, Vec<(PathBuf, Vec<TextElemAst>)>>,
    pub categories: &'a HashMap<String, Vec<(PathBuf, Vec<TextElemAst>)>>,
    pub ss: &'a SyntaxSet,
    pub sha256: Option<&'a str>,
    pub path: &'a std::path::Path,
}

impl<'a> Context<'a> {
    fn fork_with_loc(&self, loc: Location) -> Context<'a> {
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

fn execute_index(
    ctx: Context,
    attrs: HashMap<String, ValueAst>,
    inner: Vec<TextElemAst>,
) -> EResult<XMLElem> {
    let title = value_utils::get_text(&attrs, "title", &ctx.location)?;
    let title = title
        .iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc.to_owned()), e.to_owned()))
        .collect::<EResult<Vec<_>>>()?;
    let mut body = vec![xml!(header [] [xml!(h1 [] title.clone())])];
    body.append(
        &mut inner
            .into_iter()
            .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
            .collect::<EResult<Vec<_>>>()?,
    );
    let header = gen_headers(&ctx.path, body.clone(), title);
    Ok(html(body, header))
}

fn gen_headers(path: &Path, body_xml: Vec<XMLElem>, title_xml: Vec<XMLElem>) -> Vec<XMLElem> {
    let url = "https://namachan10777.dev/".to_owned() + path.to_str().unwrap();
    let mut header = vec![
        xml!(link [href=resolve("index.css", &path).to_str().unwrap(), rel="stylesheet", type="text/css"]),
        xml!(link [href=resolve("syntect.css", &path).to_str().unwrap(), rel="stylesheet", type="text/css"]),
        xml!(link [href=resolve("res/favicon.ico", &path).to_str().unwrap(), rel="icon", type="image/vnd.microsoft.icon"]),
        xml!(meta [name="twitter:card", content="summary"]),
        xml!(meta [name="twitter:site", content="@namachan10777"]),
        xml!(meta [name="twitter:creator", content="@namachan10777"]),
        xml!(meta [property="og:url", content=&url]),
        xml!(meta [property="og:site_name", content="namachan10777"]),
        xml!(meta [property="og:image", content="https://namachan10777.dev/res/icon.jpg"]),
        xml!(meta [name="twitter:image", content="https://namachan10777.dev/res/icon.jpg"]),
    ];
    let title_str = title_xml
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
    header.push(xml!(title [] title_xml));
    header.push(xml!(meta [property="og:title", content=&title_str]));
    header.push(xml!(meta [name="twitter:title", content=&title_str]));
    header.push(xml!(meta [property="og:type", content="article"]));
    header.push(xml!(meta [property="og:description", content=body_str]));
    header.push(xml!(meta [name="description", content=body_str]));
    header.push(xml!(meta [name="twitter:description", content=body_str]));
    header
}

fn html(body: Vec<XMLElem>, header: Vec<XMLElem>) -> XMLElem {
    xml!(html [xmlns="http://www.w3.org/1999/xhtml", lang="ja"] [
         xml!(head [prefix="og: http://ogp.me/ns# object: http://ogp.me/ns/object#"] header),
         xml!(body [] [xml!(div [id="root"] body)])
    ])
}

fn execute_article(
    ctx: Context,
    attrs: HashMap<String, ValueAst>,
    inner: Vec<TextElemAst>,
) -> EResult<XMLElem> {
    let hashed_short = &ctx.sha256.unwrap()[..7];
    let title = value_utils::get_text(&attrs, "title", &ctx.location)?;
    let title_xml = title
        .iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc.to_owned()), e.to_owned()))
        .collect::<EResult<Vec<_>>>()?;
    let index_path = resolve("index.html", ctx.path);
    let category =
        value_utils::get_list(&attrs, "category", &ctx.location, &crate::ValueType::Str)?
            .iter()
            .map(|(cat, _)| {
                let href = resolve(&format!("category/{}.html", cat.str().unwrap()), ctx.path);
                let inner = XMLElem::Text(format!("#{}", cat.str().unwrap()));
                xml!(a [class="category", href=href.to_str().unwrap().to_owned()] vec![inner])
            })
            .collect::<Vec<XMLElem>>();
    let mut body = vec![xml!(header [] [
        xml!(a [href=index_path.to_str().unwrap().to_owned()] [xml!("戻る".to_owned())]),
        xml!(div [class="hash"] [xml!(hashed_short.to_owned())]),
        xml!(div [class="categories"] category),
        xml!(h1 [] title_xml.clone())
    ])];
    let mut footer_inner = Vec::new();
    if let Some((prev_path, prev_title)) = ctx.prev {
        let href_path = resolve_link(prev_path, ctx.path);
        footer_inner.push(xml!(a
            [href=href_path.to_str().unwrap(), class="prev-article"]
            prev_title
                .iter()
                .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc.to_owned()), e.clone())).collect::<EResult<Vec<_>>>()?
        ));
    }
    if let Some((next_path, next_title)) = ctx.next {
        let href_path = resolve_link(next_path, ctx.path);
        footer_inner.push(xml!(a
            [href=href_path.to_str().unwrap(), class="next-article"]
            next_title
                .iter()
                .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc.to_owned()), e.clone())).collect::<EResult<Vec<_>>>()?
        ));
    }
    let mut body_xml = inner
        .into_iter()
        .map(|(e, loc)| process_text_elem(ctx.fork_with_loc(loc), e))
        .collect::<EResult<Vec<_>>>()?;
    let header = gen_headers(&ctx.path, body_xml.clone(), title_xml);
    body.append(&mut body_xml);
    body.push(xml!(footer [] footer_inner));

    Ok(html(body, header))
}

fn execute_section(
    ctx: Context,
    attrs: HashMap<String, ValueAst>,
    inner: Vec<TextElemAst>,
) -> EResult<XMLElem> {
    let title = value_utils::get_text(&attrs, "title", &ctx.location)?;
    let mut header = vec![xml!(header [] [
        XMLElem::WithElem(format!("h{}", ctx.level), vec![],
            title
            .iter()
            .map(|(e, loc)| process_text_elem(Context {location: loc.to_owned(), level: ctx.level+1, ..ctx.clone()}, e.to_owned()))
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
    let url = value_utils::get_str(&attrs, "url", &ctx.location)?;
    let alt = value_utils::get_str(&attrs, "alt", &ctx.location)?;
    let classes = value_utils::verify_str(&attrs, "class", &ctx.location)?;
    if let Some(classes) = classes {
        Ok(xml!(img [src=url, class=classes, alt=alt]))
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
            _ => unreachable!(),
        })
        .collect::<EResult<Vec<_>>>()?;
    Ok(xml!(ul [] inner))
}

fn execute_link(
    ctx: Context,
    attrs: HashMap<String, ValueAst>,
    inner: Vec<TextElemAst>,
) -> EResult<XMLElem> {
    let url = value_utils::get_str(&attrs, "url", &ctx.location)?;
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
    let dir = value_utils::get_str(&attrs, "dir", &ctx.location)?;
    let parent = Path::new(dir);
    Ok(xml!(ul [] ctx
        .titles
        .get(parent)
        .map(|articles|
             articles
            .iter()
            .map(|(path, title)| {
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
    let src = value_utils::get_str(&attrs, "src", &ctx.location)?;
    let lang = value_utils::get_str(&attrs, "lang", &ctx.location)?;
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
        warn!("missing syntax for {}", lang);
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
            value_utils::verify_int(&attrs, "width", &ctx.location)?.map(|i| i.to_string()),
        ),
        (
            "height",
            value_utils::verify_int(&attrs, "height", &ctx.location)?.map(|i| i.to_string()),
        ),
        (
            "frameborder",
            value_utils::verify_int(&attrs, "frameborder", &ctx.location)?.map(|i| i.to_string()),
        ),
        (
            "style",
            value_utils::verify_str(&attrs, "style", &ctx.location)?.map(|s| s.to_string()),
        ),
        (
            "scrolling",
            value_utils::verify_str(&attrs, "scrolling", &ctx.location)?.map(|s| s.to_string()),
        ),
        (
            "src",
            value_utils::verify_str(&attrs, "src", &ctx.location)?.map(|s| s.to_string()),
        ),
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
    let caption = value_utils::get_text(&attrs, "caption", &ctx.location)?.to_vec();
    let id = value_utils::verify_str(&attrs, "id", &ctx.location)?;
    let figures = inner
        .iter()
        .map(|(e, loc)| {
            if let TextElem::Cmd(cmd) = e {
                if cmd.name.as_str() == "img" {
                    execute_img(ctx.fork_with_loc(loc.to_owned()), cmd.attrs.clone())
                } else {
                    Err(Error::ProcessError {
                        loc: ctx.location.clone(),
                        desc: "\\figure can only have \\img as child element.".to_owned(),
                    })
                }
            } else {
                Err(Error::ProcessError {
                    loc: ctx.location.clone(),
                    desc: "\\figure can only have \\img as child element.".to_owned(),
                })
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

fn execute_categories(ctx: Context) -> EResult<XMLElem> {
    let cateories = ctx
        .categories
        .keys()
        .map(|p| {
            let path = resolve(&format!("category/{}.html", p), ctx.path)
                .to_str()
                .unwrap()
                .to_owned();
            xml!(li [] [xml!(a [href=path] [XMLElem::Text(p.to_owned())])])
        })
        .collect();
    Ok(xml!(ul [] cateories))
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
        "categories" => execute_categories(ctx),
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
        _ => Err(Error::NoSuchCmd {
            loc: ctx.location,
            name: cmd.name.to_owned(),
        }),
    }
}

pub fn generate_category_pages(
    report: &super::analysis::Report,
) -> EResult<Vec<(PathBuf, XMLElem)>> {
    report
        .category_pages
        .iter()
        .map(|(category_name, articles)| {
            let output_path = Path::new(&format!("category/{}.html", category_name)).to_owned();
            let title = vec![XMLElem::Text(format!("Category: {}", category_name))];
            let titles = articles
                .iter()
                .map(|(p, title)| {
                    println!("{:?}", p);
                    let title_xml = title
                        .iter()
                        .map(|(e, _)| process_text_elem(report.general_context(p), e.to_owned()))
                        .collect::<EResult<Vec<XMLElem>>>()?;
                    let path = resolve(p.to_str().unwrap(), &output_path);
                    Ok(xml!(li [] [xml!(a [href=path.to_str().unwrap().to_owned()] title_xml)]))
                })
                .collect::<EResult<Vec<XMLElem>>>()?;
            let body = vec![xml!(header [] [
                xml!(a [href="../index.html"] [xml!("戻る".to_owned())]),
                xml!(h1 [] title.clone()),
                xml!(ul [] titles)
            ])];
            let header = gen_headers(&output_path, body.clone(), title);
            Ok((output_path, html(body, header)))
        })
        .collect::<EResult<Vec<(PathBuf, XMLElem)>>>()
}
