use std::collections::{HashMap, hash_map};

use axohtml::{elements::head, types::Wrap};
use maplit::hashmap;
use pulldown_cmark::{
    CodeBlockKind, CowStr, Event, HeadingLevel, InlineStr, LinkType, Options, Parser, Tag, TagEnd,
};
use tracing::warn;

pub enum PartialFoldedHtml {
    Folded {
        tag: String,
        attrs: HashMap<String, String>,
        inner: String,
    },
    Node {
        tag: String,
        attrs: HashMap<String, String>,
        children: Vec<PartialFoldedHtml>,
    },
}

struct Folded {
    tag: String,
    attrs: HashMap<String, String>,
    inner: String,
}

impl From<Folded> for PartialFoldedHtml {
    fn from(folded: Folded) -> Self {
        PartialFoldedHtml::Folded {
            tag: folded.tag,
            attrs: folded.attrs,
            inner: folded.inner,
        }
    }
}

#[derive(Debug)]
pub enum AttrValue<'a> {
    Boxed(Box<str>),
    Static(&'static str),
    Borrowed(&'a str),
    Inlined(InlineStr),
    True,
}

impl<'a> From<CowStr<'a>> for AttrValue<'a> {
    fn from(value: CowStr<'a>) -> Self {
        match value {
            CowStr::Inlined(s) => AttrValue::Inlined(s),
            CowStr::Boxed(s) => AttrValue::Boxed(s),
            CowStr::Borrowed(s) => AttrValue::Borrowed(s),
        }
    }
}

impl<'a> From<String> for AttrValue<'a> {
    fn from(value: String) -> Self {
        AttrValue::Boxed(value.into_boxed_str())
    }
}

impl<'a> From<&'static str> for AttrValue<'a> {
    fn from(value: &'static str) -> Self {
        AttrValue::Static(value)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Placeholder error")]
    Placeholder,
}

#[derive(Debug)]
pub enum Tree<'a> {
    Element {
        tag: &'static str,
        children: Vec<Tree<'a>>,
        attrs: HashMap<&'static str, AttrValue<'a>>,
    },
    Text(CowStr<'a>),
    Raw(CowStr<'a>),
}

fn is_end(start: &Tag<'_>, end: &Event<'_>) -> bool {
    match (start, end) {
        (Tag::Paragraph, Event::End(TagEnd::Paragraph)) => true,
        (Tag::Heading { .. }, Event::End(TagEnd::Heading { .. })) => true,
        (Tag::BlockQuote(_), Event::End(TagEnd::BlockQuote(_))) => true,
        (Tag::CodeBlock(_), Event::End(TagEnd::CodeBlock)) => true,
        (Tag::HtmlBlock, Event::End(TagEnd::HtmlBlock)) => true,
        (Tag::List(_), Event::End(TagEnd::List(_))) => true,
        (Tag::Item, Event::End(TagEnd::Item)) => true,
        (Tag::FootnoteDefinition(_), Event::End(TagEnd::FootnoteDefinition)) => true,
        (Tag::Table(_), Event::End(TagEnd::Table)) => true,
        (Tag::TableHead, Event::End(TagEnd::TableHead)) => true,
        (Tag::TableRow, Event::End(TagEnd::TableRow)) => true,
        (Tag::TableCell, Event::End(TagEnd::TableCell)) => true,
        (Tag::Emphasis, Event::End(TagEnd::Emphasis)) => true,
        (Tag::Strong, Event::End(TagEnd::Strong)) => true,
        (Tag::Strikethrough, Event::End(TagEnd::Strikethrough)) => true,
        (Tag::Link { .. }, Event::End(TagEnd::Link { .. })) => true,
        (Tag::Image { .. }, Event::End(TagEnd::Image { .. })) => true,
        (Tag::MetadataBlock(_), Event::End(TagEnd::MetadataBlock(_))) => true,
        _ => false,
    }
}

struct WrappedParser<'a> {
    parser: Parser<'a>,
    front: Option<Event<'a>>,
}

impl<'a> WrappedParser<'a> {
    fn next(&mut self) -> Option<Event<'a>> {
        if let Some(event) = self.front.take() {
            Some(event)
        } else {
            self.parser.next()
        }
    }

    fn ret(&mut self, event: Event<'a>) {
        self.front = Some(event);
    }

    fn new(parser: Parser<'a>) -> Self {
        Self {
            parser,
            front: None,
        }
    }
}

fn fold_section<'a>(start_level: HeadingLevel, parser: &mut WrappedParser<'a>) -> Vec<Tree<'a>> {
    let mut children = Vec::new();
    loop {
        let Some(next) = parser.next() else {
            break;
        };
        if matches!(next, Event::Start(Tag::Heading { level, ..}) if start_level >= level) {
            parser.ret(next);
            break;
        } else {
            parser.ret(next);
            let Some(folded) = fold(parser) else {
                break;
            };
            children.push(folded);
        }
    }
    children
}

fn fold_spanned<'a>(start: Tag<'a>, parser: &mut WrappedParser<'a>) -> Tree<'a> {
    let mut children = Vec::new();
    loop {
        let next = parser.next().unwrap();
        if !is_end(&start, &next) {
            parser.ret(next);
            if let Some(child) = fold(parser) {
                children.push(child);
            }
        } else {
            break match start {
                Tag::Paragraph => Tree::Element {
                    tag: "p",
                    children,
                    attrs: hashmap! {},
                },
                Tag::Heading { level, id, .. } => {
                    let tag_name = match level {
                        pulldown_cmark::HeadingLevel::H1 => "h1",
                        pulldown_cmark::HeadingLevel::H2 => "h2",
                        pulldown_cmark::HeadingLevel::H3 => "h3",
                        pulldown_cmark::HeadingLevel::H4 => "h4",
                        pulldown_cmark::HeadingLevel::H5 => "h5",
                        pulldown_cmark::HeadingLevel::H6 => "h6",
                    };
                    let mut element_attrs = HashMap::default();
                    if let Some(id) = id {
                        element_attrs.insert("id", id.into());
                    }
                    let mut children = vec![Tree::Element {
                        tag: tag_name,
                        children,
                        attrs: element_attrs,
                    }];
                    children.append(&mut fold_section(level, parser));
                    Tree::Element {
                        tag: "section",
                        children,
                        attrs: Default::default(),
                    }
                }
                Tag::BlockQuote(_) => Tree::Element {
                    tag: "blockquote",
                    children,
                    attrs: hashmap! {},
                },
                Tag::CodeBlock(kind) => {
                    let mut code_attrs = hashmap! {};
                    if let pulldown_cmark::CodeBlockKind::Fenced(lang) = kind {
                        if !lang.is_empty() {
                            code_attrs.insert("class", format!("language-{}", lang).into());
                        }
                    }
                    Tree::Element {
                        tag: "pre",
                        children: vec![Tree::Element {
                            tag: "code",
                            children,
                            attrs: code_attrs,
                        }],
                        attrs: hashmap! {},
                    }
                }
                Tag::HtmlBlock => Tree::Element {
                    tag: "div",
                    children,
                    attrs: hashmap! {},
                },
                Tag::List(start) => {
                    let (tag_name, attrs) = if let Some(start_num) = start {
                        let mut attrs = hashmap! {};
                        if start_num != 1 {
                            attrs.insert("start", start_num.to_string().into());
                        }
                        ("ol", attrs)
                    } else {
                        ("ul", hashmap! {})
                    };
                    Tree::Element {
                        tag: tag_name,
                        children,
                        attrs,
                    }
                }
                Tag::Item => Tree::Element {
                    tag: "li",
                    children,
                    attrs: hashmap! {},
                },
                Tag::FootnoteDefinition(label) => Tree::Element {
                    tag: "div",
                    children,
                    attrs: hashmap! {
                        "class" => "footnote-definition".into(),
                        "id" => format!("footnote-{}", label).into(),
                    },
                },
                Tag::DefinitionList => Tree::Element {
                    tag: "dl",
                    children,
                    attrs: hashmap! {},
                },
                Tag::DefinitionListTitle => Tree::Element {
                    tag: "dt",
                    children,
                    attrs: hashmap! {},
                },
                Tag::DefinitionListDefinition => Tree::Element {
                    tag: "dd",
                    children,
                    attrs: hashmap! {},
                },
                Tag::Table(_) => Tree::Element {
                    tag: "table",
                    children,
                    attrs: hashmap! {},
                },
                Tag::TableHead => Tree::Element {
                    tag: "thead",
                    children,
                    attrs: hashmap! {},
                },
                Tag::TableRow => Tree::Element {
                    tag: "tr",
                    children,
                    attrs: hashmap! {},
                },
                Tag::TableCell => Tree::Element {
                    tag: "td",
                    children,
                    attrs: hashmap! {},
                },
                Tag::Emphasis => Tree::Element {
                    tag: "em",
                    children,
                    attrs: hashmap! {},
                },
                Tag::Strong => Tree::Element {
                    tag: "strong",
                    children,
                    attrs: hashmap! {},
                },
                Tag::Strikethrough => Tree::Element {
                    tag: "del",
                    children,
                    attrs: hashmap! {},
                },
                Tag::Superscript => Tree::Element {
                    tag: "sup",
                    children,
                    attrs: hashmap! {},
                },
                Tag::Subscript => Tree::Element {
                    tag: "sub",
                    children,
                    attrs: hashmap! {},
                },
                Tag::Link {
                    dest_url, title, ..
                } => {
                    let mut attrs = hashmap! {
                        "href" => dest_url.into(),
                    };
                    if !title.is_empty() {
                        attrs.insert("title", title.clone().into());
                    }
                    Tree::Element {
                        tag: "a",
                        children,
                        attrs,
                    }
                }
                Tag::Image {
                    dest_url, title, ..
                } => {
                    let mut attrs = hashmap! {
                        "src" => dest_url.into(),
                    };
                    if !title.is_empty() {
                        attrs.insert("title", title.clone().into());
                        attrs.insert("alt", title.into());
                    }
                    Tree::Element {
                        tag: "img",
                        children,
                        attrs,
                    }
                }
                Tag::MetadataBlock(_) => Tree::Element {
                    tag: "div",
                    children,
                    attrs: hashmap! {
                        "class" => "metadata".into(),
                    },
                },
            };
        }
    }
}

fn fold<'a>(parser: &mut WrappedParser<'a>) -> Option<Tree<'a>> {
    let head = parser.next()?;
    Some(match head {
        Event::Code(code) => Tree::Element {
            tag: "code",
            attrs: Default::default(),
            children: vec![Tree::Text(code)],
        },
        Event::Html(html) => Tree::Raw(html),
        Event::HardBreak => Tree::Element {
            tag: "br",
            attrs: Default::default(),
            children: vec![],
        },
        Event::SoftBreak => Tree::Element {
            tag: "br",
            attrs: Default::default(),
            children: vec![],
        },
        Event::Rule => Tree::Element {
            tag: "hr",
            attrs: Default::default(),
            children: vec![],
        },
        Event::TaskListMarker(mark) => {
            let mut attrs = hashmap! {
                "type" => "checkbox".into(),
                "disabled" => AttrValue::True,
            };
            if mark {
                attrs.insert("checked", AttrValue::True);
            }
            Tree::Element {
                tag: "input",
                attrs,
                children: vec![],
            }
        }
        Event::Text(cow_str) => Tree::Text(cow_str),
        Event::InlineMath(cow_str) => {
            let opts = katex::Opts::builder().display_mode(false).build().unwrap();
            match katex::render_with_opts(&cow_str, &opts) {
                Ok(math) => Tree::Raw(CowStr::Boxed(math.into_boxed_str())),
                Err(e) => {
                    warn!(
                        e = e.to_string(),
                        src = cow_str.as_ref(),
                        "failed to process math"
                    );
                    Tree::Element {
                        tag: "span",
                        children: vec![Tree::Text(cow_str)],
                        attrs: hashmap! { "class" => "math-error".into() },
                    }
                }
            }
        }
        Event::DisplayMath(cow_str) => {
            let opts = katex::Opts::builder().display_mode(true).build().unwrap();
            match katex::render_with_opts(&cow_str, &opts) {
                Ok(math) => Tree::Raw(CowStr::Boxed(math.into_boxed_str())),
                Err(e) => {
                    warn!(
                        e = e.to_string(),
                        src = cow_str.as_ref(),
                        "failed to process math"
                    );
                    Tree::Element {
                        tag: "span",
                        children: vec![Tree::Text(cow_str)],
                        attrs: hashmap! { "class" => "math-error".into() },
                    }
                }
            }
        }
        Event::InlineHtml(cow_str) => Tree::Raw(cow_str),
        Event::FootnoteReference(cow_str) => Tree::Element {
            tag: "sup",
            children: vec![Tree::Element {
                tag: "a",
                attrs: hashmap! {
                    "href" => format!("#footnode-{cow_str}").into(),
                    "id" => format!("#footnode-ref-{cow_str}").into(),
                    "aria-labelledby" => "footnote-label".into(),
                },
                children: vec![Tree::Text(cow_str)],
            }],
            attrs: hashmap! {"class" => "footnote-ref".into() },
        },
        Event::End(_) => return None,
        Event::Start(tag) => fold_spanned(tag, parser),
    })
}

pub fn compile<'a>(src: &'a str) -> Result<PartialFoldedHtml, Error> {
    let options = Options::all();
    let mut parser = WrappedParser::new(Parser::new_ext(src, options));
    let mut toplevels = Vec::new();
    loop {
        let Some(tree) = fold(&mut parser) else {
            break;
        };
        toplevels.push(tree);
    }
    dbg!(toplevels);
    unimplemented!()
}
