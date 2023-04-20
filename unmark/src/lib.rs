use std::cell::RefCell;

use axohtml::{
    dom::DOMTree,
    elements::{FlowContent, PhrasingContent},
    html, text,
};
use comrak::{
    arena_tree::Node,
    nodes::{Ast, NodeCodeBlock, NodeHeading, NodeHtmlBlock, NodeValue},
};
use itertools::Itertools;

use crate::parser::custom_component;
pub mod parser;

#[derive(Clone, Copy)]
pub struct Context<'a> {
    pub title: &'a str,
    pub section_level: u8,
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("not root")]
    NotRoot,
    #[error("custom component parse error {line}:{col} \"{literal}\"")]
    CustomComponent {
        col: usize,
        line: usize,
        literal: String,
    },
}

// 自分より高いlevelに当たったら処理を終了
// 自分と同じレベルに当たったら内部のパースを行い、継続
/*
### Foo
bar
hoge

#### hoge
poo

# bar


*/

fn phrasing_content<'a>(
    ctx: Context,
    md: &'a Node<'a, RefCell<Ast>>,
) -> Result<Box<dyn PhrasingContent<String>>, Error> {
    match &md.data.borrow().value {
        NodeValue::Text(text) => Ok(text!(text)),
        NodeValue::Emph => Ok(html!(
            <strong>{md.children().map(|node| phrasing_content(ctx, node)).collect::<Result<Vec<_>, _>>()?}</strong>
        )),
        _ => panic!("unimplemented: {md:?}"),
    }
}

fn section_content<'a>(
    _ctx: Context,
    md: &'a Node<'a, RefCell<Ast>>,
) -> Result<Box<dyn FlowContent<String>>, Error> {
    match &md.data.borrow().value {
        NodeValue::HtmlBlock(NodeHtmlBlock { literal, .. }) => {
            let sourcerepp = md.data.borrow().sourcepos;
            let _custom_component = custom_component::parse_html(literal.trim()).map_err(|_| {
                Error::CustomComponent {
                    col: sourcerepp.start.column,
                    line: sourcerepp.start.line,
                    literal: literal.clone(),
                }
            })?;
            Ok(text!("custom_tag"))
        }
        NodeValue::CodeBlock(NodeCodeBlock { literal, .. }) => Ok(html!(
            <pre><code>{text!(literal)}</code></pre>
        )),
        node => panic!("not implemented: {node:?}"),
    }
}

type SectionContent = (usize, Vec<Box<dyn FlowContent<String>>>);

fn sections<'a>(ctx: Context, md: &[&'a Node<'a, RefCell<Ast>>]) -> Result<SectionContent, Error> {
    let mut reading_pos = 0;
    let mut contents = Vec::new();
    while reading_pos < md.len() {
        match md[reading_pos].data.borrow().value {
            NodeValue::Heading(NodeHeading { level, .. }) if level <= ctx.section_level => {
                return Ok((reading_pos, contents))
            }
            NodeValue::Heading(NodeHeading { level, .. }) => {
                let (read_count, inner_contents) = sections(
                    Context {
                        section_level: ctx.section_level + 1,
                        ..ctx
                    },
                    &md[reading_pos + 1..],
                )?;
                let title_inner = md[reading_pos]
                    .children()
                    .map(|node| phrasing_content(ctx, node))
                    .collect::<Result<Vec<_>, _>>()?;
                let title: Box<dyn FlowContent<String>> = match level {
                    1 => html!(<h1>{title_inner}</h1>),
                    2 => html!(<h2>{title_inner}</h2>),
                    3 => html!(<h3>{title_inner}</h3>),
                    4 => html!(<h4>{title_inner}</h4>),
                    5 => html!(<h5>{title_inner}</h5>),
                    6 => html!(<h6>{title_inner}</h6>),
                    _ => unreachable!(),
                };
                contents.push(html!(
                    <section>
                        <header>{title}</header>
                        {inner_contents}
                    </section>
                ));
                reading_pos += read_count + 1;
            }
            _ => {
                contents.push(section_content(ctx, md[reading_pos])?);
                reading_pos += 1;
            }
        }
    }
    Ok((reading_pos, contents))
}

fn body<'a, 'b, I: Iterator<Item = &'a Node<'a, RefCell<Ast>>>>(
    ctx: Context,
    md: I,
) -> Result<Box<dyn FlowContent<String>>, Error> {
    Ok(html!(
        <div>{sections(ctx, &md.collect_vec())?.1}</div>
    ))
}

pub fn document<'a>(
    ctx: Context,
    md: &'a Node<'a, RefCell<Ast>>,
) -> Result<DOMTree<String>, Error> {
    if let NodeValue::Document = &md.data.borrow().value {
        Ok(html!(
            <html>
                <head>
                    <title>{text!(ctx.title)}</title>
                </head>
                <body>{body(ctx, md.children())?}</body>
            </html>
        ))
    } else {
        Err(Error::NotRoot)
    }
}
