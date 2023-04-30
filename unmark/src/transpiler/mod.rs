use std::cell::RefCell;

use axohtml::{html, text};
use comrak::{
    arena_tree::{Children, Node},
    nodes::{Ast, ListType, NodeCode, NodeCodeBlock, NodeHeading, NodeLink, NodeList, NodeValue},
};
use itertools::Itertools;

mod helper;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("no root found")]
    NoRootFound,
    #[error("no syntax found for {0}")]
    NoSyntaxFound(String),
    #[error("too large level: {0}")]
    TooLargeLevel(u8),
    #[error("invalid list item")]
    InvalidListItem,
}

#[derive(Clone)]
pub struct Context {
    section_level: u8,
}

#[allow(clippy::derivable_impls)]
impl Default for Context {
    fn default() -> Self {
        Context { section_level: 0 }
    }
}

pub type FlowContent = Box<dyn axohtml::elements::FlowContent<String>>;
pub type PhrasingContent = Box<dyn axohtml::elements::PhrasingContent<String>>;

fn emph(
    ctx: Context,
    children: Children<RefCell<Ast>>,
) -> Result<Box<axohtml::elements::strong<String>>, Error> {
    Ok(
        html!(<strong>{children.map(|md| phrasing_content(ctx.clone(), md)).collect::<Result<Vec<_>, _>>()?}</strong>),
    )
}

fn image(
    _ctx: Context,
    url: &str,
    title: &str,
) -> Result<Box<axohtml::elements::img<String>>, Error> {
    Ok(html!(<img src=url alt=title />))
}

fn link(
    ctx: Context,
    url: &str,
    _title: &str,
    children: Children<RefCell<Ast>>,
) -> Result<Box<axohtml::elements::a<String>>, Error> {
    Ok(
        html!(<a href=url>{children.map(|md| flow_content(ctx.clone(), md)).collect::<Result<Vec<_>, _>>()?}</a>),
    )
}

fn inline_code(
    _ctx: Context,
    literal: &str,
) -> Result<Box<axohtml::elements::code<String>>, Error> {
    Ok(html!(<code class="inline-code">{text!(literal)}</code>))
}

fn split_line_plaintext(src: &str) -> Vec<PhrasingContent> {
    src.lines()
        .map(|line| -> PhrasingContent { html!(<span class="line">{text!(line)}</span>) })
        .collect_vec()
}

fn block_code(
    _ctx: Context,
    literal: &str,
    info: &str,
) -> Result<Box<axohtml::elements::div<String>>, Error> {
    // FIXME
    let theme = &helper::THEME_SET.themes["base16-mocha.dark"];
    let styled_code = if matches!(info, "plaintext" | "text" | "txt") {
        split_line_plaintext(literal)
    } else {
        let syntax = helper::SYNTAX_SET
            .find_syntax_by_name(info)
            .or_else(|| helper::SYNTAX_SET.find_syntax_by_extension(info))
            .ok_or_else(|| Error::NoSyntaxFound(info.to_owned()))?;
        helper::syntax_highlight(literal, theme, syntax)
    };
    Ok(html!(
        <div class="block-code">
        <button class="code-copy">"copy"</button>
            <pre class="invisible-code-repo"><code class="plaintext-code">{text!(literal)}</code></pre>
            <pre><code>{styled_code}</code></pre>
        </div>
    ))
}

fn paragraph(
    ctx: Context,
    children: Children<RefCell<Ast>>,
) -> Result<Box<axohtml::elements::p<String>>, Error> {
    Ok(
        html!(<p class="paragraph">{children.map(|md| phrasing_content(ctx.clone(), md)).collect::<Result<Vec<_>, _>>()?}</p>),
    )
}

fn unordered_list<'a, I: IntoIterator<Item = Children<'a, RefCell<Ast>>>>(
    ctx: Context,
    items: I,
) -> Result<Box<axohtml::elements::ul<String>>, Error> {
    Ok(html!(
        <ul>
            {
                items
                    .into_iter()
                    .map(|children| {
                        Ok(html!(<li>{children.map(|md| flow_content(ctx.clone(), md)).collect::<Result<Vec<_>, _>>()?}</li>))
                    })
                    .collect::<Result<Vec<_>, _>>()?
            }
        </ul>
    ))
}

fn ordered_list<'a, I: IntoIterator<Item = Children<'a, RefCell<Ast>>>>(
    ctx: Context,
    items: I,
) -> Result<Box<axohtml::elements::ol<String>>, Error> {
    Ok(html!(
        <ol>
        {
            items
                .into_iter()
                .map(|children| {
                    Ok(html!(<li>{children.map(|md| flow_content(ctx.clone(), md)).collect::<Result<Vec<_>, _>>()?}</li>))
                })
                .collect::<Result<Vec<_>, _>>()?
        }
        </ol>
    ))
}

fn flow_content<'a>(ctx: Context, md: &'a Node<'a, RefCell<Ast>>) -> Result<FlowContent, Error> {
    match &md.data.borrow().value {
        NodeValue::Text(text) => Ok(text!(text)),
        NodeValue::CodeBlock(NodeCodeBlock { literal, info, .. }) => {
            Ok(block_code(ctx, literal, info)?)
        }
        NodeValue::Paragraph => Ok(paragraph(ctx, md.children())?),
        NodeValue::List(NodeList { list_type, .. }) => {
            let items = md
                .children()
                .map(|md| {
                    if let NodeValue::Item(_) = md.data.borrow().value {
                        Ok(md.children())
                    } else {
                        Err(Error::InvalidListItem)
                    }
                })
                .collect::<Result<Vec<_>, _>>()?;
            match list_type {
                ListType::Bullet => Ok(unordered_list(ctx, items)?),
                ListType::Ordered => Ok(ordered_list(ctx, items)?),
            }
        }
        NodeValue::Code(NodeCode { literal, .. }) => Ok(inline_code(ctx, literal)?),
        md => unimplemented!("{md:?}"),
    }
}

fn phrasing_content<'a>(
    ctx: Context,
    md: &'a Node<'a, RefCell<Ast>>,
) -> Result<PhrasingContent, Error> {
    match &md.data.borrow().value {
        NodeValue::Text(text) => Ok(text!(text)),
        NodeValue::Emph => Ok(emph(ctx, md.children())?),
        NodeValue::Image(NodeLink { url, title }) => Ok(image(ctx, url, title)?),
        NodeValue::Link(NodeLink { url, title }) => Ok(link(ctx, url, title, md.children())?),
        NodeValue::Code(NodeCode { literal, .. }) => Ok(inline_code(ctx, literal)?),
        NodeValue::SoftBreak => Ok(text!("")), // ignore softbreak
        md => unimplemented!("{md:?}"),
    }
}

fn make_title(level: u8, inner: Vec<PhrasingContent>) -> Result<FlowContent, Error> {
    match level {
        1 => Ok(html!(<h1 class="heading">{inner}</h1>)),
        2 => Ok(html!(<h2 class="heading">{inner}</h2>)),
        3 => Ok(html!(<h3 class="heading">{inner}</h3>)),
        4 => Ok(html!(<h4 class="heading">{inner}</h4>)),
        5 => Ok(html!(<h5 class="heading">{inner}</h5>)),
        6 => Ok(html!(<h6 class="heading">{inner}</h6>)),
        _ => Err(Error::TooLargeLevel(level)),
    }
}

fn sections<'a>(
    ctx: Context,
    md: &[&'a Node<'a, RefCell<Ast>>],
) -> Result<(usize, Vec<FlowContent>), Error> {
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
                    .map(|md| phrasing_content(ctx.clone(), md))
                    .collect::<Result<Vec<_>, _>>()?;
                let title: FlowContent = make_title(level, title_inner)?;
                contents.push(html!(
                    <section>
                        <header>{title}</header>
                        {inner_contents}
                    </section>
                ));
                reading_pos += read_count + 1;
            }
            _ => {
                contents.push(flow_content(ctx.clone(), md[reading_pos])?);
                reading_pos += 1;
            }
        }
    }
    Ok((reading_pos, contents))
}

pub fn document<'a>(ctx: Context, md: &'a Node<'a, RefCell<Ast>>) -> Result<FlowContent, Error> {
    if let NodeValue::Document = md.data.borrow().value {
        let children = md.children().collect::<Vec<_>>();
        Ok(html!(<div class="root">{sections(ctx, children.as_slice())?.1}</div>))
    } else {
        Err(Error::NoRootFound)
    }
}
