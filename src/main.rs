use anyhow::Context;
use axohtml::{dom::DOMTree, html, text, types::Id};
use clap::Parser;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    io::Write,
    net::SocketAddr,
    path::{Path, PathBuf},
};
use unmark::builder::{build, static_load, Blob, DirMap};

#[derive(Parser)]
struct Opts {
    root: PathBuf,
    addr: SocketAddr,
}

struct Hooks;
impl unmark::htmlgen::Hooks for Hooks {}

#[derive(Clone)]
struct Blog;

#[derive(Debug, Deserialize, Serialize)]
struct BlogMeta {
    name: String,
    category: Vec<String>,
}

impl unmark::builder::util::MapRule for Blog {
    type Error = anyhow::Error;

    fn out_path(&self, path: &std::path::Path) -> std::path::PathBuf {
        path.with_extension("html")
    }

    fn build(
        &self,
        path: &std::path::Path,
        content: &unmark::builder::Blob,
    ) -> Result<unmark::builder::Blob, Self::Error> {
        let src = String::from_utf8_lossy(&content.content);
        let (ast, meta) =
            unmark::md::parse::<BlogMeta>(&src).with_context(|| format!("{path:?}"))?;
        let html = unmark::htmlgen::document(Hooks, &ast)?;
        let title = unmark::md::util::h1_content_as_string(&ast)
            .unwrap_or_else(|| path.to_string_lossy().to_string());
        let page_name = path.file_name();
        let page_name = page_name.unwrap().to_string_lossy();
        let page_name = page_name.strip_suffix(".md").unwrap();
        let html: DOMTree<String> = html!(
            <html>
                <head>
                    <title>{text!(title)}</title>
                    <link rel="stylesheet" href="../style/highlight/otynium.css" />
                    <link rel="stylesheet" href="../style/index.css" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </head>
                <body>
                    <div id="contents-root">
                        <header>
                            <span><a href="../index.html" class="path-component">"namachan10777.dev"</a>"/"<a class="path-component" href="../blog.html">"blog"</a>"/"<span class="path-component">{text!(page_name)}</span></span>
                            <div>
                            {
                                meta.category.iter().map(|category| html!(<a class="category" href=(format!("../category.html#{category}"))>{text!(category)}</a>))
                            }
                            </div>
                        </header>
                        {html}
                    </div>
                </body>
            </html>
        );
        let content = Blob::new(
            html.to_string().as_bytes().to_vec(),
            mime::TEXT_HTML_UTF_8,
            true,
        );
        Ok(content)
    }
}

#[derive(Clone)]
struct Diary;
#[derive(Debug, Deserialize, Serialize)]
struct DiaryMeta {
    date: String,
}

impl unmark::builder::util::MapRule for Diary {
    type Error = anyhow::Error;

    fn out_path(&self, path: &std::path::Path) -> std::path::PathBuf {
        path.with_extension("html")
    }

    fn build(&self, path: &std::path::Path, content: &Blob) -> Result<Blob, Self::Error> {
        let src = String::from_utf8_lossy(&content.content);
        let (ast, meta) = unmark::md::parse::<DiaryMeta>(&src)?;
        let page_name = path.file_name();
        let page_name = page_name.unwrap().to_string_lossy();
        let page_name = page_name.strip_suffix(".md").unwrap();
        let html = unmark::htmlgen::document(Hooks, &ast)?;
        let html: DOMTree<String> = html!(
            <html>
                <head>
                    <title>{text!(meta.date)}</title>
                    <link rel="stylesheet" href="../style/highlight/otynium.css" />
                    <link rel="stylesheet" href="../style/index.css" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </head>
                <body><div id="contents-root">
                    <span><a href="../index.html" class="path-component">"namachan10777.dev"</a>"/"<a class="path-component" href="../diary.html">"diary"</a>"/"<span class="path-component">{text!(page_name)}</span></span>
                    {html}
                </div></body>
            </html>
        );
        let content = Blob::new(
            html.to_string().as_bytes().to_vec(),
            mime::TEXT_HTML_UTF_8,
            true,
        );
        Ok(content)
    }
}

#[derive(Clone)]
struct Index;
#[derive(Deserialize)]
struct IndexMeta {
    title: String,
}
impl unmark::builder::util::MapRule for Index {
    type Error = anyhow::Error;

    fn out_path(&self, path: &std::path::Path) -> std::path::PathBuf {
        path.with_extension("html")
    }

    fn build(&self, _: &std::path::Path, content: &Blob) -> Result<Blob, Self::Error> {
        let src = String::from_utf8_lossy(&content.content);
        let (ast, meta) = unmark::md::parse::<IndexMeta>(&src)?;
        let html = unmark::htmlgen::document(Hooks, &ast)?;
        let html: DOMTree<String> = html!(
            <html>
                <head>
                    <title>{text!(meta.title)}</title>
                    <link rel="stylesheet" href="./style/highlight/otynium.css" />
                    <link rel="stylesheet" href="./style/index.css" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </head>
                <body><div id="contents-root">{html}</div></body>
            </html>
        );
        let content = Blob::new(
            html.to_string().as_bytes().to_vec(),
            mime::TEXT_HTML_UTF_8,
            true,
        );
        Ok(content)
    }
}

#[derive(Clone)]
struct BlogIndex;
impl unmark::builder::util::Aggregate for BlogIndex {
    type Error = anyhow::Error;

    fn out(&self, _: &HashMap<PathBuf, Blob>) -> PathBuf {
        "/blog.html".into()
    }

    fn demands(&self, tree: &HashMap<PathBuf, Blob>) -> Vec<PathBuf> {
        let re = Regex::new(r#"^/blog/.+\.md$"#).unwrap();
        tree.keys()
            .filter(|path| re.is_match(&path.to_string_lossy()))
            .cloned()
            .collect()
    }

    fn build(&self, tree: &HashMap<&Path, &Blob>) -> Result<Blob, Self::Error> {
        let blog_re = Regex::new(r#"^/blog/.+\.md"#).unwrap();
        let blogs = tree
            .iter()
            .filter(|(path, _)| blog_re.is_match(&path.to_string_lossy()))
            .map(|(path, content)| {
                let content = String::from_utf8_lossy(&content.content);
                let (ast, _) = unmark::md::parse::<BlogMeta>(&content)?;
                let title = unmark::md::util::h1_content_as_string(&ast)
                    .unwrap_or_else(|| path.to_string_lossy().to_string());
                Ok::<_, anyhow::Error>((path, title))
            })
            .collect::<Result<HashMap<_, _>, _>>()?;
        let html: DOMTree<String> = html!(
            <html>
                <head>
                    <title>"Blog"</title>
                    <link rel="stylesheet" href="./style/highlight/otynium.css" />
                    <link rel="stylesheet" href="./style/index.css" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </head>
                <body>
                    <div id="contents-root">
                        <header>
                            <span><a href="index.html" class="path-component">"namachan10777.dev"</a>"/"<span class="path-component">"blog"</span></span>
                        </header>
                        <h1 class="heading">"Blog"</h1>
                        <ul>
                            {
                                blogs.into_iter().map(|(path, title)| {
                                    html!(<li><a href=(path.strip_prefix("/").unwrap().with_extension("html").to_string_lossy())>{text!(title)}</a></li>)
                                })
                            }
                        </ul>
                    </div>
                </body>
            </html>
        );
        let content = Blob::new(
            html.to_string().as_bytes().to_vec(),
            mime::TEXT_HTML_UTF_8,
            true,
        );
        Ok(content)
    }
}

#[derive(Clone)]
struct DiaryIndex;
impl unmark::builder::util::Aggregate for DiaryIndex {
    type Error = anyhow::Error;

    fn out(&self, _: &HashMap<PathBuf, Blob>) -> PathBuf {
        "/diary.html".into()
    }

    fn demands(&self, tree: &HashMap<PathBuf, Blob>) -> Vec<PathBuf> {
        let re = Regex::new(r#"^/blog/.+\.md$"#).unwrap();
        tree.keys()
            .filter(|path| re.is_match(&path.to_string_lossy()))
            .cloned()
            .collect()
    }

    fn build(&self, tree: &HashMap<&Path, &Blob>) -> Result<Blob, Self::Error> {
        let blog_re = Regex::new(r#"^/diary/.+\.md"#).unwrap();
        let blogs = tree
            .iter()
            .filter(|(path, _)| blog_re.is_match(&path.to_string_lossy()))
            .map(|(path, content)| {
                let content = String::from_utf8_lossy(&content.content);
                let (_, meta) = unmark::md::parse::<DiaryMeta>(&content)?;
                Ok::<_, anyhow::Error>((path, meta.date))
            })
            .collect::<Result<HashMap<_, _>, _>>()?;
        let html: DOMTree<String> = html!(
            <html>
                <head>
                    <title>"Blog"</title>
                    <link rel="stylesheet" href="./style/highlight/otynium.css" />
                    <link rel="stylesheet" href="./style/index.css" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </head>
                <body>
                    <div id="contents-root">
                        <header>
                            <span><a href="index.html" class="path-component">"namachan10777.dev"</a>"/"<span class="path-component">"diary"</span></span>
                        </header>
                        <h1 class="heading">"Blog"</h1>
                        <ul>
                            {
                                blogs.into_iter().map(|(path, title)| {
                                    html!(<li><a href=(path.strip_prefix("/").unwrap().with_extension("html").to_string_lossy())>{text!(title)}</a></li>)
                                })
                            }
                        </ul>
                    </div>
                </body>
            </html>
        );
        let content = Blob::new(
            html.to_string().as_bytes().to_vec(),
            mime::TEXT_HTML_UTF_8,
            true,
        );
        Ok(content)
    }
}

#[derive(Clone)]
struct CategoryIndex;
impl unmark::builder::util::Aggregate for CategoryIndex {
    type Error = anyhow::Error;

    fn out(&self, _: &HashMap<PathBuf, Blob>) -> PathBuf {
        "/category.html".into()
    }

    fn demands(&self, tree: &HashMap<PathBuf, Blob>) -> Vec<PathBuf> {
        let re = Regex::new(r#"^/blog/.+\.md$"#).unwrap();
        tree.keys()
            .filter(|path| re.is_match(&path.to_string_lossy()))
            .cloned()
            .collect()
    }

    fn build(&self, tree: &HashMap<&Path, &Blob>) -> Result<Blob, Self::Error> {
        let blog_re = Regex::new(r#"^/blog/.+\.md"#).unwrap();
        let blogs = tree
            .iter()
            .filter(|(path, _)| blog_re.is_match(&path.to_string_lossy()))
            .map(|(path, content)| {
                let content = String::from_utf8_lossy(&content.content);
                let (ast, meta) = unmark::md::parse::<BlogMeta>(&content)?;
                let title = unmark::md::util::h1_content_as_string(&ast)
                    .unwrap_or_else(|| path.to_string_lossy().to_string());
                Ok::<_, anyhow::Error>(((path, title), meta.category))
            })
            .collect::<Result<HashMap<_, _>, _>>()?;
        let mut categories: HashMap<String, Vec<_>> = HashMap::new();
        for ((path, title), category) in blogs {
            for category in category {
                categories
                    .entry(category)
                    .or_default()
                    .push((path.to_owned(), title.clone()));
            }
        }
        let html: DOMTree<String> = html!(
            <html>
                <head>
                    <title>"Blog"</title>
                    <link rel="stylesheet" href="./style/highlight/otynium.css" />
                    <link rel="stylesheet" href="./style/index.css" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </head>
                <body>
                    <div id="contents-root">
                        <header>
                            <span><a href="index.html" class="path-component">"namachan10777.dev"</a>"/"<span class="path-component">"category"</span></span>
                        </header>
                        <h1 class="heading">"Blog"</h1>
                        {
                            categories.into_iter().map(|(cateogry, paths)| {
                                let category_id = Id::new(cateogry.clone());
                                html!(
                                    <section>
                                        <h2 class="heading"><a id=(category_id)>{text!(cateogry)}</a></h2>
                                        <ul>
                                            {
                                                paths
                                                    .iter()
                                                    .map(|(path, title)|
                                                        html!(<li><a href=(path.strip_prefix("/").unwrap().with_extension("html").to_string_lossy())>{text!(title)}</a></li>)
                                                    )
                                            }
                                        </ul>
                                    </section>
                                )
                            })
                        }
                    </div>
                </body>
            </html>
        );
        let content = Blob::new(
            html.to_string().as_bytes().to_vec(),
            mime::TEXT_HTML_UTF_8,
            true,
        );
        Ok(content)
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    use tracing_subscriber::prelude::*;
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();
    let opts = Opts::parse();
    let tree = vec![
        DirMap::new_by_re(
            opts.root.clone(),
            "/".into(),
            Regex::new(r#"^.+\.md$"#).unwrap(),
            false,
        ),
        DirMap::new_by_re(
            opts.root.clone(),
            "/".into(),
            Regex::new(r#"^.+\.css$"#).unwrap(),
            false,
        ),
    ];
    let mut cache = unmark::builder::Cache::empty();
    unmark::builder::dev_server::serve(
        &opts.addr,
        tree,
        vec![
            unmark::builder::util::map_rule(Blog, Regex::new(r#"^/blog/.+\.md$"#).unwrap()),
            unmark::builder::util::map_rule(Diary, Regex::new(r#"^/diary/.+\.md$"#).unwrap()),
            unmark::builder::util::map_rule(Index, Regex::new(r#"^/index.md$"#).unwrap()),
            unmark::builder::util::aggregate(BlogIndex),
            unmark::builder::util::aggregate(DiaryIndex),
            unmark::builder::util::aggregate(CategoryIndex),
        ],
    )
    .await?;
    Ok(())
}
