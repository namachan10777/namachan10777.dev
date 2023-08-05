use anyhow::Context;
use axohtml::{
    dom::DOMTree,
    elements::{MetadataContent, PhrasingContent},
    html, text,
    types::Id,
};
use clap::Parser;
use image::GenericImageView;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::SocketAddr,
    path::{Path, PathBuf},
};
use tokio::fs;
use tracing::info;
use unmark::builder::{static_load, Blob, Cache, DirMap};

#[derive(Parser)]
struct Opts {
    #[clap(subcommand)]
    cmd: SubCommand,
}

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
    imgs: HashMap<PathBuf, (u32, u32)>,
}

#[derive(Debug)]
struct Src {
    dim: (u32, u32),
    path: PathBuf,
}

fn srcset(path: &Path, (w, h): (u32, u32)) -> Vec<Src> {
    let mut srcset = Vec::new();
    let mut w = w;
    let mut h = h;
    let re = Regex::new(r#"^(.*/.+).(png|webp)$"#).unwrap();
    while w > 100 {
        let path = path.to_string_lossy().to_string();
        let matched = re.captures(&path).unwrap();
        let path = format!(
            "{}-{}w.{}",
            matched.get(1).unwrap().as_str(),
            w,
            matched.get(2).unwrap().as_str()
        );
        srcset.push(Src {
            dim: (w, h),
            path: path.into(),
        });
        w = w / 2;
        h = h / 2;
    }
    srcset.reverse();
    srcset
}

impl unmark::htmlgen::Hooks for Hooks {
    fn img_phrasing(
        &self,
        url: &str,
        alt: &str,
    ) -> Result<Box<dyn PhrasingContent<String>>, unmark::htmlgen::Error> {
        let k: PathBuf = url.into();
        let (w, h) = self.imgs.get(&k).map(|(w, h)| (*w, *h)).unwrap();
        if k.extension().map(|ext| ext != "svg").unwrap_or(true) {
            let srcset_attr = srcset(&k, (w, h))
                .into_iter()
                .map(|src| {
                    format!(
                        "{path} {w}w",
                        path = src.path.to_string_lossy(),
                        w = src.dim.0
                    )
                })
                .collect::<Vec<_>>()
                .join(", ");
            Ok(html!(
                <img loading="lazy" srcset=srcset_attr src=url alt=alt class="generic-img" width=w height=h/>
            ))
        } else {
            Ok(html!(
                <img loading="lazy" src=url alt=alt class="generic-img" width=w height=h/>
            ))
        }
    }
}

fn get_size_hint_from_svg(svg: &Blob) -> (u32, u32) {
    let svg = String::from_utf8_lossy(&svg.content);
    let mut svg = svg::read(&svg).unwrap();
    let size = svg.find_map(|event| match event {
        svg::parser::Event::Tag(_, _, attrs) => {
            let (_, w) = attrs.iter().find(|(name, _)| *name == "width")?;
            let (_, h) = attrs.iter().find(|(name, _)| *name == "height")?;
            let w: u32 = w.parse().ok()?;
            let h: u32 = h.parse().ok()?;
            Some((w, h))
        }
        _ => None,
    });
    size.unwrap()
}

impl Hooks {
    fn new(tree: &HashMap<&Path, &Blob>) -> Self {
        Self {
            imgs: tree
                .iter()
                .filter_map(|(path, blob)| {
                    if matches!(blob.mime.essence_str(), "image/*") {
                        let image = image::load_from_memory(&blob.content).ok()?;
                        Some(((*path).to_owned(), image.dimensions()))
                    } else if path.extension().map(|s| s == "svg").unwrap_or(false) {
                        let size = get_size_hint_from_svg(blob);
                        Some(((*path).to_owned(), size))
                    } else {
                        None
                    }
                })
                .collect(),
        }
    }
}

#[derive(Clone)]
struct Blog;

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
        let image = image::load_from_memory(&blob.content).unwrap();
        let mut outs = srcset(path, image.dimensions())
            .into_iter()
            .map(|src| src.path.with_extension("webp"))
            .collect::<Vec<_>>();
        outs.push(path.with_extension("webp"));
        outs
    }
    fn build(
        &self,
        path: &std::path::Path,
        blob: &Blob,
    ) -> Result<HashMap<PathBuf, Blob>, Self::Error> {
        let image = image::load_from_memory(&blob.content)?;
        let mut images = HashMap::new();
        let mut buffer = Vec::new();
        image::codecs::webp::WebPEncoder::new(&mut buffer)
            .encode(
                image.as_bytes(),
                image.dimensions().0,
                image.dimensions().1,
                image.color(),
            )
            .unwrap();
        images.insert(
            path.with_extension("webp"),
            Blob::new(buffer, mime::IMAGE_STAR, true),
        );
        for src in srcset(path, image.dimensions()) {
            let mut buffer = Vec::new();
            let image = image.resize(
                src.dim.0,
                src.dim.1,
                image::imageops::FilterType::CatmullRom,
            );
            image::codecs::webp::WebPEncoder::new(&mut buffer).encode(
                image.as_bytes(),
                image.dimensions().0,
                image.dimensions().1,
                image.color(),
            )?;
            images.insert(
                src.path.with_extension("webp"),
                Blob::new(buffer, mime::IMAGE_STAR, true),
            );
        }
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
struct Diary;
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
                <body><div id="contents-root">
                    <span><a href="../index.html" class="path-component">"namachan10777.dev"</a>"/"<a class="path-component" href="../diary.html">"diary"</a>"/"<span class="path-component">{text!(page_name)}</span></span>
                    {html}
                </div></body>
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
struct Index;
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
                <body><div id="contents-root">{html}</div></body>
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

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    use tracing_subscriber::prelude::*;
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();
    let opts = Opts::parse();
    let rules = vec![
        unmark::builder::util::spread(Regex::new(r#"^.+\.(png|webp)"#).unwrap(), Image),
        unmark::builder::util::publish(Regex::new(r#"^.+\.(ico|css|svg)"#).unwrap()),
        unmark::builder::util::map_with_dep(Blog, Regex::new(r#"^/blog/.+\.md$"#).unwrap()),
        unmark::builder::util::map_with_dep(Diary, Regex::new(r#"^/diary/.+\.md$"#).unwrap()),
        unmark::builder::util::map_with_dep(Index, Regex::new(r#"^/index.md$"#).unwrap()),
        unmark::builder::util::aggregate(BlogIndex),
        unmark::builder::util::aggregate(DiaryIndex),
        unmark::builder::util::aggregate(CategoryIndex),
    ];
    match opts.cmd {
        SubCommand::Build { root, dist } => {
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
            unmark::builder::dev_server::serve(&addr, dirs(&root), rules).await?;
        }
    }
    Ok(())
}
