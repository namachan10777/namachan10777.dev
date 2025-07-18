use std::{
    collections::HashMap,
    fmt::Write,
    path::{Path, PathBuf},
};

use maplit::hashmap;
use pulldown_cmark::{CowStr, Event, HeadingLevel, InlineStr, Options, Parser, Tag, TagEnd};
use serde::{Deserialize, Serialize};
use tracing::warn;

fn serialize_cow_str<S>(value: &CowStr, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    match value {
        CowStr::Inlined(s) => serializer.serialize_str(s),
        CowStr::Boxed(s) => serializer.serialize_str(s),
        CowStr::Borrowed(s) => serializer.serialize_str(s),
    }
}

fn serialize_inline_str<S>(value: &InlineStr, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(value)
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Children<'a> {
    None,
    Html {
        #[serde(serialize_with = "serialize_cow_str")]
        inner: CowStr<'a>,
    },
    Partial {
        inner: Vec<PartialTree<'a>>,
    },
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Node {
    Codeblock { line: usize },
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum PartialTree<'a> {
    Html {
        tag: &'static str,
        attrs: HashMap<&'static str, AttrValue<'a>>,
        inner: Children<'a>,
    },
    Node {
        node: Node,
        inner: Children<'a>,
    },
}

impl<'a> PartialTree<'a> {
    fn is_partial(&self) -> bool {
        match self {
            PartialTree::Html {
                inner: Children::Html { .. },
                ..
            } => false,
            PartialTree::Html {
                inner: Children::None,
                ..
            } => false,
            PartialTree::Node { .. } => true,
            PartialTree::Html {
                inner: Children::Partial { .. },
                ..
            } => true,
        }
    }
}

#[derive(Debug, Serialize)]
pub enum AttrValue<'a> {
    Boxed(Box<str>),
    Static(&'static str),
    Borrowed(&'a str),
    Inlined(#[serde(serialize_with = "serialize_inline_str")] InlineStr),
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
    #[error("Invalid image path: {0}")]
    InvalidImagePath(PathBuf),
    #[error("Invalid markdown source path: {0}")]
    InvalidMarkdownSrcPath(PathBuf),
    #[error("Failed to read image: {0}")]
    ReadImage(std::io::Error),
    #[error("Failed to upload image")]
    UploadImage,
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

fn fold_section<'c, 'a>(
    ctx: &mut Context<'c>,
    start_level: HeadingLevel,
    parser: &mut WrappedParser<'a>,
) -> Result<Vec<PartialTree<'a>>, Error> {
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
            let Some(folded) = fold(ctx, parser)? else {
                break;
            };
            children.push(folded);
        }
    }
    Ok(children)
}

fn write_attrs(s: &mut String, attrs: &HashMap<&'static str, AttrValue<'_>>) {
    for (key, value) in attrs {
        match value {
            AttrValue::Boxed(v) => s.write_fmt(format_args!(r#"{key}="{v}""#)).unwrap(),
            AttrValue::Static(v) => s.write_fmt(format_args!(r#"{key}="{v}""#)).unwrap(),
            AttrValue::Borrowed(v) => s.write_fmt(format_args!(r#"{key}="{v}""#)).unwrap(),
            AttrValue::Inlined(v) => s.write_fmt(format_args!(r#"{key}="{v}""#)).unwrap(),
            AttrValue::True => s.write_str(*key).unwrap(),
        }
    }
}

fn partial_children<'a>(children: Vec<PartialTree<'a>>) -> Children<'a> {
    if children.is_empty() {
        Children::None
    } else if children.iter().all(|child| !child.is_partial()) {
        let mut html = String::new();
        for child in children {
            let PartialTree::Html { tag, attrs, inner } = child else {
                unreachable!();
            };
            html.write_fmt(format_args!("<{tag} ")).unwrap();
            write_attrs(&mut html, &attrs);
            match inner {
                Children::Html { inner } => {
                    html.write_fmt(format_args!(">{inner}</{tag}>")).unwrap()
                }
                Children::None => html.write_str("/>").unwrap(),
                _ => unreachable!(),
            }
        }
        Children::Html { inner: html.into() }
    } else {
        Children::Partial { inner: children }
    }
}

fn partial_eval<'a>(
    tag: &'static str,
    attrs: HashMap<&'static str, AttrValue<'a>>,
    children: Vec<PartialTree<'a>>,
) -> PartialTree<'a> {
    PartialTree::Html {
        tag,
        attrs,
        inner: partial_children(children),
    }
}

fn image_attrs<'a, 'c>(
    ctx: &mut Context<'c>,
    url: CowStr<'a>,
) -> Result<HashMap<&'static str, AttrValue<'a>>, Error> {
    if url.starts_with("https://") || url.starts_with("http://") || url.starts_with("data:") {
        return Ok(hashmap! {"src" => url.into()});
    }

    let img_path = Path::new(url.as_ref());
    let src_path = ctx
        .src_path
        .canonicalize()
        .map_err(|_| Error::InvalidMarkdownSrcPath(ctx.src_path.clone()))?;
    let src_parent_path = src_path
        .parent()
        .ok_or_else(|| Error::InvalidMarkdownSrcPath(ctx.src_path.clone()))?;
    let img_path = if img_path.is_absolute() {
        img_path.to_owned()
    } else {
        src_parent_path
            .join(img_path)
            .canonicalize()
            .map_err(|_| Error::InvalidImagePath(img_path.to_owned()))?
    };

    let rel_path = pathdiff::diff_paths(&img_path, &ctx.basedir)
        .ok_or_else(|| Error::InvalidImagePath(img_path.to_owned()))?
        .to_str()
        .ok_or_else(|| Error::InvalidImagePath(img_path.to_owned()))?
        .to_string();

    #[cfg(target_os = "windows")]
    let rel_path = rel_path.replace("\\", "/");

    let srcset = [600, 1200, 1800, 2400]
        .into_iter()
        .map(|width| {
            format!(
                "https://{}/cdn-cgi/image/fit=scale-down,width={width}/{}/{rel_path} {width}w",
                ctx.config.image.zone, ctx.config.image.prefix
            )
        })
        .collect::<Vec<_>>();
    let srcset = srcset.join(",");
    let src = format!(
        "https://{}/{}/{rel_path}",
        ctx.config.image.zone, ctx.config.image.prefix
    );

    ctx.upload_set.insert(img_path, rel_path);

    Ok(hashmap! {
        "srcset" => srcset.into(),
        "src" => src.into()
    })
}

fn fold_spanned<'c, 'a>(
    ctx: &mut Context<'c>,
    start: Tag<'a>,
    parser: &mut WrappedParser<'a>,
) -> Result<PartialTree<'a>, Error> {
    let mut children = Vec::new();
    loop {
        let next = parser.next().unwrap();
        if !is_end(&start, &next) {
            parser.ret(next);
            if let Some(child) = fold(ctx, parser)? {
                children.push(child);
            }
        } else {
            break Ok(match start {
                Tag::Paragraph => partial_eval("p", hashmap! {}, children),
                Tag::Heading { level, id, .. } => {
                    let tag_name = match level {
                        pulldown_cmark::HeadingLevel::H1 => "h1",
                        pulldown_cmark::HeadingLevel::H2 => "h2",
                        pulldown_cmark::HeadingLevel::H3 => "h3",
                        pulldown_cmark::HeadingLevel::H4 => "h4",
                        pulldown_cmark::HeadingLevel::H5 => "h5",
                        pulldown_cmark::HeadingLevel::H6 => "h6",
                    };
                    let mut attrs = HashMap::default();
                    if let Some(id) = id {
                        attrs.insert("id", id.into());
                    }
                    let mut children = vec![partial_eval(tag_name, attrs, children)];
                    children.append(&mut fold_section(ctx, level, parser)?);
                    partial_eval("section", hashmap! {}, children)
                }
                Tag::BlockQuote(_) => partial_eval("blockquote", hashmap! {}, children),
                Tag::CodeBlock(_) => PartialTree::Node {
                    node: Node::Codeblock { line: 0 },
                    inner: partial_children(children),
                },
                Tag::HtmlBlock => partial_eval("div", hashmap! {}, children),
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
                    partial_eval(tag_name, attrs, children)
                }
                Tag::Item => partial_eval("li", hashmap! {}, children),
                Tag::FootnoteDefinition(label) => partial_eval(
                    "div",
                    hashmap! {
                        "class" => "footnote-definition".into(),
                        "id" => format!("footnote-{}", label).into(),
                    },
                    children,
                ),
                Tag::DefinitionList => partial_eval("dl", hashmap! {}, children),
                Tag::DefinitionListTitle => partial_eval("dt", hashmap! {}, children),
                Tag::DefinitionListDefinition => partial_eval("dd", hashmap! {}, children),
                Tag::Table(_) => partial_eval("table", hashmap! {}, children),
                Tag::TableHead => partial_eval("thead", hashmap! {}, children),
                Tag::TableRow => partial_eval("tr", hashmap! {}, children),
                Tag::TableCell => partial_eval("td", hashmap! {}, children),
                Tag::Emphasis => partial_eval("em", hashmap! {}, children),
                Tag::Strong => partial_eval("strong", hashmap! {}, children),
                Tag::Strikethrough => partial_eval("del", hashmap! {}, children),
                Tag::Superscript => partial_eval("sup", hashmap! {}, children),
                Tag::Subscript => partial_eval("sub", hashmap! {}, children),
                Tag::Link {
                    dest_url, title, ..
                } => {
                    let mut attrs = hashmap! {
                        "href" => dest_url.into(),
                    };
                    if !title.is_empty() {
                        attrs.insert("title", title.clone().into());
                    }
                    partial_eval("a", attrs, children)
                }
                Tag::Image {
                    dest_url, title, ..
                } => {
                    let mut attrs = image_attrs(ctx, dest_url)?;
                    if !title.is_empty() {
                        attrs.insert("alt", title.into());
                    }

                    partial_eval(
                        "figure",
                        hashmap! {},
                        vec![
                            partial_eval("img", attrs, vec![]),
                            partial_eval("figcaption", hashmap! {}, children),
                        ],
                    )
                }
                Tag::MetadataBlock(_) => partial_eval(
                    "div",
                    hashmap! {
                        "class" => "metadata".into(),
                    },
                    children,
                ),
            });
        }
    }
}

fn fold<'c, 'a>(
    ctx: &mut Context<'c>,
    parser: &mut WrappedParser<'a>,
) -> Result<Option<PartialTree<'a>>, Error> {
    let Some(head) = parser.next() else {
        return Ok(None);
    };
    Ok(Some(match head {
        Event::Code(code) => partial_eval(
            "code",
            hashmap! {},
            vec![PartialTree::Html {
                tag: "span",
                attrs: hashmap! {},
                inner: Children::Html { inner: code },
            }],
        ),
        Event::Html(html) => PartialTree::Html {
            tag: "span",
            attrs: hashmap! {},
            inner: Children::Html { inner: html },
        },
        Event::HardBreak => partial_eval("br", hashmap! {}, vec![]),
        Event::SoftBreak => partial_eval("br", hashmap! {}, vec![]),
        Event::Rule => partial_eval("hr", hashmap! {}, vec![]),
        Event::TaskListMarker(mark) => {
            let mut attrs = hashmap! {
                "type" => "checkbox".into(),
                "disabled" => AttrValue::True,
            };
            if mark {
                attrs.insert("checked", AttrValue::True);
            }
            partial_eval("input", attrs, vec![])
        }
        Event::Text(text) => PartialTree::Html {
            tag: "span",
            attrs: hashmap! {},
            inner: Children::Html { inner: text },
        },
        Event::InlineMath(src) => {
            let opts = katex::Opts::builder().display_mode(false).build().unwrap();
            match katex::render_with_opts(&src, &opts) {
                Ok(math) => PartialTree::Html {
                    tag: "span",
                    attrs: hashmap! {},
                    inner: Children::Html { inner: math.into() },
                },
                Err(e) => {
                    warn!(
                        e = e.to_string(),
                        src = src.as_ref(),
                        "failed to process math"
                    );
                    partial_eval(
                        "span",
                        hashmap! { "class" => "math-error".into() },
                        vec![PartialTree::Html {
                            tag: "span",
                            attrs: hashmap! {},
                            inner: Children::Html { inner: src },
                        }],
                    )
                }
            }
        }
        Event::DisplayMath(src) => {
            let opts = katex::Opts::builder().display_mode(true).build().unwrap();
            match katex::render_with_opts(&src, &opts) {
                Ok(math) => PartialTree::Html {
                    tag: "div",
                    attrs: hashmap! {},
                    inner: Children::Html { inner: math.into() },
                },
                Err(e) => {
                    warn!(
                        e = e.to_string(),
                        src = src.as_ref(),
                        "failed to process math"
                    );
                    partial_eval(
                        "div",
                        hashmap! { "class" => "math-error".into() },
                        vec![PartialTree::Html {
                            tag: "span",
                            attrs: hashmap! {},
                            inner: Children::Html { inner: src },
                        }],
                    )
                }
            }
        }
        Event::InlineHtml(cow_str) => PartialTree::Html {
            tag: "span",
            attrs: hashmap! {},
            inner: Children::Html { inner: cow_str },
        },
        Event::FootnoteReference(reference) => partial_eval(
            "sup",
            hashmap! {"class" => "footnote-ref".into()},
            vec![partial_eval(
                "a",
                hashmap! {
                    "href" => format!("#footnode-{reference}").into(),
                    "id" => format!("#footnode-ref-{reference}").into(),
                    "aria-labelledby" => "footnote-label".into(),
                },
                vec![PartialTree::Html {
                    tag: "span",
                    attrs: hashmap! {},
                    inner: Children::Html { inner: reference },
                }],
            )],
        ),
        Event::Start(tag) => fold_spanned(ctx, tag, parser)?,
        Event::End(_) => unreachable!(),
    }))
}

fn minify_tree<'a>(tree: PartialTree<'a>) -> PartialTree<'a> {
    match tree {
        PartialTree::Html {
            inner: Children::None,
            ..
        }
        | PartialTree::Node {
            inner: Children::None,
            ..
        } => tree,
        PartialTree::Html {
            tag,
            attrs,
            inner: Children::Html { inner: html },
        } => PartialTree::Html {
            tag,
            attrs,
            inner: Children::Html {
                inner: String::from_utf8(minify_html::minify(
                    html.as_bytes(),
                    &minify_html::Cfg::new(),
                ))
                .unwrap()
                .into(),
            },
        },
        PartialTree::Node {
            node,
            inner: Children::Html { inner: html },
        } => PartialTree::Node {
            node,
            inner: Children::Html {
                inner: String::from_utf8(minify_html::minify(
                    html.as_bytes(),
                    &minify_html::Cfg::new(),
                ))
                .unwrap()
                .into(),
            },
        },
        PartialTree::Html {
            tag,
            attrs,
            inner: Children::Partial { inner: children },
        } => PartialTree::Html {
            tag,
            attrs,
            inner: Children::Partial {
                inner: children.into_iter().map(minify_tree).collect(),
            },
        },
        PartialTree::Node {
            node,
            inner: Children::Partial { inner: children },
        } => PartialTree::Node {
            node,
            inner: Children::Partial {
                inner: children.into_iter().map(minify_tree).collect(),
            },
        },
    }
}

#[derive(Serialize, Deserialize)]
pub struct ImageConfig {
    pub zone: String,
    pub prefix: String,
    pub bucket: String,
}

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub image: ImageConfig,
}

pub struct Context<'c> {
    pub config: &'c Config,
    pub src_path: PathBuf,
    pub basedir: PathBuf,
    upload_set: HashMap<PathBuf, String>,
}

fn compile<'c, 'a>(ctx: &mut Context<'c>, src: &'a str) -> Result<PartialTree<'a>, Error> {
    let options = Options::all();
    let mut parser = WrappedParser::new(Parser::new_ext(src, options));
    let mut toplevels = Vec::new();
    loop {
        let Some(tree) = fold(ctx, &mut parser)? else {
            break;
        };
        toplevels.push(tree);
    }
    let tree = partial_eval("root", hashmap! {}, toplevels);
    Ok(minify_tree(tree))
}

pub async fn process<'c, 'a>(
    config: &'c Config,
    src_path: PathBuf,
    basedir: PathBuf,
    s3: &aws_sdk_s3::Client,
    src: &'a str,
) -> Result<PartialTree<'a>, Error> {
    let mut ctx = Context {
        config: &config,
        src_path,
        basedir,
        upload_set: HashMap::new(),
    };
    let compiled = compile(&mut ctx, src)?;

    dbg!(&ctx.upload_set);

    for (path, key) in ctx.upload_set {
        let file = tokio::fs::read(&path).await.map_err(Error::ReadImage)?;
        s3.put_object()
            .bucket(&config.image.bucket)
            .key(key)
            .body(file.into())
            .send()
            .await
            .map_err(|_| Error::UploadImage)?;
    }

    Ok(compiled)
}
