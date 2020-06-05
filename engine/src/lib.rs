extern crate pest;
#[macro_use]
extern crate pest_derive;
#[macro_use]
extern crate serde_derive;
extern crate serde;
extern crate syntect;

pub mod analysis;
pub mod codegen;
pub mod parser;

use codegen::{XMLElem, XML};
use std::collections::HashMap;
use std::path;
use syntect::html::{ClassStyle, ClassedHTMLGenerator};
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
                            relpath,
                            html(vec![
                                XMLElem::WithElem("head".to_owned(), vec![], vec![]),
                                XMLElem::WithElem("body".to_owned(), vec![], body),
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
        Inline::Text(txt) => Ok(XMLElem::Text(txt.replace("&", "&amp;"))),
        Inline::Code(s) => Ok(XMLElem::WithElem(
            "code".to_owned(),
            vec![],
            vec![XMLElem::Text(s)],
        )),
        Inline::Link(txt, url) => Ok(XMLElem::WithElem(
            "a".to_owned(),
            vec![("href".to_owned(), url)],
            txt.into_iter()
                .map(|p| inline(ctx.clone(), p))
                .collect::<CResult<Vec<XMLElem>>>()?,
        )),
        Inline::Img(alttxt, src) => Ok(XMLElem::Single(
            "img".to_owned(),
            vec![("alt".to_owned(), alttxt), ("src".to_owned(), src)],
        )),
        Inline::Ext(extname, extinner) => match extname.as_str() {
            "link" => Ok(XMLElem::WithElem(
                "a".to_owned(),
                vec![(
                    "href".to_owned(),
                    extinner.trim_end_matches(".md").to_owned() + ".xhtml",
                )],
                ctx.hash
                    .get(extinner.as_str())
                    .ok_or(Error::UnresolvedLink(extinner))?
                    .iter()
                    .map(|i| inline(ctx.clone(), i.clone()))
                    .collect::<CResult<Vec<XMLElem>>>()?,
            )),
            _ => Err(Error::UnresolvedInlineExt(extname)),
        },
    }
}

fn list<'a>(ctx: Context<'a>, li: Vec<ListItem>) -> CResult<Vec<XMLElem>> {
    li.into_iter()
        .map(|l| match l {
            ListItem::Block(b) => Ok(XMLElem::WithElem(
                "li".to_owned(),
                vec![],
                vec![block(ctx.clone(), b)?],
            )),
            ListItem::Nest(li) => Ok(XMLElem::WithElem(
                "li".to_owned(),
                vec![],
                vec![XMLElem::WithElem(
                    "ul".to_owned(),
                    vec![],
                    list(ctx.clone(), li)?,
                )],
            )),
            ListItem::Dummy => Ok(XMLElem::WithElem("li".to_owned(), vec![], vec![])),
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
            Ok(XMLElem::WithElem("section".to_owned(), vec![], inner))
        }
        Block::ExtBlock(attr, inner) => {
            let inner = inner
                .into_iter()
                .map(|b| block(ctx.clone(), b))
                .collect::<CResult<Vec<XMLElem>>>()?;
            match attr.as_str() {
                "address" => Ok(XMLElem::WithElem("address".to_owned(), vec![], inner)),
                _ => Err(Error::UnresolvedBlockExt(attr)),
            }
        }
        Block::P(inner) => Ok(XMLElem::WithElem(
            "p".to_owned(),
            vec![],
            inner
                .into_iter()
                .map(|i| inline(ctx.clone(), i))
                .collect::<CResult<Vec<XMLElem>>>()?,
        )),
        Block::Ul(li) => Ok(XMLElem::WithElem("ul".to_owned(), vec![], list(ctx, li)?)),
        Block::Code(lang, src) => {
            let styled_src = if lang != "text" {
                let syntax = ctx.syntax_set.find_syntax_by_extension(&lang).unwrap();
                let mut html_generator = ClassedHTMLGenerator::new(
                    &syntax,
                    ctx.syntax_set,
                );
                for line in src.lines() {
                    html_generator.parse_html_for_line(&line);
                }
                html_generator.finalize()
            }
            else {
                src
            };
            Ok(XMLElem::WithElem(
                "code".to_owned(),
                vec![],
                vec![XMLElem::WithElem(
                    "pre".to_owned(),
                    vec![],
                    vec![XMLElem::Text(styled_src)],
                )],
            ))
        }
    }
}

pub fn html(bs: Vec<XMLElem>) -> XML {
    XML::new(
        "1.0",
        "UTF-8",
        "html",
        XMLElem::WithElem(
            "html".to_owned(),
            vec![
                (
                    "xmlns".to_owned(),
                    "http://www.w3.org/1999/xhtml".to_owned(),
                ),
                ("lang".to_owned(), "ja".to_owned()),
            ],
            bs,
        ),
    )
}
