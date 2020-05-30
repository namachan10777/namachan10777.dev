extern crate pest;
#[macro_use]
extern crate pest_derive;

pub mod backend;
pub mod frontend;

use backend::XMLElem;
use frontend::{Block, Inline};

#[derive(Clone)]
struct Context {
    level: usize,
}

impl Default for Context {
    fn default() -> Self {
        Context { level: 1 }
    }
}

fn inline(_ctx: Context, i: Inline) -> XMLElem {
    match i {
        Inline::Text(txt) => XMLElem::Text(txt.to_owned()),
        Inline::Code(_) => unimplemented!(),
    }
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
            let header = XMLElem::WithElem(
                "header".to_owned(),
                vec![],
                vec![XMLElem::WithElem(
                    format!("h{}", ctx.level),
                    vec![],
                    vec![XMLElem::Text(heading)],
                )],
            );
            let mut inner = vec![header];
            inner.append(&mut body);
            XMLElem::WithElem("section".to_owned(), vec![], inner)
        }
        Block::P(inner) => XMLElem::WithElem(
            "p".to_owned(),
            vec![],
            inner
                .into_iter()
                .map(|i| inline(ctx.clone(), i))
                .collect::<Vec<XMLElem>>(),
        ),
        Block::Ul(_) => unimplemented!(),
        Block::Code(_, _) => unimplemented!(),
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
