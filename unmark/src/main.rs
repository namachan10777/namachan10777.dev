use anyhow::anyhow;
use axohtml::{dom::DOMTree, html, text};
use axum::{extract::FromRequestParts, http::StatusCode};
use chrono::NaiveDate;
use clap::Parser;

use comrak::Arena;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, net::SocketAddr, path::PathBuf, sync::Arc};
use tokio::{fs, sync::RwLock};
use tracing::{info, trace};
use tracing_subscriber::{fmt, EnvFilter};
use unmark::dev_server::{
    self, DirectoryLayer, FileProcessor, Filter, ProcessorEventType, ProcessorOut, Visibility,
};

#[derive(Parser)]
struct Opts {
    #[clap(short, long, required_unless_present = "example")]
    config: Option<PathBuf>,
    #[clap(
        short,
        long,
        value_name = "ADDR",
        help = "An IP socket addr e.g. 127.0.0.1:3000"
    )]
    serve: Option<SocketAddr>,
    #[clap(short, long)]
    example: bool,
}

mod frontmatter {
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    pub struct Article {
        title: String,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Config {
    syntect_theme: String,
    root: PathBuf,
    out: PathBuf,
    script_root: PathBuf,
    style_root: PathBuf,
}

impl Config {
    fn example() -> Self {
        Config {
            syntect_theme: "InspiredGitHub".to_owned(),
            root: PathBuf::from("index.md"),
            out: PathBuf::from("out"),
            script_root: PathBuf::from("scripts/dist"),
            style_root: PathBuf::from("styles"),
        }
    }
}

struct AnyPath(String);

#[async_trait::async_trait]
impl<S> FromRequestParts<S> for AnyPath {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        Ok(Self(parts.uri.path().to_owned()))
    }
}

#[derive(Deserialize)]
struct BlogMetadata {
    #[allow(dead_code)]
    name: String,
    #[allow(dead_code)]
    category: Vec<String>,
}

#[derive(Deserialize)]
struct DiaryMetadata {}

fn get_md_basename<'b>(prefix: &str, path: &'b str) -> Option<&'b str> {
    let basename = path.strip_suffix(".md")?;
    let basename = basename.strip_prefix(prefix)?;
    Some(basename)
}

struct Context {
    blog_metadata: RwLock<HashMap<String, (String, BlogMetadata)>>,
    diary_metadata: RwLock<HashMap<String, DiaryMetadata>>,
}

struct BlogProcessor;
#[async_trait::async_trait]
impl FileProcessor for BlogProcessor {
    type Context = Context;
    type Error = anyhow::Error;

    async fn process(
        &self,
        _ctx: &Self::Context,
        event: ProcessorOut,
    ) -> Result<Vec<ProcessorOut>, Self::Error> {
        trace!(path = event.path, "blog");
        let Some(basename) = get_md_basename("/blog/", &event.path) else {
            return Ok(Vec::new())
        };
        if let ProcessorOut {
            event: ProcessorEventType::Removed,
            ..
        } = &event
        {
            return Ok(vec![ProcessorOut {
                tag: "transpiler:diary".into(),
                event: ProcessorEventType::Removed,
                path: event.path.clone(),
                real_path: event.real_path.clone(),
            }]);
        }
        let ProcessorOut { event: ProcessorEventType::Inserted(_mime, src, _), ..} = &event else {
            return Ok(Vec::new())
        };
        let src = std::str::from_utf8(src)?;
        let arena = Arena::new();
        let (_meta, md): (BlogMetadata, _) = unmark::parser::parse(&arena, src)?;
        let title_text =
            unmark::util::get_h1_inner_text(md).ok_or_else(|| anyhow!("no title text"))?;
        let ctx = unmark::transpiler::Context::default();
        let body = unmark::transpiler::document(ctx, md)?;
        let dom = html!(
            <html>
            <head>
                <title>{text!(title_text)}</title>
                <meta name="viewport" content="width=device-width" />
                <link rel="stylesheet" href="/styles/index.css"/>
                </head>
                <body>
                {body}
                <script type="text/javascript" src="/scripts/main.js"></script>
                </body>
            </html>
        );
        let text = format!("<!DOCTYPE html>\n{dom}");
        Ok(vec![ProcessorOut {
            tag: "transpiler:blog".into(),
            event: ProcessorEventType::Inserted(
                mime::TEXT_HTML_UTF_8,
                text.as_bytes().to_vec(),
                Visibility::Published,
            ),
            path: format!("/blog/{basename}.html"),
            real_path: event.real_path.clone(),
        }])
    }
}

struct BlogIndexProcessor;

#[async_trait::async_trait]
impl FileProcessor for BlogIndexProcessor {
    type Error = anyhow::Error;
    type Context = Context;

    async fn process(
        &self,
        ctx: &Self::Context,
        event: ProcessorOut,
    ) -> anyhow::Result<Vec<ProcessorOut>> {
        let Some(basename) = get_md_basename("/blog/", &event.path) else {
            return Ok(Vec::new())
        };
        if event.tag != "builtin-util:file_read".into() {
            return Ok(Vec::new());
        }
        dbg!(basename);
        if let ProcessorOut {
            event: ProcessorEventType::Removed,
            ..
        } = &event
        {
            ctx.blog_metadata.write().await.remove(basename);
        } else if let ProcessorOut {
            event: ProcessorEventType::Inserted(_, src, _),
            ..
        } = &event
        {
            let src = std::str::from_utf8(src)?;
            let metadata = {
                let arena = Arena::new();
                let (meta, md) = unmark::parser::parse::<BlogMetadata>(&arena, src)?;
                let title_text = unmark::util::get_h1_inner_text(md)
                    .ok_or_else(|| anyhow::anyhow!("no title"))?;
                (title_text, meta)
            };
            ctx.blog_metadata
                .write()
                .await
                .insert(basename.to_owned(), metadata);
        }
        let metadata = ctx.blog_metadata.read().await;
        let dom: DOMTree<String> = html!(
            <html>
            <head>
                <title>{text!(basename)}</title>
                <meta name="viewport" content="width=device-width" />
                <link rel="stylesheet" href="/styles/index.css"/>
                </head>
                <body>
                <ul>
                {
                    metadata.iter().map(|(date, (title, _))|
                        html!(<li><a href=(format!("/blog/{date}.html")) title=date>{text!(title)}</a></li>)
                    )
                }
                </ul>
                <script type="text/javascript" src="/scripts/main.js"></script>
                </body>
            </html>
        );
        let content = format!("<!DOCTYPE html>\n{dom}");
        Ok(vec![ProcessorOut {
            tag: "transpile:diary".into(),
            event: ProcessorEventType::Inserted(
                mime::TEXT_HTML_UTF_8,
                content.as_bytes().to_vec(),
                Visibility::Published,
            ),
            path: "/blog.html".to_owned(),
            real_path: event.real_path.clone(),
        }])
    }
}

struct DiaryIndexProcessor;

#[async_trait::async_trait]
impl FileProcessor for DiaryIndexProcessor {
    type Error = anyhow::Error;
    type Context = Context;

    async fn process(
        &self,
        ctx: &Self::Context,
        event: ProcessorOut,
    ) -> anyhow::Result<Vec<ProcessorOut>> {
        let Some(basename) = get_md_basename("/diary/", &event.path) else {
            return Ok(Vec::new())
        };
        if event.tag != "builtin-util:file_read".into() {
            return Ok(Vec::new());
        }
        dbg!(basename);
        if let ProcessorOut {
            event: ProcessorEventType::Removed,
            ..
        } = &event
        {
            ctx.diary_metadata.write().await.remove(basename);
        } else if let ProcessorOut {
            event: ProcessorEventType::Inserted(_, src, _),
            ..
        } = &event
        {
            let src = std::str::from_utf8(src)?;
            let metadata = {
                let arena = Arena::new();
                unmark::parser::parse::<DiaryMetadata>(&arena, src)?.0
            };
            ctx.diary_metadata
                .write()
                .await
                .insert(basename.to_owned(), metadata);
        }
        let metadata = ctx.diary_metadata.read().await;
        let dom: DOMTree<String> = html!(
            <html>
            <head>
                <title>{text!(basename)}</title>
                <meta name="viewport" content="width=device-width" />
                <link rel="stylesheet" href="/styles/index.css"/>
                </head>
                <body>
                    <ul>
                        {
                            metadata.iter().map(|(date, _)|
                                html!(<li><a href=(format!("/diary/{date}.html")) title=date>{text!(date)}</a></li>)
                            )
                        }
                    </ul>
                <script type="text/javascript" src="/scripts/main.js"></script>
                </body>
            </html>
        );
        let content = format!("<!DOCTYPE html>\n{dom}");
        Ok(vec![ProcessorOut {
            tag: "transpile:diary".into(),
            event: ProcessorEventType::Inserted(
                mime::TEXT_HTML_UTF_8,
                content.as_bytes().to_vec(),
                Visibility::Published,
            ),
            path: "/diary.html".to_owned(),
            real_path: event.real_path.clone(),
        }])
    }
}

struct DiaryProcessor;

#[async_trait::async_trait]
impl FileProcessor for DiaryProcessor {
    type Error = anyhow::Error;
    type Context = Context;
    async fn process(
        &self,
        _ctx: &Self::Context,
        event: ProcessorOut,
    ) -> anyhow::Result<Vec<ProcessorOut>> {
        trace!(path = event.path, "diary");
        let Some(basename) = get_md_basename("/diary/", &event.path) else {
            return Ok(Vec::new())
        };
        if let ProcessorOut {
            event: ProcessorEventType::Removed,
            ..
        } = &event
        {
            return Ok(vec![ProcessorOut {
                tag: "transpiler:diary".into(),
                event: ProcessorEventType::Removed,
                path: event.path.clone(),
                real_path: event.real_path.clone(),
            }]);
        }
        let ProcessorOut { real_path, event: ProcessorEventType::Inserted(_mime, src, _), ..} = &event else {
            return Ok(Vec::new())
        };
        let arena = Arena::new();
        let src = std::str::from_utf8(src)?;
        let (_meta, md): (DiaryMetadata, _) = unmark::parser::parse(&arena, src)?;
        let ctx = unmark::transpiler::Context::default();
        let body = unmark::transpiler::document(ctx, md)?;
        let _date = NaiveDate::parse_from_str(basename, "%Y-%m-%d")?;
        let dom = html!(
            <html>
            <head>
                <title>{text!(basename)}</title>
                <meta name="viewport" content="width=device-width" />
                <link rel="stylesheet" href="/styles/index.css"/>
                </head>
                <body>
                {body}
                <script type="text/javascript" src="/scripts/main.js"></script>
                </body>
            </html>
        );
        let content = format!("<!DOCTYPE html>\n{dom}");
        Ok(vec![ProcessorOut {
            tag: "transpile:diary".into(),
            event: ProcessorEventType::Inserted(
                mime::TEXT_HTML_UTF_8,
                content.as_bytes().to_vec(),
                Visibility::Published,
            ),
            path: format!("/diary/{basename}.html"),
            real_path: real_path.clone(),
        }])
    }
}

#[derive(Deserialize)]
struct IndexMetadata {}

struct IndexProcessor;

#[async_trait::async_trait]
impl FileProcessor for IndexProcessor {
    type Error = anyhow::Error;
    type Context = Context;
    async fn process(
        &self,
        _ctx: &Self::Context,
        event: ProcessorOut,
    ) -> anyhow::Result<Vec<ProcessorOut>> {
        trace!(path = event.path, "diary");
        if &event.path != "/index.md" {
            return Ok(Vec::new());
        }
        if let ProcessorOut {
            event: ProcessorEventType::Removed,
            ..
        } = &event
        {
            return Ok(vec![ProcessorOut {
                tag: "transpiler:diary".into(),
                event: ProcessorEventType::Removed,
                path: event.path.clone(),
                real_path: event.real_path.clone(),
            }]);
        }
        let ProcessorOut { real_path, event: ProcessorEventType::Inserted(_mime, src, _), ..} = &event else {
            return Ok(Vec::new())
        };
        let arena = Arena::new();
        let src = std::str::from_utf8(src)?;
        let (_meta, md): (IndexMetadata, _) = unmark::parser::parse(&arena, src)?;
        let ctx = unmark::transpiler::Context::default();
        let body = unmark::transpiler::document(ctx, md)?;
        let dom = html!(
            <html>
            <head>
                <title>"index"</title>
                <meta name="viewport" content="width=device-width" />
                <link rel="stylesheet" href="/styles/index.css"/>
                </head>
                <body>
                {body}
                <script type="text/javascript" src="/scripts/main.js"></script>
                </body>
            </html>
        );
        let content = format!("<!DOCTYPE html>\n{dom}");
        Ok(vec![ProcessorOut {
            tag: "transpile:diary".into(),
            event: ProcessorEventType::Inserted(
                mime::TEXT_HTML_UTF_8,
                content.as_bytes().to_vec(),
                Visibility::Published,
            ),
            path: "/index.html".to_string(),
            real_path: real_path.clone(),
        }])
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    use tracing_subscriber::prelude::*;
    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(fmt::layer())
        .init();

    let opts = Opts::parse();
    if let Some(config) = opts.config {
        let config = fs::read_to_string(config).await?;
        let config: Config = ron::from_str(&config)?;
        let state = Arc::new(unmark::dev_server::State::default());
        if let Some(addr) = opts.serve {
            let app = axum::Router::new()
                .fallback(axum::routing::get(dev_server::get))
                .with_state(state.clone());
            info!(addr = addr.to_string(), "launch_server");
            tokio::spawn(axum::Server::bind(&addr).serve(app.into_make_service()));
        }
        unmark::dev_server::watch_files::<Context, anyhow::Error, _>(
            state,
            Context {
                blog_metadata: Default::default(),
                diary_metadata: Default::default(),
            },
            vec![
                DirectoryLayer {
                    dist: "/styles".into(),
                    src: config.style_root,
                    filter: unmark::dev_server::Filter {
                        pass: None,
                        ignore: None,
                    },
                },
                DirectoryLayer {
                    dist: "/scripts".into(),
                    src: config.script_root,
                    filter: unmark::dev_server::Filter {
                        pass: None,
                        ignore: None,
                    },
                },
                DirectoryLayer {
                    dist: "".into(),
                    src: config.root,
                    filter: unmark::dev_server::Filter {
                        pass: Some(regex::Regex::new(r#".*\.md"#).unwrap()),
                        ignore: None,
                    },
                },
            ],
            vec![
                Box::new(BlogIndexProcessor),
                Box::new(DiaryIndexProcessor),
                Box::new(DiaryProcessor {}),
                Box::new(BlogProcessor),
                Box::new(IndexProcessor),
                Box::<unmark::dev_server::utilities::LogProcessor<Context, anyhow::Error>>::default(
                ),
                Box::new(unmark::dev_server::utilities::FileLoader::new(
                    Filter {
                        ignore: Some(regex::Regex::new(r#".*\.md"#).unwrap()),
                        pass: None,
                    },
                    Visibility::Published,
                    |e| anyhow::anyhow!("{e}"),
                )),
                Box::new(unmark::dev_server::utilities::FileLoader::new(
                    Filter {
                        pass: Some(regex::Regex::new(r#".*\.md"#).unwrap()),
                        ignore: None,
                    },
                    Visibility::Intermediate,
                    |e| anyhow::anyhow!("{e}"),
                )),
            ],
        )
        .await?;
    } else {
        let example = Config::example();
        println!(
            "{}",
            ron::ser::to_string_pretty(&example, Default::default())?
        );
    }
    Ok(())
}
