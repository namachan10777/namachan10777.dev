use anyhow::Context;
use axohtml::{
    dom::DOMTree,
    elements::{MetadataContent, PhrasingContent},
    html, text,
    types::Id,
};
use clap::Parser;
use itertools::Itertools;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::SocketAddr,
    path::{Path, PathBuf},
};
use tokio::fs;
use tracing::info;
use unmark::{
    builder::{static_load, Blob, Cache, DirMap, Rule},
    html::{
        git::gen_history,
        image::{
            get_img_src, optimized_srcset, optimized_srcset_string, ImageOptimizeConfig, ImageSrc,
        },
    },
    tools::{self, git::GitRepo},
};

#[derive(Parser)]
struct Opts {
    #[clap(subcommand)]
    cmd: SubCommand,
}

static IMAGE_OPTIMIZE_CONFIG: Lazy<ImageOptimizeConfig> =
    Lazy::new(|| ImageOptimizeConfig::new(200, 0.6).unwrap());

#[derive(Parser)]
enum SubCommand {
    Dev {
        root: PathBuf,
        #[clap(short, long, default_value = "127.0.0.1:3000")]
        addr: SocketAddr,
    },
    Build {
        root: PathBuf,
        #[clap(short, long)]
        dist: PathBuf,
    },
}

struct Hooks {
    imgs: HashMap<PathBuf, ImageSrc>,
}

impl unmark::htmlgen::Hooks for Hooks {
    fn img_phrasing(
        &self,
        url: &str,
        alt: &str,
    ) -> Result<Box<dyn PhrasingContent<String>>, unmark::htmlgen::Error> {
        let k: PathBuf = url.into();
        let src = self.imgs.get(&k).unwrap();
        if let Some(srcset) = optimized_srcset_string(&IMAGE_OPTIMIZE_CONFIG, src) {
            Ok(html!(
                <img loading="lazy" srcset=srcset src=url alt=alt class="generic-img" width=(src.dim.0) height=(src.dim.1)/>
            ))
        } else {
            Ok(html!(
                <img loading="lazy" src=url alt=alt class="generic-img" width=(src.dim.0) height=(src.dim.1)/>
            ))
        }
    }
}

impl Hooks {
    fn new(tree: &HashMap<&Path, &Blob>) -> Self {
        Self {
            imgs: tree
                .iter()
                .map(|(path, blob)| {
                    if matches!(blob.mime.essence_str(), "image/*")
                        || path.extension().map(|s| s == "svg").unwrap_or(false)
                    {
                        let src = get_img_src(path, blob)?;
                        Ok(Some(((*path).to_owned(), src)))
                    } else {
                        Ok::<_, unmark::html::image::ImageError>(None)
                    }
                })
                .collect::<Result<Vec<_>, _>>()
                .unwrap()
                .into_iter()
                .flatten()
                .collect(),
        }
    }
}

fn create_rss_item_diary<P1: AsRef<Path>, P2: AsRef<Path>>(
    article_root: P1,
    path: P2,
    blob: &Blob,
) -> anyhow::Result<rss::Item> {
    let content = String::from_utf8_lossy(&blob.content);
    let (ast, meta) = unmark::md::parse::<DiaryMeta>(&content)?;
    let title = unmark::md::util::h1_content_as_string(&ast);
    let mut item = rss::Item::default();
    item.set_title(meta.date);
    item.set_author("Masaki Nakano".to_owned());
    let page_name = path
        .as_ref()
        .file_name()
        .unwrap()
        .to_str()
        .unwrap()
        .strip_suffix(".md")
        .unwrap();
    item.set_title(title);
    item.set_link(format!(
        "https://www.namachan10777.dev/diary/{}.html",
        page_name
    ));
    let repo = GitRepo::open(article_root)?;
    let commits = repo.get_file_logs(path)?;
    let last_commit = commits.last().unwrap();
    item.set_pub_date(tools::git::chrono_from_git(&last_commit.time()).to_rfc2822());
    Ok(item)
}

fn create_rss_item_blog<P1: AsRef<Path>, P2: AsRef<Path>>(
    article_root: P1,
    path: P2,
    blob: &Blob,
) -> anyhow::Result<rss::Item> {
    let content = String::from_utf8_lossy(&blob.content);
    let (ast, meta) = unmark::md::parse::<BlogMeta>(&content)?;
    let title = unmark::md::util::h1_content_as_string(&ast);
    let mut item = rss::Item::default();
    item.set_author("Masaki Nakano".to_owned());
    item.set_categories(
        meta.category
            .iter()
            .map(|name| {
                let mut cat = rss::Category::default();
                cat.set_name(name.clone());
                cat
            })
            .collect_vec(),
    );
    let page_name = path
        .as_ref()
        .file_name()
        .unwrap()
        .to_str()
        .unwrap()
        .strip_suffix(".md")
        .unwrap();
    item.set_title(title);
    item.set_link(format!(
        "https://www.namachan10777.dev/blog/{}.html",
        page_name
    ));
    let repo = GitRepo::open(article_root)?;
    let commits = repo.get_file_logs(path)?;
    let last_commit = commits.last().unwrap();
    item.set_pub_date(tools::git::chrono_from_git(&last_commit.time()).to_rfc2822());
    Ok(item)
}

fn create_rss_item_index<P1: AsRef<Path>, P2: AsRef<Path>>(
    article_root: P1,
    path: P2,
    _blob: &Blob,
) -> anyhow::Result<rss::Item> {
    let mut item = rss::Item::default();
    item.set_author("Masaki Nakano".to_owned());
    let page_name = path
        .as_ref()
        .file_name()
        .unwrap()
        .to_str()
        .unwrap()
        .strip_suffix(".md")
        .unwrap();
    item.set_title("index".to_owned());
    item.set_link(format!(
        "https://www.namachan10777.dev/blog/{}.html",
        page_name
    ));
    let repo = GitRepo::open(article_root)?;
    let commits = repo.get_file_logs(path)?;
    let last_commit = commits.last().unwrap();
    item.set_pub_date(tools::git::chrono_from_git(&last_commit.time()).to_rfc2822());
    Ok(item)
}

#[derive(Clone)]
struct Rss {
    article_root: PathBuf,
}

impl unmark::builder::util::Aggregate for Rss {
    type Error = anyhow::Error;
    fn demands(&self, tree: &HashMap<PathBuf, Blob>) -> Vec<PathBuf> {
        let re = Regex::new(r#"^.+\.md$"#).unwrap();
        tree.keys()
            .filter(|path| re.is_match(&path.to_string_lossy()))
            .cloned()
            .collect()
    }

    fn out(&self, _: &HashMap<PathBuf, Blob>) -> PathBuf {
        "/rss.xml".into()
    }

    fn build(&self, tree: &std::collections::HashMap<&Path, &Blob>) -> Result<Blob, Self::Error> {
        let items = tree
            .iter()
            .map(|(path, blob)| {
                if path.starts_with("/blog") {
                    Ok(Some(create_rss_item_blog(&self.article_root, path, blob)?))
                } else if path.starts_with("/diary") {
                    Ok(Some(create_rss_item_diary(&self.article_root, path, blob)?))
                } else if path.as_os_str() == "/index.md" {
                    Ok(Some(create_rss_item_index(&self.article_root, path, blob)?))
                } else {
                    Ok::<_, anyhow::Error>(None)
                }
            })
            .collect::<Result<Vec<_>, _>>()?
            .into_iter()
            .flatten()
            .collect_vec();
        let mut channel = rss::Channel::default();
        channel.set_webmaster("admin@namachan10777.dev".to_owned());
        channel.set_title("namachan10777.dev".to_owned());
        channel.set_description("namachan10777's persoanl web site".to_owned());
        channel.set_link("https://www.namachan10777.dev".to_owned());
        channel.set_items(items);
        Ok(Blob::new(
            channel.to_string().as_bytes().to_vec(),
            mime::TEXT_XML,
            true,
        ))
    }
}

#[derive(Clone)]
struct Blog {
    article_root: PathBuf,
}

#[derive(Debug, Deserialize, Serialize)]
struct BlogMeta {
    name: String,
    category: Vec<String>,
}

#[derive(Clone)]
struct Image;

impl unmark::builder::util::Spread for Image {
    type Error = anyhow::Error;
    fn out_path(&self, path: &std::path::Path, blob: &Blob) -> Vec<std::path::PathBuf> {
        let src = get_img_src(path, blob).unwrap();
        if let Ok(srcset) = optimized_srcset(&IMAGE_OPTIMIZE_CONFIG, &src) {
            let mut optimized_imgs = srcset.into_iter().map(|src| src.path).collect::<Vec<_>>();
            optimized_imgs.push(path.with_extension("webp"));
            optimized_imgs
        } else {
            vec![path.to_owned()]
        }
    }
    fn build(
        &self,
        path: &std::path::Path,
        blob: &Blob,
    ) -> Result<HashMap<PathBuf, Blob>, Self::Error> {
        let images = unmark::html::image::optimize_img(
            &IMAGE_OPTIMIZE_CONFIG,
            &get_img_src(path, blob)?,
            blob,
        )?;
        Ok(images)
    }
}

impl unmark::builder::util::MapWithDeps for Blog {
    type Error = anyhow::Error;

    fn out_path(&self, path: &std::path::Path) -> std::path::PathBuf {
        path.with_extension("html")
    }

    fn deps(&self, path: &std::path::Path, blob: &Blob) -> Vec<PathBuf> {
        let src = String::from_utf8_lossy(&blob.content);
        let Ok((ast, _)) =
            unmark::md::parse::<BlogMeta>(&src).with_context(|| format!("{path:?}")) else { return Vec::new() };
        unmark::md::util::included_images(&ast)
            .into_iter()
            .filter(|url| !url.starts_with("https://"))
            .collect()
    }

    fn build(
        &self,
        path: &std::path::Path,
        tree: &HashMap<&Path, &Blob>,
    ) -> Result<unmark::builder::Blob, Self::Error> {
        let content = tree.get(path).with_context(|| "no entry")?;
        let src = String::from_utf8_lossy(&content.content);
        let (ast, meta) =
            unmark::md::parse::<BlogMeta>(&src).with_context(|| format!("{path:?}"))?;
        let html = unmark::htmlgen::document(Hooks::new(tree), &ast)?;
        let title = unmark::md::util::h1_content_as_string(&ast)
            .unwrap_or_else(|| path.to_string_lossy().to_string());
        let page_name = path.file_name();
        let page_name = page_name.unwrap().to_string_lossy();
        let page_name = page_name.strip_suffix(".md").unwrap();
        let html: DOMTree<String> = html!(
            <html lang="ja">
                <head>
                    <title>{text!(title)}</title>
                    {common_headers()}
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
                        {gen_history(&self.article_root, path)}
                    </div>
                </body>
            </html>
        );
        let content = Blob::new(
            format!("<!DOCTYPE html>{html}").as_bytes().to_vec(),
            mime::TEXT_HTML_UTF_8,
            true,
        );
        Ok(content)
    }
}

#[derive(Clone)]
struct Diary {
    article_root: PathBuf,
}
#[derive(Debug, Deserialize, Serialize)]
struct DiaryMeta {
    date: String,
}

impl unmark::builder::util::MapWithDeps for Diary {
    type Error = anyhow::Error;

    fn out_path(&self, path: &std::path::Path) -> std::path::PathBuf {
        path.with_extension("html")
    }

    fn deps(&self, path: &std::path::Path, blob: &Blob) -> Vec<PathBuf> {
        let src = String::from_utf8_lossy(&blob.content);
        let Ok((ast, _)) =
            unmark::md::parse::<BlogMeta>(&src).with_context(|| format!("{path:?}")) else { return Vec::new() };
        unmark::md::util::included_images(&ast)
            .into_iter()
            .filter(|url| !url.starts_with("https://"))
            .collect()
    }

    fn build(
        &self,
        path: &std::path::Path,
        tree: &HashMap<&Path, &Blob>,
    ) -> Result<Blob, Self::Error> {
        let content = tree.get(path).with_context(|| "no entry")?;
        let src = String::from_utf8_lossy(&content.content);
        let (ast, meta) = unmark::md::parse::<DiaryMeta>(&src)?;
        let page_name = path.file_name();
        let page_name = page_name.unwrap().to_string_lossy();
        let page_name = page_name.strip_suffix(".md").unwrap();
        let html = unmark::htmlgen::document(Hooks::new(tree), &ast)?;
        let html: DOMTree<String> = html!(
            <html lang="ja">
                <head>
                    <title>{text!(meta.date)}</title>
                    {common_headers()}
                </head>
                <body>
                    <div id="contents-root">
                        <span><a href="../index.html" class="path-component">"namachan10777.dev"</a>"/"<a class="path-component" href="../diary.html">"diary"</a>"/"<span class="path-component">{text!(page_name)}</span></span>
                        {html}
                        {gen_history(&self.article_root, path)}
                    </div>
                </body>
            </html>
        );
        let content = Blob::new(
            format!("<!DOCTYPE html>{html}").as_bytes().to_vec(),
            mime::TEXT_HTML_UTF_8,
            true,
        );
        Ok(content)
    }
}

#[derive(Clone)]
struct Index {
    article_root: PathBuf,
}
#[derive(Deserialize)]
struct IndexMeta {
    title: String,
}
impl unmark::builder::util::MapWithDeps for Index {
    type Error = anyhow::Error;

    fn out_path(&self, path: &std::path::Path) -> std::path::PathBuf {
        path.with_extension("html")
    }

    fn deps(&self, path: &std::path::Path, blob: &Blob) -> Vec<PathBuf> {
        let src = String::from_utf8_lossy(&blob.content);
        let Ok((ast, _)) =
            unmark::md::parse::<IndexMeta>(&src).with_context(|| format!("{path:?}")) else { return Vec::new() };
        unmark::md::util::included_images(&ast)
            .into_iter()
            .filter(|url| !url.starts_with("https://"))
            .collect()
    }

    fn build(
        &self,
        path: &std::path::Path,
        tree: &HashMap<&Path, &Blob>,
    ) -> Result<Blob, Self::Error> {
        let content = tree.get(path).with_context(|| "no entry")?;
        let src = String::from_utf8_lossy(&content.content);
        let (ast, meta) = unmark::md::parse::<IndexMeta>(&src)?;
        let html = unmark::htmlgen::document(Hooks::new(tree), &ast)?;
        let html: DOMTree<String> = html!(
            <html lang="ja">
                <head>
                    <title>{text!(meta.title)}</title>
                    {common_headers()}
                </head>
                <body>
                    <div id="contents-root">
                        {html}
                        {gen_history(&self.article_root, path)}
                    </div>
                </body>
            </html>
        );
        let content = Blob::new(
            format!("<!DOCTYPE html>{html}").as_bytes().to_vec(),
            mime::TEXT_HTML_UTF_8,
            true,
        );
        Ok(content)
    }
}

fn common_headers() -> Vec<Box<dyn MetadataContent<String>>> {
    vec![
        html!(<link rel="icon" href="/favicon.ico" type="image/vnd.microsoft.icon"	 />),
        html!(<link rel="stylesheet" href="/style/highlight/otynium.css" />),
        html!(<link rel="stylesheet" href="/style/index.css" />),
        html!(<meta name="viewport" content="width=device-width, initial-scale=1.0" />),
    ]
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
            <html lang="ja">
                <head>
                    <title>"Blog"</title>
                    {common_headers()}
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
            format!("<!DOCTYPE html>{html}").as_bytes().to_vec(),
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
        let re = Regex::new(r#"^/diary/.+\.md$"#).unwrap();
        tree.keys()
            .filter(|path| re.is_match(&path.to_string_lossy()))
            .cloned()
            .collect()
    }

    fn build(&self, tree: &HashMap<&Path, &Blob>) -> Result<Blob, Self::Error> {
        let diary_re = Regex::new(r#"^/diary/.+\.md"#).unwrap();
        let diaries = tree
            .iter()
            .filter(|(path, _)| diary_re.is_match(&path.to_string_lossy()))
            .map(|(path, content)| {
                let content = String::from_utf8_lossy(&content.content);
                let (_, meta) = unmark::md::parse::<DiaryMeta>(&content)?;
                Ok::<_, anyhow::Error>((path, meta.date))
            })
            .collect::<Result<HashMap<_, _>, _>>()?;
        let html: DOMTree<String> = html!(
            <html lang="ja">
                <head>
                    <title>"Diary"</title>
                    {common_headers()}
                </head>
                <body>
                    <div id="contents-root">
                        <header>
                            <span><a href="index.html" class="path-component">"namachan10777.dev"</a>"/"<span class="path-component">"diary"</span></span>
                        </header>
                        <h1 class="heading">"Diary"</h1>
                        <ul>
                            {
                                diaries.into_iter().map(|(path, title)| {
                                    html!(<li><a href=(path.strip_prefix("/").unwrap().with_extension("html").to_string_lossy())>{text!(title)}</a></li>)
                                })
                            }
                        </ul>
                    </div>
                </body>
            </html>
        );
        let content = Blob::new(
            format!("<!DOCTYPE html>{html}").as_bytes().to_vec(),
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
            <html lang="ja">
                <head>
                    <title>"Blog"</title>
                    {common_headers()}
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
            format!("<!DOCTYPE html>{html}").as_bytes().to_vec(),
            mime::TEXT_HTML_UTF_8,
            true,
        );
        Ok(content)
    }
}

type BoxedDirMap = DirMap<Box<dyn Fn(&Path) -> bool + 'static + Send + Sync>>;

fn dirs(root: &Path) -> Vec<BoxedDirMap> {
    vec![
        DirMap::new_by_re(
            root.to_owned(),
            "/".into(),
            Regex::new(r#"^.+\.md$"#).unwrap(),
            false,
        ),
        DirMap::new_by_re(
            root.to_owned(),
            "/".into(),
            Regex::new(r#"^.+\.css$"#).unwrap(),
            false,
        ),
        DirMap::new_by_re(
            root.join("public"),
            "/".into(),
            Regex::new(r#"^.+$"#).unwrap(),
            false,
        ),
    ]
}

fn rules<P: AsRef<Path>>(
    article_root: P,
) -> Vec<Box<dyn Rule<Error = anyhow::Error> + Send + Sync + 'static>> {
    let article_root = article_root.as_ref().to_owned();
    vec![
        unmark::builder::util::spread(Regex::new(r#"^.+\.(png|webp)"#).unwrap(), Image),
        unmark::builder::util::publish(Regex::new(r#"^.+\.(ico|css|svg)"#).unwrap()),
        unmark::builder::util::map_with_dep(
            Blog {
                article_root: article_root.clone(),
            },
            Regex::new(r#"^/blog/.+\.md$"#).unwrap(),
        ),
        unmark::builder::util::map_with_dep(
            Diary {
                article_root: article_root.clone(),
            },
            Regex::new(r#"^/diary/.+\.md$"#).unwrap(),
        ),
        unmark::builder::util::map_with_dep(
            Index {
                article_root: article_root.clone(),
            },
            Regex::new(r#"^/index.md$"#).unwrap(),
        ),
        unmark::builder::util::aggregate(Rss { article_root }),
        unmark::builder::util::aggregate(BlogIndex),
        unmark::builder::util::aggregate(DiaryIndex),
        unmark::builder::util::aggregate(CategoryIndex),
    ]
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    use tracing_subscriber::prelude::*;
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();
    let opts = Opts::parse();
    match opts.cmd {
        SubCommand::Build { root, dist } => {
            let rules = rules(&root);
            let tree = static_load(&dirs(&root)).await?;
            for (path, blob) in unmark::builder::build(&mut Cache::empty(), tree, &rules)? {
                if !blob.publish {
                    continue;
                }
                info!(path = format!("{path:?}"), "write");
                let path = dist.join(path.strip_prefix("/").unwrap());
                if let Some(parent) = path.parent() {
                    if !parent.exists() {
                        fs::create_dir_all(parent).await?;
                    }
                }
                fs::write(path, blob.content).await?;
            }
        }
        SubCommand::Dev { root, addr } => {
            let rules = rules(&root);
            unmark::builder::dev_server::serve(&addr, dirs(&root), rules).await?;
        }
    }
    Ok(())
}
