use std::{cell::RefCell, unimplemented};

use comrak::{
    arena_tree::Node,
    nodes::{NodeCode, NodeCodeBlock, NodeLink, NodeList, NodeValue},
    Arena,
};
use once_cell::sync::Lazy;
use serde::Deserialize;

static FRONTMATTER_DELIMITER_RE: Lazy<regex::Regex> =
    Lazy::new(|| regex::Regex::new(r#"^(\+\+\+|---)[ \t\n\r\n]*$"#).unwrap());

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Ast {
    Bold(Vec<Ast>),
    Italic(Vec<Ast>),
    BoldItalic(Vec<Ast>),
    Text(String),
    Paragraph(Vec<Ast>),
    Link {
        url: String,
        contents: Vec<Ast>,
    },
    Image {
        url: String,
        alt: String,
    },
    UnorderedList(Vec<Vec<Ast>>),
    OrderedList(Vec<Vec<Ast>>),
    CodeBlock {
        info: String,
        content: String,
    },
    Code(String),
    Quote(Vec<Ast>),
    Section {
        level: u8,
        title: Vec<Ast>,
        contents: Vec<Ast>,
    },
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("frontmatter not found")]
    FrontMatterNotFound,
    #[error("frontmatter tag not closed")]
    FrontMatterTagNotClosed,
    #[error("toml deserialization error {0}")]
    DeserializeToml(toml::de::Error),
    #[error("yaml deserialization error {0}")]
    DeserializeYaml(serde_yaml::Error),
    #[error("not root")]
    NotRoot,
    #[error("list item must be Item")]
    InvalidListItem,
}

fn convert<'a>(md: &'a Node<'a, RefCell<comrak::nodes::Ast>>) -> Result<Ast, Error> {
    match &md.data.borrow().value {
        NodeValue::Text(text) => Ok(Ast::Text(text.clone())),
        NodeValue::Paragraph => {
            let children = md.children().map(convert).collect::<Result<_, _>>()?;
            Ok(Ast::Paragraph(children))
        }
        NodeValue::Code(NodeCode { literal, .. }) => Ok(Ast::Code(literal.clone())),
        NodeValue::Link(NodeLink { url, .. }) => {
            let children = md.children().map(convert).collect::<Result<_, _>>()?;
            Ok(Ast::Link {
                url: url.clone(),
                contents: children,
            })
        }
        NodeValue::Image(image) => Ok(Ast::Image {
            url: image.url.clone(),
            alt: image.title.clone(),
        }),
        NodeValue::List(NodeList { list_type, .. }) => {
            let children = md
                .children()
                .map(|md| {
                    if let NodeValue::Item(_) = &md.data.borrow().value {
                        md.children().map(convert).collect::<Result<_, _>>()
                    } else {
                        Err(Error::InvalidListItem)
                    }
                })
                .collect::<Result<_, _>>()?;
            match list_type {
                comrak::nodes::ListType::Bullet => Ok(Ast::UnorderedList(children)),
                comrak::nodes::ListType::Ordered => Ok(Ast::OrderedList(children)),
            }
        }
        NodeValue::SoftBreak => Ok(Ast::Text(String::new())),
        NodeValue::CodeBlock(NodeCodeBlock { literal, info, .. }) => {
            crate::highlight::highlight("js", literal).unwrap();
            Ok(Ast::CodeBlock {
                info: info.clone(),
                content: literal.clone(),
            })
        }
        node => unimplemented!("{:?}", node),
    }
}

fn section<'a>(
    level: u8,
    md: &[&'a Node<'a, RefCell<comrak::nodes::Ast>>],
) -> Result<(usize, Vec<Ast>), Error> {
    let mut contents = Vec::new();
    let mut index = 0;
    while index < md.len() {
        if let NodeValue::Heading(heading) = &md[index].data.borrow().value {
            if heading.level <= level {
                return Ok((index, contents));
            } else {
                let title = md[index]
                    .children()
                    .map(convert)
                    .collect::<Result<_, _>>()?;
                let (read, children) = section(heading.level, &md[index + 1..])?;
                index += read;
                contents.push(Ast::Section {
                    level: heading.level,
                    title,
                    contents: children,
                })
            }
        } else {
            contents.push(convert(md[index])?);
        }
        index += 1;
    }
    Ok((index, contents))
}

fn build_ast<'a>(md: &'a Node<'a, RefCell<comrak::nodes::Ast>>) -> Result<Vec<Ast>, Error> {
    if let NodeValue::Document = md.data.borrow().value {
        let children = md.children().collect::<Vec<_>>();
        Ok(section(0, &children)?.1)
    } else {
        Err(Error::NotRoot)
    }
}

#[derive(Debug, PartialEq, Eq)]
enum FrontMatterType {
    Yaml,
    Toml,
}

fn frontmatter_delimiter_from_line(line: &str) -> Option<FrontMatterType> {
    let mark = FRONTMATTER_DELIMITER_RE.captures(line)?.get(1)?;
    match mark.as_str() {
        "+++" => Some(FrontMatterType::Toml),
        "---" => Some(FrontMatterType::Yaml),
        _ => None,
    }
}

pub fn parse_frontmatter<T>(src: &str) -> Result<(&str, T), Error>
where
    T: for<'a> Deserialize<'a>,
{
    let mut lines = src.lines();
    let mut frontmatter_begin = 0;
    let mut mark = None;
    for line in &mut lines {
        mark = frontmatter_delimiter_from_line(line);
        frontmatter_begin += line.len() + 1;
        if mark.is_some() {
            break;
        }
    }
    let mut frontmatter_end = frontmatter_begin;
    let mut md_begin = 0;
    for line in &mut lines {
        if mark == frontmatter_delimiter_from_line(line) {
            md_begin = frontmatter_end + line.len() + 1;
            break;
        }
        frontmatter_end += line.len() + 1;
    }
    if md_begin == 0 {
        Err(Error::FrontMatterTagNotClosed)
    } else if let Some(mark) = mark {
        let frontmatter_src = &src[frontmatter_begin..frontmatter_end];
        let md_src = &src[md_begin..];
        let frontmatter = match mark {
            FrontMatterType::Toml => {
                toml::from_str(frontmatter_src).map_err(Error::DeserializeToml)
            }
            FrontMatterType::Yaml => {
                serde_yaml::from_str(frontmatter_src).map_err(Error::DeserializeYaml)
            }
        }?;
        Ok((md_src, frontmatter))
    } else {
        Err(Error::FrontMatterNotFound)
    }
}

pub fn parse<T>(src: &str) -> Result<(Vec<Ast>, T), Error>
where
    T: for<'a> Deserialize<'a>,
{
    let (md, frontmatter) = parse_frontmatter::<T>(src)?;
    let arena = Arena::new();
    let ast = comrak::parse_document(&arena, md, &Default::default());
    let ast = build_ast(ast)?;
    Ok((ast, frontmatter))
}

#[cfg(test)]
mod test {
    use super::{frontmatter_delimiter_from_line, FrontMatterType};

    #[test]
    fn test_get_frontmatter_delimiter() {
        assert_eq!(
            frontmatter_delimiter_from_line("+++"),
            Some(FrontMatterType::Toml)
        );
        assert_eq!(
            frontmatter_delimiter_from_line("--- \t"),
            Some(FrontMatterType::Yaml)
        );
        assert_eq!(frontmatter_delimiter_from_line(" --- \t"), None);
    }
}

pub mod util {
    use super::Ast;
    pub fn phrasing_content_as_string(root: &Ast) -> Option<String> {
        match root {
            Ast::Bold(ast) => Some(ast.iter().filter_map(phrasing_content_as_string).collect()),
            Ast::BoldItalic(ast) => {
                Some(ast.iter().filter_map(phrasing_content_as_string).collect())
            }
            Ast::Italic(ast) => Some(ast.iter().filter_map(phrasing_content_as_string).collect()),
            Ast::Code(ast) => Some(ast.to_owned()),
            Ast::Link { contents, .. } => Some(
                contents
                    .iter()
                    .filter_map(phrasing_content_as_string)
                    .collect(),
            ),
            Ast::Text(t) => Some(t.to_owned()),
            _ => None,
        }
    }

    pub fn h1_content_as_string(root: &[Ast]) -> Option<String> {
        root.iter()
            .filter_map(|ast| match ast {
                Ast::Section {
                    level: 1, title, ..
                } => Some(
                    title
                        .iter()
                        .filter_map(phrasing_content_as_string)
                        .collect::<String>(),
                ),
                Ast::Section { contents, .. } => contents
                    .iter()
                    .filter_map(phrasing_content_as_string)
                    .next(),
                _ => None,
            })
            .next()
    }
}
