use comrak::{
    arena_tree::Node,
    nodes::{Ast, ListType, NodeCode, NodeCodeBlock, NodeHeading, NodeList, NodeValue},
};
use itertools::Itertools;
use std::{cell::RefCell, collections::HashMap, fmt::Debug};

pub type Children = Vec<MdAst>;

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum MdAst {
    Text(String),
    Paragraph(Children),
    Section {
        header: Children,
        level: u8,
        inner: Children,
    },
    BlockQuote(Children),
    UnorderedList(Vec<Children>),
    StrikeThrough(Children),
    OrderedList(Vec<Children>),
    Bold(Children),
    Italic(Children),
    BoldItalic(Children),
    Link {
        text: Children,
        url: url::Url,
    },
    Image {
        alt: String,
        url: url::Url,
    },
    Break,
    Html {
        tag: String,
        attrs: HashMap<String, String>,
        children: Children,
    },
    Code(String),
    CodeBlock {
        literal: String,
        info: String,
    },
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("invalid list item")]
    InvalidListItem,
    #[error("root not found")]
    RootNotFound,
}

#[derive(Clone, Copy)]
struct Context {
    section_level: u8,
}

fn content<'a>(ctx: Context, md: &'a Node<'a, RefCell<Ast>>) -> Result<MdAst, Error> {
    match &md.data.borrow().value {
        NodeValue::Text(text) => Ok(MdAst::Text(text.clone())),
        NodeValue::CodeBlock(NodeCodeBlock { literal, info, .. }) => Ok(MdAst::CodeBlock {
            literal: literal.clone(),
            info: info.clone(),
        }),
        NodeValue::Paragraph => Ok(MdAst::Paragraph(
            md.children().flat_map(|md| content(ctx, md)).collect_vec(),
        )),
        NodeValue::List(NodeList { list_type, .. }) => {
            let items = md
                .children()
                .map(|md| {
                    if let NodeValue::Item(_) = md.data.borrow().value {
                        md.children()
                            .map(|md| content(ctx, md))
                            .collect::<Result<_, _>>()
                    } else {
                        Err(Error::InvalidListItem)
                    }
                })
                .collect::<Result<Vec<_>, _>>()?;
            match list_type {
                ListType::Bullet => Ok(MdAst::UnorderedList(items)),
                ListType::Ordered => Ok(MdAst::OrderedList(items)),
            }
        }
        NodeValue::Code(NodeCode { literal, .. }) => Ok(MdAst::Code(literal.clone())),
        md => unimplemented!("{md:?}"),
    }
}

fn sections<'a>(
    ctx: Context,
    md: &[&'a Node<'a, RefCell<Ast>>],
) -> Result<(usize, Vec<MdAst>), Error> {
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
                        section_level: level + 1,
                    },
                    &md[reading_pos + 1..],
                )?;
                let title_inner = md[reading_pos]
                    .children()
                    .map(|md| content(ctx, md))
                    .collect::<Result<Vec<_>, _>>()?;
                contents.push(MdAst::Section {
                    header: title_inner,
                    level,
                    inner: inner_contents,
                });
                reading_pos += read_count + 1;
            }
            _ => {
                contents.push(content(ctx, md[reading_pos])?);
                reading_pos += 1;
            }
        }
    }
    Ok((reading_pos, contents))
}

pub fn document<'a>(md: &'a Node<'a, RefCell<Ast>>) -> Result<Vec<MdAst>, Error> {
    if let NodeValue::Document = md.data.borrow().value {
        sections(Context { section_level: 0 }, &md.children().collect_vec()).map(|x| x.1)
    } else {
        Err(Error::RootNotFound)
    }
}
