use axohtml::{dom::DOMTree, html, text};
use axum::{
    extract::FromRequestParts, headers::ContentType, http::StatusCode, Router, TypedHeader,
};
use clap::Parser;

use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::SocketAddr,
    path::{Path, PathBuf},
    sync::Arc,
};
use tokio::fs;
use tokio_stream::StreamExt;
use tracing::info;
use tracing_subscriber::{fmt, EnvFilter};

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

#[async_recursion::async_recursion]
async fn listup_articles<P: AsRef<Path> + Send>(
    root: P,
) -> anyhow::Result<HashMap<PathBuf, String>> {
    let mut stack = vec![root.as_ref().to_owned()];
    let mut articles = HashMap::new();
    while let Some(path) = stack.pop() {
        let ftype = fs::metadata(&path).await?.file_type();
        if ftype.is_dir() {
            let entries = fs::read_dir(&path).await?;
            let mut entries = tokio_stream::wrappers::ReadDirStream::new(entries);
            while let Some(entry) = entries.next().await {
                stack.push(entry?.path());
            }
        } else if ftype.is_file() {
            let content = fs::read_to_string(&path).await?;
            articles.insert(path, content);
        }
    }
    Ok(articles)
}

fn rel_path_from_root<P1: AsRef<Path>, P2: AsRef<Path>>(
    root: P1,
    path: P2,
) -> anyhow::Result<PathBuf> {
    let path = path.as_ref().canonicalize()?;
    let root = root.as_ref().canonicalize()?;
    let path = path.strip_prefix(root)?;
    Ok(path.to_owned())
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

async fn http_handler(
    axum::extract::State(state): axum::extract::State<Arc<State>>,
    AnyPath(path): AnyPath,
) -> (StatusCode, TypedHeader<ContentType>, Vec<u8>) {
    let path: &Path = path.strip_prefix("/").unwrap().as_ref();
    if let Some((content, content_type)) = state.files.get(path) {
        return (
            StatusCode::OK,
            TypedHeader(content_type.clone()),
            content.clone(),
        );
    } else {
        return (
            StatusCode::NOT_FOUND,
            TypedHeader(ContentType::text()),
            Vec::new(),
        );
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
        use tokio::io::AsyncWriteExt;
        let config = fs::read_to_string(config).await?;
        let config: Config = ron::from_str(&config)?;
        let articles = listup_articles(&config.root).await?;
        let arena = comrak::Arena::new();
        let mut files = HashMap::new();

        let scripts = listup_articles(&config.script_root).await?;
        for (path, content) in scripts {
            let rel_path = rel_path_from_root(&config.script_root, path)?;
            let path = config.out.join("scripts").join(&rel_path);
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent).await?;
            }
            let mut file = fs::File::create(path).await?;
            file.write_all(content.as_bytes()).await?;
            files.insert(
                PathBuf::from("scripts").join(rel_path),
                (content.as_bytes().to_vec(), mime::TEXT_JAVASCRIPT.into()),
            );
        }

        let styles = listup_articles(&config.style_root).await?;
        for (path, content) in styles {
            let rel_path = rel_path_from_root(&config.style_root, path)?;
            let path = config.out.join("styles").join(&rel_path);
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent).await?;
            }
            let mut file = fs::File::create(path).await?;
            file.write_all(content.as_bytes()).await?;
            files.insert(
                PathBuf::from("styles").join(rel_path),
                (content.as_bytes().to_vec(), mime::TEXT_CSS.into()),
            );
        }

        for (path, content) in articles {
            let rel_path = rel_path_from_root(&config.root, &path)?;
            // TODO
            let (_frontmatter, md): (serde_json::Value, _) =
                unmark::parser::parse(&arena, &content)?;
            let content = unmark::transpiler::document(unmark::transpiler::Context::default(), md)?;
            let document: DOMTree<String> = html!(
                <html lang="ja">
                    <head>
                        <title>{text!("<title>")}</title>
                        <link rel="stylesheet" href="/styles/index.css"/>
                        <meta charset="utf-8" />
                    </head>
                    <body>
                        <script type="text/javascript" src="/scripts/index.js"></script>
                        {content}
                    </body>
                </html>
            );
            files.insert(
                rel_path.clone().with_extension("html"),
                (
                    document.to_string().as_bytes().to_vec(),
                    ContentType::html(),
                ),
            );
            let out_path = config.out.join(&rel_path).with_extension("html");
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).await?;
            }

            let mut file = fs::File::create(out_path).await?;
            file.write_all("<!DOCTYPE html>".as_bytes()).await?;
            file.write_all(document.to_string().as_bytes()).await?;
        }
        if let Some(addr) = opts.serve {
            let app = Router::new()
                .fallback(axum::routing::get(http_handler))
                .with_state(Arc::new(State { files }));
            info!(addr = addr.to_string(), "launch_server");
            axum::Server::bind(&addr)
                .serve(app.into_make_service())
                .await?;
        }
    } else {
        let example = Config::example();
        println!(
            "{}",
            ron::ser::to_string_pretty(&example, Default::default())?
        );
    }
    Ok(())
}
