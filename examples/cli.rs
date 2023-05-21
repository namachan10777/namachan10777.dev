use anyhow::Context;
use axohtml::{dom::DOMTree, html, text, types::Id};
use clap::Parser;
use maplit::hashmap;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, io::Write, path::PathBuf, str::from_utf8};
use unmark::builder::{build, static_load, Blob, DirMap};

#[derive(Parser)]
struct Opts {
    root: PathBuf,
    dist: PathBuf,
}

struct Hooks;
impl unmark::htmlgen::Hooks for Hooks {}

struct Blog;

#[derive(Debug, Deserialize, Serialize)]
struct BlogMeta {
    name: String,
    category: Vec<String>,
}

impl unmark::builder::OneToOneRule for Blog {
    type Error = anyhow::Error;

    fn build(
        &self,
        path: &std::path::Path,
        content: &unmark::builder::Blob,
    ) -> Result<(PathBuf, unmark::builder::Blob), Self::Error> {
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
                </head>
                <body>
                    <div id="content">
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
        let content = Blob {
            content: html.to_string().as_bytes().to_vec(),
            mime: mime::TEXT_HTML_UTF_8,
            publish: true,
        };
        Ok((path.with_extension("html"), content))
    }
}

struct Diary;
#[derive(Debug, Deserialize, Serialize)]
struct DiaryMeta {
    date: String,
}

impl unmark::builder::OneToOneRule for Diary {
    type Error = anyhow::Error;

    fn build(
        &self,
        path: &std::path::Path,
        content: &Blob,
    ) -> Result<(PathBuf, Blob), Self::Error> {
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
                </head>
                <body><div id="contents">
                    <span><a href="../index.html" class="path-component">"namachan10777.dev"</a>"/"<a class="path-component" href="../diary.html">"diary"</a>"/"<span class="path-component">{text!(page_name)}</span></span>
                    {html}
                </div></body>
            </html>
        );
        let content = Blob {
            content: html.to_string().as_bytes().to_vec(),
            mime: mime::TEXT_HTML_UTF_8,
            publish: true,
        };
        Ok((path.with_extension("html"), content))
    }
}

struct Index;
#[derive(Deserialize)]
struct IndexMeta {
    title: String,
}
impl unmark::builder::OneToOneRule for Index {
    type Error = anyhow::Error;

    fn build(
        &self,
        path: &std::path::Path,
        content: &Blob,
    ) -> Result<(PathBuf, Blob), Self::Error> {
        let src = String::from_utf8_lossy(&content.content);
        let (ast, meta) = unmark::md::parse::<IndexMeta>(&src)?;
        let html = unmark::htmlgen::document(Hooks, &ast)?;
        let html: DOMTree<String> = html!(
            <html>
                <head>
                    <title>{text!(meta.title)}</title>
                    <link rel="stylesheet" href="./style/highlight/otynium.css" />
                    <link rel="stylesheet" href="./style/index.css" />
                </head>
                <body><div id="contents">{html}</div></body>
            </html>
        );
        let content = Blob {
            content: html.to_string().as_bytes().to_vec(),
            mime: mime::TEXT_HTML_UTF_8,
            publish: true,
        };
        Ok((path.with_extension("html"), content))
    }
}

struct BlogIndex;
impl unmark::builder::Rule for BlogIndex {
    type Error = anyhow::Error;

    fn build(&self, tree: &unmark::builder::Tree) -> Result<unmark::builder::Tree, Self::Error> {
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
                </head>
                <body>
                    <div id="contents">
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
        let content = Blob {
            content: html.to_string().as_bytes().to_vec(),
            mime: mime::TEXT_HTML_UTF_8,
            publish: true,
        };
        Ok(hashmap! {"/blog.html".into() => content })
    }
}

struct DiaryIndex;
impl unmark::builder::Rule for DiaryIndex {
    type Error = anyhow::Error;

    fn build(&self, tree: &unmark::builder::Tree) -> Result<unmark::builder::Tree, Self::Error> {
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
                </head>
                <body>
                    <div id="contents">
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
        let content = Blob {
            content: html.to_string().as_bytes().to_vec(),
            mime: mime::TEXT_HTML_UTF_8,
            publish: true,
        };
        Ok(hashmap! {"/diary.html".into() => content })
    }
}

struct CategoryIndex;
impl unmark::builder::Rule for CategoryIndex {
    type Error = anyhow::Error;

    fn build(&self, tree: &unmark::builder::Tree) -> Result<unmark::builder::Tree, Self::Error> {
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
                </head>
                <body>
                    <div id="contents">
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
        let content = Blob {
            content: html.to_string().as_bytes().to_vec(),
            mime: mime::TEXT_HTML_UTF_8,
            publish: true,
        };
        Ok(hashmap! {"/category.html".into() => content })
    }
}

fn main() -> anyhow::Result<()> {
    let opts = Opts::parse();
    let tree = static_load(vec![
        DirMap::new_by_re(&opts.root, "/", false, Regex::new(r#"^.+\.md$"#).unwrap()),
        DirMap::new_by_re(&opts.root, "/", true, Regex::new(r#"^.+\.css$"#).unwrap()),
    ])?;
    dbg!(tree.keys().collect::<Vec<_>>());
    let tree = build(
        tree,
        vec![
            unmark::builder::one_to_one_based_on_regex(
                Regex::new(r#"^/blog/.+\.md$"#).unwrap(),
                Blog,
            ),
            unmark::builder::one_to_one_based_on_regex(
                Regex::new(r#"^/diary/.+\.md$"#).unwrap(),
                Diary,
            ),
            unmark::builder::one_to_one_based_on_regex(
                Regex::new(r#"^/index.md$"#).unwrap(),
                Index,
            ),
            Box::new(BlogIndex),
            Box::new(DiaryIndex),
            Box::new(CategoryIndex),
        ],
    )?;
    for (path, content) in tree {
        if !content.publish {
            continue;
        }
        dbg!(&path);
        let out_path = opts.dist.join(path.strip_prefix("/").unwrap());
        dbg!(&out_path);
        if out_path.exists() {
            if out_path.is_dir() {
                fs::remove_dir_all(&out_path)?;
            }
        }
        fs::create_dir_all(&out_path.parent().unwrap())?;
        let mut file = fs::File::create(out_path)?;
        file.write_all(&content.content)?;
    }
    Ok(())
}
