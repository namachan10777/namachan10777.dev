extern crate pest;
#[macro_use]
extern crate pest_derive;
#[macro_use]
extern crate serde_derive;
extern crate serde;
extern crate syntect;

pub mod analysis;
#[macro_use]
pub mod codegen;
pub mod parser;

use codegen::{XMLElem, XML};
use std::collections::HashMap;
use std::path;
use syntect::html::ClassedHTMLGenerator;
use syntect::parsing::SyntaxSet;

#[derive(Debug)]
pub enum Error {
    UnresolvedInlineExt(String),
    UnresolvedBlockExt(String),
    UnresolvedLink(String),
}

type CResult<T> = Result<T, Error>;

#[derive(Debug, PartialEq, Clone)]
pub enum Inline {
    Text(String),
    Code(String),
    Link(Vec<Inline>, String),
    Img(String, String),
    Ext(String, String),
}

#[derive(Debug, PartialEq, Clone)]
pub enum ListItem {
    Block(Block),
    Dummy,
    Nest(Vec<ListItem>),
}

#[derive(Debug, PartialEq, Clone)]
pub enum Block {
    Section(Vec<Inline>, Vec<Block>),
    ExtBlock(String, Vec<Block>),
    P(Vec<Inline>),
    Ul(Vec<ListItem>),
    Code(String, String),
}

impl Inline {
    fn interpret_str(&self) -> String {
        match self {
            Inline::Code(s) => s.clone(),
            Inline::Ext(_, _) => String::new(),
            Inline::Img(_, alt) => format!("[{}]", alt),
            Inline::Link(surface, _) => surface
                .iter()
                .map(|i| i.interpret_str())
                .collect::<Vec<String>>()
                .join(""),
            Inline::Text(txt) => txt.clone(),
        }
    }
}

#[derive(Deserialize, Debug)]
pub struct Config {
    pub article: String,
}

#[derive(Debug)]
pub struct ArticleSource {
    pub body: Vec<Block>,
    pub path: path::PathBuf,
    pub relpath: String,
}

#[derive(Debug)]
pub struct Articles<'a> {
    pub hash: HashMap<String, Vec<Inline>>,
    articles: Vec<ArticleSource>,
    rootpath: &'a path::Path,
    syntax_set: SyntaxSet,
}

impl<'a> Articles<'a> {
    pub fn into_xmls(self) -> CResult<Vec<(String, codegen::XML)>> {
        let Self {
            hash,
            articles,
            rootpath,
            syntax_set,
        } = self;

        articles
            .into_iter()
            .map(|article| {
                let relpath = article.relpath.clone();
                article
                    .body
                    .into_iter()
                    .map(|b| {
                        block(
                            Context {
                                level: 1,
                                hash: &hash,
                                rootpath,
                                syntax_set: &syntax_set,
                            },
                            b,
                        )
                    })
                    .collect::<CResult<Vec<XMLElem>>>()
                    .map(|body| {
                        (
                            relpath.clone(),
                            html(vec![
                                 xml!(head [] [
                                    xml!(link [href="./syntect-highlight.css", rel="stylesheet", type="text/css"]),
                                    xml!(link [href="./index.css", rel="stylesheet", type="text/css"]),
                                    xml!(link [href="./res/favicon.ico", type="shortcut icon"]),
                                    xml!(meta [name="twitter:card", content="summary"]),
                                    xml!(meta [name="twitter:site", content="@namachan10777"]),
                                    xml!(meta [name="twitter:creator", content="@namachan10777"]),
                                    xml!(meta [property="og:title", content="namachan10777"]),
                                    xml!(meta [
                                         property="og:description",
                                         content=hash
                                            .get(&relpath)
                                            .unwrap_or(&vec![])
                                            .iter()
                                            .map(|i| i.interpret_str())
                                            .collect::<Vec<String>>()
                                            .join("")]),
                                    xml!(meta [property="og:image", content="https://namachan10777.dev/res/icon.jpg"]),
                                    xml!(meta [property="og:url", content="https://namachan10777.dev"])
                                 ]),
                                 xml!(body [] body),
                            ]),
                        )
                    })
            })
            .collect::<CResult<Vec<(String, codegen::XML)>>>()
    }
}

#[derive(Clone)]
struct Context<'a> {
    level: usize,
    rootpath: &'a path::Path,
    hash: &'a HashMap<String, Vec<Inline>>,
    syntax_set: &'a SyntaxSet,
}

fn inline(ctx: Context, i: Inline) -> CResult<XMLElem> {
    match i {
        Inline::Text(txt) => Ok(xml!(txt.replace("&", "&amp;"))),
        Inline::Code(s) => Ok(xml!(code[class = "inline-code"][xml!(s)])),
        Inline::Link(txt, url) => Ok(xml!(
            a
            [href=url]
            txt.into_iter()
                .map(|p| inline(ctx.clone(), p))
                .collect::<CResult<Vec<XMLElem>>>()?
        )),
        Inline::Img(alttxt, src) => Ok(xml!(img [alt=alttxt, src=src])),
        Inline::Ext(extname, extinner) => match extname.as_str() {
            "link" => Ok(xml!(
                a
                [href = extinner.trim_end_matches(".md").to_owned() + ".xhtml"]
                ctx.hash
                    .get(extinner.as_str())
                    .ok_or(Error::UnresolvedLink(extinner))?
                    .iter()
                    .map(|i| inline(ctx.clone(), i.clone()))
                    .collect::<CResult<Vec<XMLElem>>>()?
            )),
            "icon" => Ok(xml!(img [ src="extinner", alt="my icon", class="icon" ])),
            _ => Err(Error::UnresolvedInlineExt(extname)),
        },
    }
}

fn list<'a>(ctx: Context<'a>, li: Vec<ListItem>) -> CResult<Vec<XMLElem>> {
    li.into_iter()
        .map(|l| match l {
            ListItem::Block(b) => Ok(xml!(li [] [block(ctx.clone(), b)?])),
            ListItem::Nest(li) => Ok(xml!(li [] [xml!(ul [] list(ctx.clone(), li)?)])),
            ListItem::Dummy => Ok(xml!(li [] [])),
        })
        .collect::<CResult<Vec<XMLElem>>>()
}

fn block(ctx: Context, b: Block) -> CResult<XMLElem> {
    match b {
        Block::Section(heading, inner) => {
            let mut body = inner
                .into_iter()
                .map(|b| {
                    block(
                        Context {
                            level: ctx.level + 1,
                            ..ctx
                        },
                        b,
                    )
                })
                .collect::<CResult<Vec<XMLElem>>>()?;
            let heading = heading.into_iter();
            let header = XMLElem::WithElem(
                "header".to_owned(),
                vec![],
                vec![XMLElem::WithElem(
                    format!("h{}", ctx.level),
                    vec![],
                    heading
                        .map(|i| inline(ctx.clone(), i))
                        .collect::<CResult<Vec<XMLElem>>>()?,
                )],
            );
            let mut inner = vec![header];
            inner.append(&mut body);
            Ok(xml!(section [] inner))
        }
        Block::ExtBlock(attr, inner) => {
            let inner = inner
                .into_iter()
                .map(|b| block(ctx.clone(), b))
                .collect::<CResult<Vec<XMLElem>>>()?;
            match attr.as_str() {
                "address" => Ok(xml!(address [] inner)),
                _ => Err(Error::UnresolvedBlockExt(attr)),
            }
        }
        Block::P(inner) => Ok(xml!(
            p
            []
            inner
                .into_iter()
                .map(|i| inline(ctx.clone(), i))
                .collect::<CResult<Vec<XMLElem>>>()?
        )),
        Block::Ul(li) => Ok(xml!(ul [] list(ctx, li)?)),
        Block::Code(lang, src) => {
            let styled_src = if lang != "text" {
                let syntax = ctx.syntax_set.find_syntax_by_extension(&lang).unwrap();
                let mut html_generator = ClassedHTMLGenerator::new(&syntax, ctx.syntax_set);
                for line in src.lines() {
                    html_generator.parse_html_for_line(&line);
                }
                html_generator.finalize()
            } else {
                src
            };
            Ok(xml!(pre[class = "code"][xml!(code [] [xml!(styled_src)])]))
        }
    }
}

pub fn html(bs: Vec<XMLElem>) -> XML {
    XML::new(
        "1.0",
        "UTF-8",
        "html",
        xml!(html [xmlns="http://www.w3.org/1999/xhtml", lang="ja"] bs),
    )
}
