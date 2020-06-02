extern crate pest;
#[macro_use]
extern crate pest_derive;
#[macro_use]
extern crate serde_derive;
extern crate serde;

pub mod analysis;
pub mod codegen;
pub mod parser;

use codegen::{XMLElem, XML};
use std::collections::HashMap;
use std::path;

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
}

#[derive(Debug)]
pub struct Articles {
    pub hash: HashMap<path::PathBuf, Vec<Inline>>,
    articles: Vec<ArticleSource>,
}

impl Articles {
    pub fn into_xmls(self) -> Vec<(path::PathBuf, codegen::XML)> {
        let Self { hash, articles } = self;
        articles
            .into_iter()
            .map(|article| {
                (
                    article.path,
                    html(vec![
                        XMLElem::WithElem("head".to_owned(), vec![], vec![]),
                        XMLElem::WithElem(
                            "body".to_owned(),
                            vec![],
                            article
                                .body
                                .into_iter()
                                .map(|b| {
                                    block(
                                        Context {
                                            level: 1,
                                            hash: &hash,
                                        },
                                        b,
                                    )
                                })
                                .collect(),
                        ),
                    ]),
                )
            })
            .collect()
    }
}

#[derive(Clone)]
struct Context<'a> {
    level: usize,
    hash: &'a HashMap<path::PathBuf, Vec<Inline>>,
}

fn inline(ctx: Context, i: Inline) -> XMLElem {
    match i {
        Inline::Text(txt) => XMLElem::Text(txt.replace("&", "&amp;")),
        Inline::Code(_) => unimplemented!(),
        Inline::Link(txt, url) => XMLElem::WithElem(
            "a".to_owned(),
            vec![("href".to_owned(), url)],
            txt.into_iter()
                .map(|p| inline(ctx.clone(), p))
                .collect::<Vec<XMLElem>>(),
        ),
        Inline::Img(alttxt, src) => XMLElem::Single(
            "img".to_owned(),
            vec![("alt".to_owned(), alttxt), ("src".to_owned(), src)],
        ),
        Inline::Ext(extname, extinner) => match extname.as_str() {
            "link" => XMLElem::WithElem(
                "a".to_owned(),
                vec![("href".to_owned(), "dummy".to_owned())],
                vec![XMLElem::Text(extinner)],
            ),
            _ => unreachable!(),
        },
    }
}

fn list<'a>(ctx: Context<'a>, li: Vec<ListItem>) -> Vec<XMLElem> {
    li.into_iter()
        .map(|l| match l {
            ListItem::Block(b) => {
                XMLElem::WithElem("li".to_owned(), vec![], vec![block(ctx.clone(), b)])
            }
            ListItem::Nest(li) => XMLElem::WithElem(
                "li".to_owned(),
                vec![],
                vec![XMLElem::WithElem(
                    "ul".to_owned(),
                    vec![],
                    list(ctx.clone(), li),
                )],
            ),
            ListItem::Dummy => XMLElem::WithElem("li".to_owned(), vec![], vec![]),
        })
        .collect::<Vec<XMLElem>>()
}

fn block(ctx: Context, b: Block) -> XMLElem {
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
                .collect::<Vec<XMLElem>>();
            let heading = heading.into_iter();
            let header = XMLElem::WithElem(
                "header".to_owned(),
                vec![],
                vec![XMLElem::WithElem(
                    format!("h{}", ctx.level),
                    vec![],
                    heading
                        .map(|i| inline(ctx.clone(), i))
                        .collect::<Vec<XMLElem>>(),
                )],
            );
            let mut inner = vec![header];
            inner.append(&mut body);
            XMLElem::WithElem("section".to_owned(), vec![], inner)
        }
        Block::ExtBlock(attr, inner) => {
            let inner = inner
                .into_iter()
                .map(|b| block(ctx.clone(), b))
                .collect::<Vec<XMLElem>>();
            match attr.as_str() {
                "address" => XMLElem::WithElem("address".to_owned(), vec![], inner),
                _ => unimplemented!(),
            }
        }
        Block::P(inner) => XMLElem::WithElem(
            "p".to_owned(),
            vec![],
            inner
                .into_iter()
                .map(|i| inline(ctx.clone(), i))
                .collect::<Vec<XMLElem>>(),
        ),
        Block::Ul(li) => XMLElem::WithElem("ul".to_owned(), vec![], list(ctx, li)),
        Block::Code(_lang, src) => XMLElem::WithElem(
            "code".to_owned(),
            vec![],
            vec![XMLElem::WithElem(
                "pre".to_owned(),
                vec![],
                vec![XMLElem::Text(src)],
            )],
        ),
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
