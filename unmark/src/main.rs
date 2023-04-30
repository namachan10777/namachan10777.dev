use std::{
    collections::HashMap,
    io::Write,
    path::{Path, PathBuf},
    sync::Arc,
};

use anyhow::anyhow;
use axohtml::{dom::DOMTree, html, text};
use comrak::Arena;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use tokio::{fs, sync::RwLock};
use unmark::{
    dev_server::{DirectoryLayer, Event, EventType, Processor},
    util::get_h1_inner_text,
};

#[derive(clap::Parser)]
enum SubCommand {
    Serve { config: PathBuf },
}

#[derive(clap::Parser)]
struct Opts {
    #[clap(subcommand)]
    subcmd: SubCommand,
}

#[derive(Clone, Default)]
struct Context {
    blogs: Arc<RwLock<HashMap<PathBuf, String>>>,
    diaries: Arc<RwLock<HashMap<PathBuf, String>>>,
    categories: Arc<RwLock<HashMap<String, HashMap<PathBuf, String>>>>,
}

struct DiaryProc;
struct BlogProc;
struct IndexProc;
struct DiaryIndexProc;
struct BlogIndexProc;

static DIARY_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"/diary/(.+)\.md"#).unwrap());

fn is_blog_md<P: AsRef<Path>>(path: P) -> bool {
    path.as_ref().parent() == Some(PathBuf::from("/blog").as_ref())
        && path.as_ref().extension().and_then(|s| s.to_str()) == Some("md")
}

fn diary_basename<P: AsRef<Path>>(path: P) -> Option<String> {
    let path = path.as_ref().to_str()?;
    DIARY_RE
        .captures_iter(path)
        .next()
        .and_then(|s| s.get(1))
        .map(|m| m.as_str().to_owned())
}

fn get_src<T>(event: &Event<T>) -> anyhow::Result<Option<&str>> {
    let unmark::dev_server::EventType::FileInserted { content, .. } = &event.event_type else {
        return Ok(None)
    };
    let content = std::str::from_utf8(content)?;
    Ok(Some(content))
}

#[derive(Deserialize, Debug)]
struct BlogMetadata {
    category: Vec<String>,
}
#[derive(Deserialize, Debug)]
struct DiaryMetadata {}
#[derive(Deserialize, Debug)]
struct IndexMetadata {}

#[async_trait::async_trait]
impl<T: 'static + Send + Sync> Processor<T> for BlogProc {
    type Error = anyhow::Error;
    type Context = Context;
    async fn process(
        &self,
        _ctx: &Self::Context,
        event: Event<T>,
    ) -> Result<Vec<Event<T>>, Self::Error> {
        if event.tag != "builtin:util:file_load".into() || !is_blog_md(&event.out_path) {
            return Ok(Vec::new());
        }
        if let EventType::Removed = &event.event_type {
            return Ok(vec![Event {
                tag: "blog".into(),
                out_path: event.out_path.with_extension("html"),
                ..event
            }]);
        }
        let Some(src) = get_src(&event)? else {
            return Ok(Vec::new());
        };
        let arena = Arena::new();
        let (_, md) = unmark::parser::parse::<BlogMetadata>(&arena, src)?;
        let body = unmark::transpiler::document(Default::default(), md)?;
        let title =
            unmark::util::get_h1_inner_text(md).ok_or_else(|| anyhow::anyhow!("no title found"))?;
        {}
        let dom: DOMTree<String> = html!(
            <html>
                <head>
                    <title>{text!(title)}</title>
                    <link rel="stylesheet" href="/styles/index.css" />
                </head>
                <body>
                    <script type="application/javascript" src="/scripts/main.js"></script>
                    {body}
                </body>
            </html>
        );
        let mut content = Vec::new();
        write!(content, "<!DOCTYPE>{dom}")?;
        Ok(vec![Event {
            tag: "blog".into(),
            out_path: event.out_path.with_extension("html"),
            event_type: EventType::FileInserted {
                mime: mime::TEXT_HTML_UTF_8,
                content: Arc::new(content),
                visibility: unmark::dev_server::Visibility::Published,
            },
            ..event
        }])
    }
}

#[async_trait::async_trait]
impl<T: 'static + Send + Sync> Processor<T> for DiaryProc {
    type Error = anyhow::Error;
    type Context = Context;
    async fn process(
        &self,
        _ctx: &Self::Context,
        event: Event<T>,
    ) -> Result<Vec<Event<T>>, Self::Error> {
        if event.tag != "builtin:util:file_load".into() {
            return Ok(Vec::new());
        }
        let Some(basename) = diary_basename(&event.out_path) else {
            return Ok(Vec::new());
        };
        if let EventType::Removed = &event.event_type {
            return Ok(vec![Event {
                tag: "diary".into(),
                out_path: event.out_path.with_extension("html"),
                ..event
            }]);
        }
        let Some(src) = get_src(&event)? else {
            return Ok(Vec::new());
        };
        let arena = Arena::new();
        let (_, md) = unmark::parser::parse::<DiaryMetadata>(&arena, src)?;
        let body = unmark::transpiler::document(Default::default(), md)?;
        let dom: DOMTree<String> = html!(
            <html>
            <head>
                <title>{text!(basename)}</title>
                <link rel="stylesheet" href="/styles/index.css" />
                </head>
                <body>
                <script type="application/javascript" src="/scripts/main.js"></script>
                {body}
                </body>
            </html>
        );
        let mut content = Vec::new();
        write!(content, "<!DOCTYPE>{dom}")?;
        Ok(vec![Event {
            tag: "diary".into(),
            out_path: event.out_path.with_extension("html"),
            event_type: EventType::FileInserted {
                mime: mime::TEXT_HTML_UTF_8,
                content: Arc::new(content),
                visibility: unmark::dev_server::Visibility::Published,
            },
            ..event
        }])
    }
}

#[async_trait::async_trait]
impl<T: 'static + Send + Sync> Processor<T> for IndexProc {
    type Error = anyhow::Error;
    type Context = Context;
    async fn process(
        &self,
        _ctx: &Self::Context,
        event: Event<T>,
    ) -> Result<Vec<Event<T>>, Self::Error> {
        if event.tag != "builtin:util:file_load".into()
            || event.out_path != PathBuf::from("/index.md")
        {
            return Ok(Vec::new());
        }
        if let EventType::Removed = &event.event_type {
            return Ok(vec![Event {
                tag: "index".into(),
                out_path: event.out_path.with_extension("html"),
                ..event
            }]);
        }
        let Some(src) = get_src(&event)? else {
            return Ok(Vec::new());
        };
        let arena = Arena::new();
        let (_, md) = unmark::parser::parse::<IndexMetadata>(&arena, src)?;
        let body = unmark::transpiler::document(Default::default(), md)?;
        let dom: DOMTree<String> = html!(
            <html>
            <head>
                <title>"namachan10777"</title>
                <link rel="stylesheet" href="/styles/index.css" />
                </head>
                <body>
                <script type="application/javascript" src="/scripts/main.js"></script>
                {body}
                </body>
            </html>
        );
        let mut content = Vec::new();
        write!(content, "<!DOCTYPE>{dom}")?;
        Ok(vec![Event {
            tag: "diary".into(),
            out_path: event.out_path.with_extension("html"),
            event_type: EventType::FileInserted {
                mime: mime::TEXT_HTML_UTF_8,
                content: Arc::new(content),
                visibility: unmark::dev_server::Visibility::Published,
            },
            ..event
        }])
    }
}

#[async_trait::async_trait]
impl<T: 'static + Send + Sync> Processor<T> for DiaryIndexProc {
    type Error = anyhow::Error;
    type Context = Context;
    async fn process(
        &self,
        ctx: &Self::Context,
        event: Event<T>,
    ) -> Result<Vec<Event<T>>, Self::Error> {
        if event.tag != "builtin:util:file_load".into() {
            return Ok(Vec::new());
        }
        let Some(basename) = diary_basename(&event.out_path) else {
            return Ok(Vec::new())
        };
        if let EventType::Removed = &event.event_type {
            ctx.blogs
                .write()
                .await
                .remove(&event.out_path.with_extension("html"));
        }
        let mut diaries = ctx.diaries.write().await;
        diaries.insert(event.out_path.with_extension("html"), basename);
        let dom: DOMTree<String> = html!(
            <html>
            <head>
                <title>"blog"</title>
                <link rel="stylesheet" href="/styles/index.css" />
                </head>
                <body>
                <script type="application/javascript" src="/scripts/main.js"></script>
                <ul>
                {
                    diaries
                        .iter()
                        .map(|(path, title)| Ok(html!(<li><a href=(path.to_str().ok_or_else(|| anyhow::anyhow!("non utf-8 path"))?)>{text!(title)}</a></li>)))
                        .collect::<Result<Vec<_>, anyhow::Error>>().unwrap()
                }
                </ul>
                </body>
            </html>
        );
        let mut content = Vec::new();
        write!(content, "<!DOCTYPE>{dom}")?;
        Ok(vec![Event {
            tag: "blog-index".into(),
            out_path: PathBuf::from("/diary.html"),
            event_type: EventType::FileInserted {
                mime: mime::TEXT_HTML_UTF_8,
                content: Arc::new(content),
                visibility: unmark::dev_server::Visibility::Published,
            },
            ..event
        }])
    }
}

async fn gen_categories<T>(ctx: &Context) -> anyhow::Result<Event<T>> {
    let categies = ctx.categories.read().await;
    let dom: DOMTree<String> = html!(
        <html>
        <head>
            <title>"category"</title>
            <link rel="stylesheet" href="/styles/index.css" />
            </head>
            <body>
            <script type="application/javascript" src="/scripts/main.js"></script>
            <h1>"category"</h1>
            <ul>
            {
                categies.iter().map(|(category, articles)| {
                    Ok::<_, anyhow::Error>(html!(
                        <li>
                            <section>
                                <header><h2 class="heading">{text!(category)}</h2></header>
                                <ul>
                                    {
                                        articles.iter().map(|(path, title)| {
                                            Ok(html!(<li><a href=(path.to_str().ok_or_else(|| anyhow!("non utf-8 path"))?)>{text!(title)}</a></li>))
                                        }).collect::<anyhow::Result<Vec<_>>>()?
                                    }
                                </ul>
                            </section>
                        </li>
                    ))
                }).collect::<Result<Vec<_>, _>>()?
            }
            </ul>
            </body>
        </html>
    );
    let mut content = Vec::new();
    write!(content, "<!DOCTYPE>{dom}")?;
    Ok(Event {
        tag: "category-index".into(),
        out_path: PathBuf::from("/category.html"),
        event_type: EventType::FileInserted {
            mime: mime::TEXT_HTML_UTF_8,
            content: Arc::new(content),
            visibility: unmark::dev_server::Visibility::Published,
        },
        src_path: PathBuf::from("/category.html"),
    })
}

async fn gen_category_pages<T>(ctx: &Context) -> anyhow::Result<Vec<Event<T>>> {
    let categories = ctx.categories.read().await;
    categories
        .iter()
        .map(|(category, articles)| {
            let dom: DOMTree<String> = html!(
                <html>
                    <head>
                        <title>"blog"</title>
                        <link rel="stylesheet" href="/styles/index.css" />
                    </head>
                    <body>
                        <script type="application/javascript" src="/scripts/main.js"></script>
                        <h1>{text!(format!("category/{category}"))}</h1>
                        <ul>
                            {
                                articles.iter().map(|(path, title)| {
                                    Ok::<_, anyhow::Error>(html!(<li><a href=(path.to_str().ok_or_else(|| anyhow!("non utf-8 path"))?)>{text!(title)}</a></li>))
                                })
                                .collect::<Result<Vec<_>, _>>()?
                            }
                        </ul>
                    </body>
                </html>
            );
            let mut content = Vec::new();
            write!(content, "<!DOCTYPE>{dom}")?;
            Ok(Event {
                tag: "category".into(),
                out_path: PathBuf::from("/category/")
                    .join(category)
                    .with_extension("html"),
                event_type: EventType::FileInserted {
                    mime: mime::TEXT_HTML_UTF_8,
                    content: Arc::new(content),
                    visibility: unmark::dev_server::Visibility::Published,
                },
                src_path: PathBuf::from("/category/")
                    .join(category)
                    .with_extension("html"),
            })
        })
        .collect::<Result<Vec<_>, _>>()
}

#[async_trait::async_trait]
impl<T: 'static + Send + Sync> Processor<T> for BlogIndexProc {
    type Error = anyhow::Error;
    type Context = Context;
    async fn process(
        &self,
        ctx: &Self::Context,
        event: Event<T>,
    ) -> Result<Vec<Event<T>>, Self::Error> {
        if event.tag != "builtin:util:file_load".into() || !is_blog_md(&event.out_path) {
            return Ok(Vec::new());
        }
        let mut categories = ctx.categories.write().await;
        let mut blogs = ctx.blogs.write().await;
        if let EventType::Removed = &event.event_type {
            blogs.remove(&event.out_path.with_extension("html"));
            categories.values_mut().for_each(|category| {
                category.remove(&event.out_path.with_extension("html"));
            });
        }
        let Some(src) = get_src(&event)? else {
            return Ok(Vec::new());
        };
        let blog = {
            let arena = Arena::new();
            let (meta, md) = unmark::parser::parse::<BlogMetadata>(&arena, src)?;
            let title = get_h1_inner_text(md).ok_or_else(|| anyhow::anyhow!("no title found"))?;
            for category in meta.category {
                categories
                    .entry(category)
                    .or_default()
                    .insert(event.out_path.with_extension("html"), title.clone());
            }
            blogs.insert(event.out_path.with_extension("html"), title);
            let dom: DOMTree<String> = html!(
                <html>
                <head>
                    <title>"blog"</title>
                    <link rel="stylesheet" href="/styles/index.css" />
                    </head>
                    <body>
                    <script type="application/javascript" src="/scripts/main.js"></script>
                    <ul>
                    {
                        blogs
                            .iter()
                            .map(|(path, title)| Ok(html!(<li><a href=(path.to_str().ok_or_else(|| anyhow::anyhow!("non utf-8 path"))?)>{text!(title)}</a></li>)))
                            .collect::<Result<Vec<_>, anyhow::Error>>().unwrap()
                    }
                    </ul>
                    </body>
                </html>
            );
            let mut content = Vec::new();
            write!(content, "<!DOCTYPE>{dom}")?;
            Event {
                tag: "blog-index".into(),
                out_path: PathBuf::from("/blog.html"),
                event_type: EventType::FileInserted {
                    mime: mime::TEXT_HTML_UTF_8,
                    content: Arc::new(content),
                    visibility: unmark::dev_server::Visibility::Published,
                },
                ..event
            }
        };
        drop(categories);
        drop(blogs);
        let mut pages = gen_category_pages(ctx).await?;
        pages.push(gen_categories(ctx).await?);
        pages.push(blog);
        Ok(pages)
    }
}

#[derive(Deserialize, Serialize)]
struct Config {
    articles: PathBuf,
    stylesheets: PathBuf,
    scripts: PathBuf,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    use clap::Parser;
    use tracing_subscriber::{fmt, prelude::*, EnvFilter};
    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(fmt::layer())
        .init();

    let opts = Opts::parse();

    match opts.subcmd {
        SubCommand::Serve { config } => {
            let config = fs::read_to_string(config).await?;
            let config: Config = ron::from_str(&config)?;
            let layers = vec![
                DirectoryLayer {
                    src: config.articles,
                    dist: "/".into(),
                    filter: unmark::dev_server::Filter {
                        pass: Some(Regex::new(r#".+.md"#)?),
                        ignore: None,
                    },
                },
                DirectoryLayer {
                    src: config.stylesheets,
                    dist: "/styles/".into(),
                    filter: unmark::dev_server::Filter {
                        pass: Some(Regex::new(r#".+.css"#)?),
                        ignore: None,
                    },
                },
                DirectoryLayer {
                    src: config.scripts,
                    dist: "/scripts/".into(),
                    filter: unmark::dev_server::Filter {
                        pass: Some(Regex::new(r#".+\.js(\.map)?"#)?),
                        ignore: None,
                    },
                },
            ];
            let processors: Vec<
                Box<
                    dyn Processor<(), Context = Context, Error = anyhow::Error>
                        + Send
                        + Sync
                        + 'static,
                >,
            > = vec![
                Box::new(DiaryProc),
                Box::new(BlogProc),
                Box::new(IndexProc),
                Box::new(DiaryIndexProc),
                Box::new(BlogIndexProc),
                Box::<unmark::dev_server::util::Log<Context, anyhow::Error>>::default(),
                Box::new(unmark::dev_server::util::FileLoad::new(
                    unmark::dev_server::Visibility::Published,
                    unmark::dev_server::Filter {
                        pass: Some(Regex::new(r#".+\.(js|js\.map|css)"#)?),
                        ignore: None,
                    },
                )),
                Box::new(unmark::dev_server::util::FileLoad::new(
                    unmark::dev_server::Visibility::Intermediate,
                    unmark::dev_server::Filter {
                        pass: Some(Regex::new(r#".+\.md"#)?),
                        ignore: None,
                    },
                )),
            ];
            unmark::dev_server::watch_files::<_, _, Context, anyhow::Error, ()>(
                Default::default(),
                Context::default(),
                layers,
                processors,
                "127.0.0.1:3000".parse().unwrap(),
            )
            .await?;
        }
    }
    Ok(())
}
