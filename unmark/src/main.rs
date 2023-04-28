use anyhow::anyhow;
use axohtml::{dom::DOMTree, html, text};
use axum::{extract::FromRequestParts, headers::ContentType, http::StatusCode};
use chrono::NaiveDate;
use clap::Parser;

use comrak::{arena_tree::Node, nodes::Ast, Arena};
use serde::{Deserialize, Serialize};
use std::{
    borrow::Borrow,
    cell::RefCell,
    collections::HashMap,
    net::SocketAddr,
    path::{Path, PathBuf},
    sync::Arc,
};
use tokio::fs;
use tokio_stream::StreamExt;
use tracing::info;
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

type Files = HashMap<PathBuf, (Vec<u8>, ContentType)>;

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

#[derive(Debug)]
struct State {
    files: Files,
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

struct Context;

struct BlogProcessor;
#[async_trait::async_trait]
impl FileProcessor for BlogProcessor {
    type Context = Context;
    type Error = anyhow::Error;

    async fn process(
        &self,
        ctx: &Self::Context,
        event: ProcessorOut,
    ) -> Result<Vec<ProcessorOut>, Self::Error> {
        let Some(basename) =
            event.path.strip_suffix(".md") else {
                return Ok(Vec::new())
            };
        let Some(basename) = basename.strip_prefix("/blog/") else {
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
        let src = std::str::from_utf8(&src)?;
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

struct DiaryProcessor {}

#[async_trait::async_trait]
impl<'a> FileProcessor for DiaryProcessor {
    type Error = anyhow::Error;
    type Context = Context;
    async fn process(
        &self,
        _ctx: &Self::Context,
        event: ProcessorOut,
    ) -> anyhow::Result<Vec<ProcessorOut>> {
        let Some(basename) =
            event.path.strip_suffix(".md") else {
            return Ok(Vec::new())
        };
        let Some(basename) = basename.strip_prefix("/diary/") else {
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
        let src = std::str::from_utf8(&src)?;
        let (_meta, md): (DiaryMetadata, _) = unmark::parser::parse(&arena, src)?;
        let ctx = unmark::transpiler::Context::default();
        let body = unmark::transpiler::document(ctx, md)?;
        let _date = NaiveDate::parse_from_str(&basename, "%Y-%m-%d")?;
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
            Context,
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
                Box::new(DiaryProcessor {}),
                Box::new(BlogProcessor),
                Box::new(unmark::dev_server::utilities::LogProcessor::default()),
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
