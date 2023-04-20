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
use syntect::{
    easy::HighlightLines,
    highlighting::{FontStyle, Style, Theme, ThemeSet},
    parsing::SyntaxSet,
    util::LinesWithEndings,
};

use crate::parser::custom_component;
pub mod parser;

#[derive(Clone, Copy)]
pub struct Context<'a> {
    pub title: &'a str,
    pub section_level: u8,
    pub syntax_set: &'a SyntaxSet,
    pub theme_set: &'a ThemeSet,
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
    #[error("syntax not found: {0}")]
    SyntaxNotFound(String),
    #[error("theme({0}) has no background color")]
    ThemeHasNoBackgroundColor(String),
}

// TODO: use css
fn syntax_highlight(
    ctx: Context,
    source: &str,
    theme: &Theme,
    syntax: &syntect::parsing::SyntaxReference,
) -> Result<Vec<Box<dyn PhrasingContent<String>>>, Error> {
    let mut styled = Vec::new();
    let mut h = HighlightLines::new(syntax, theme);
    for line in LinesWithEndings::from(source) {
        let ranges: Vec<(Style, &str)> = h.highlight_line(line, &ctx.syntax_set).unwrap();
        for (style, token) in ranges {
            let italic = style.font_style.contains(FontStyle::ITALIC);
            let bold = style.font_style.contains(FontStyle::BOLD);
            let underline = style.font_style.contains(FontStyle::UNDERLINE);
            let html_style = format!(
                "color: rgba({}, {}, {}, {}); background-color: rgba({}, {}, {}, {});",
                style.foreground.r,
                style.foreground.g,
                style.foreground.b,
                style.foreground.a,
                style.background.r,
                style.background.g,
                style.background.b,
                style.background.a,
            );
            let html_style = if italic {
                format!("{html_style} font-stylet: italic;")
            } else {
                html_style
            };
            let html_style = if bold {
                format!("{html_style} font-weight: bold;")
            } else {
                html_style
            };
            let html_style = if underline {
                format!("{html_style} text-decoration: underline;")
            } else {
                html_style
            };

            let styled_token: Box<dyn PhrasingContent<String>> =
                html!(<span style=html_style>{text!(token)}</span>);
            styled.push(styled_token);
        }
    }
    Ok(styled)
}

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
    ctx: Context,
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
        NodeValue::CodeBlock(NodeCodeBlock { literal, info, .. }) => {
            let info = info.trim();
            let syntax = ctx
                .syntax_set
                .find_syntax_by_name(info)
                .or_else(|| ctx.syntax_set.find_syntax_by_extension(info))
                .ok_or_else(|| Error::SyntaxNotFound(info.to_owned()))?;
            let theme = &ctx.theme_set.themes["InspiredGitHub"];
            let background_color =
                theme
                    .settings
                    .background
                    .ok_or(Error::ThemeHasNoBackgroundColor(
                        theme.name.clone().unwrap_or_else(|| "<unknown>".to_owned()),
                    ))?;
            let code_style = format!(
                "background-color: rgba({}, {}, {}, {}); padding: 0.3em 0.6em; width: fit-content;",
                background_color.r, background_color.g, background_color.b, background_color.a
            );
            Ok(html!(
                <pre style=code_style><code>{syntax_highlight(ctx, literal, theme, syntax)?}</code></pre>
            ))
        }
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
