extern crate pest;
#[macro_use]
extern crate pest_derive;

pub mod backend;
pub mod frontend;

use backend::XMLElem;
use frontend::{Block, Inline, ListItem};

#[derive(Clone)]
struct Context {
    level: usize,
}

impl Default for Context {
    fn default() -> Self {
        Context { level: 1 }
    }
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
        Inline::Ext(extname, extinner) => {
            match extname.as_str() {
                "link" => {
                    XMLElem::WithElem("a".to_owned(), vec![
                        ("href".to_owned(), "dummy".to_owned())
                    ], vec![XMLElem::Text(extinner)])
                },
                _ => unreachable!(),
            }
        },
        _ => unimplemented!(),
    }
}

fn list(ctx: Context, li: Vec<ListItem>) -> Vec<XMLElem> {
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

fn html(bs: Vec<XMLElem>) -> backend::XML {
    backend::XML::new(
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

pub fn conv(b: Block) -> backend::XML {
    html(vec![
        XMLElem::WithElem("head".to_owned(), vec![], vec![]),
        XMLElem::WithElem(
            "body".to_owned(),
            vec![],
            vec![block(Default::default(), b)],
        ),
    ])
}
