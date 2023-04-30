use std::{
    collections::HashMap,
    fs::FileType,
    io,
    path::{Path, PathBuf},
    sync::Arc,
};

use axum::{
    extract::{self, FromRequestParts},
    headers::ContentType,
    http::StatusCode,
    response::IntoResponse,
    TypedHeader,
};
use mime::Mime;
use notify::Watcher;
use tokio::{
    fs,
    io::AsyncReadExt,
    sync::{mpsc, RwLock},
};
use tracing::{error, warn};

pub struct State {
    pub files: RwLock<HashMap<String, (Mime, Vec<u8>)>>,
}

impl Default for State {
    fn default() -> Self {
        Self {
            files: RwLock::new(HashMap::new()),
        }
    }
}

impl State {
    async fn get(&self, path: &str) -> Option<(Mime, Vec<u8>)> {
        let path = path.strip_suffix('/').unwrap_or(path);
        dbg!(path);
        let files = self.files.read().await;
        let (mime, content) = files
            .get(path)
            .or_else(|| files.get(&format!("{path}.html")))
            .or_else(|| files.get(&format!("{path}/index.html")))?;
        Some((mime.clone(), content.clone()))
    }
}

pub struct AnyPath(String);

#[async_trait::async_trait]
impl<S> FromRequestParts<S> for AnyPath {
    type Rejection = ();

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _: &S,
    ) -> Result<Self, Self::Rejection> {
        Ok(Self(parts.uri.to_string()))
    }
}

#[derive(Debug, thiserror::Error)]
pub enum Error<E> {
    #[error("read directory {0:?} due to {1}")]
    ReadDir(PathBuf, io::Error),
    #[error("read file {0:?} due to {1}")]
    ReadFile(PathBuf, io::Error),
    #[error("irregular file {0:?} filetype: {0:?}")]
    IrregularFile(PathBuf, FileType),
    #[error("non utf-8 path {0:?}")]
    NonUtf8Path(PathBuf),
    #[error("watching error {0}")]
    FileWatch(notify::Error),
    #[error("processor error {0}")]
    Processor(E),
    #[error("cannot canonicalize path {0:?}")]
    CanonicalizePath(PathBuf, io::Error),
}

async fn get_files<P: AsRef<Path>, E>(
    root_dir: P,
) -> Result<HashMap<String, (Mime, Vec<u8>)>, Error<E>> {
    let mut stack = Vec::new();
    let mut files = HashMap::new();
    stack.push(root_dir.as_ref().to_owned());
    while let Some(path) = stack.pop() {
        if path.is_dir() {
            let mut entries = fs::read_dir(&path)
                .await
                .map_err(|e| Error::ReadDir(path.to_owned(), e))?;
            while let Some(entry) = entries
                .next_entry()
                .await
                .map_err(|e| Error::ReadDir(path.to_owned(), e))?
            {
                stack.push(entry.path());
            }
        } else if path.is_file() {
            let mut file = fs::File::open(&path)
                .await
                .map_err(|e| Error::ReadFile(path.to_owned(), e))?;
            let mut content = Vec::new();
            file.read_to_end(&mut content)
                .await
                .map_err(|e| Error::ReadFile(path.to_owned(), e))?;
            let guessed_mime = infer::get(&content)
                .map(|t| t.mime_type())
                .unwrap_or("application/octet-stream");
            let guessed_mime: mime::Mime = guessed_mime.parse().unwrap();
            let path = path
                .to_str()
                .ok_or_else(|| Error::NonUtf8Path(path.to_owned()))?
                .to_owned();
            files.insert(path, (guessed_mime, content));
        } else {
            let metadata = fs::metadata(&path)
                .await
                .map_err(|e| Error::ReadDir(path.to_owned(), e))?;
            return Err(Error::IrregularFile(path.to_owned(), metadata.file_type()));
        }
    }
    Ok(files)
}

pub async fn get(
    AnyPath(path): AnyPath,
    extract::State(state): extract::State<Arc<State>>,
) -> impl IntoResponse {
    dbg!(&path);
    dbg!(state.files.read().await.keys());
    if let Some((mime, content)) = state.get(&path).await {
        (StatusCode::OK, TypedHeader(mime.into()), content.to_vec())
    } else {
        (
            StatusCode::NOT_FOUND,
            TypedHeader(ContentType::text()),
            Vec::new(),
        )
    }
}

#[derive(Clone)]
pub struct Filter {
    pub pass: Option<regex::Regex>,
    pub ignore: Option<regex::Regex>,
}

impl Filter {
    pub fn is_enable(&self, path: &str) -> bool {
        let pass = self
            .pass
            .as_ref()
            .map(|re| re.is_match(path))
            .unwrap_or(true);
        let ignore = self
            .ignore
            .as_ref()
            .map(|re| re.is_match(path))
            .unwrap_or(false);
        pass && !ignore
    }
}

#[derive(Clone)]
pub struct DirectoryLayer {
    pub src: PathBuf,
    pub dist: PathBuf,
    pub filter: Filter,
}

#[derive(Debug, Clone)]
pub enum Tag {
    Static(&'static str),
    Dynamic(String),
}

impl Tag {
    fn as_str(&self) -> &str {
        match self {
            Tag::Dynamic(s) => s.as_str(),
            Tag::Static(s) => s,
        }
    }
}

impl PartialEq for Tag {
    fn eq(&self, other: &Self) -> bool {
        self.as_str() == other.as_str()
    }
}

impl Eq for Tag {}

impl From<&'static str> for Tag {
    fn from(value: &'static str) -> Self {
        Self::Static(value)
    }
}

impl From<String> for Tag {
    fn from(value: String) -> Self {
        Self::Dynamic(value)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum Visibility {
    Published,
    Intermediate,
}

#[derive(Debug, Clone)]
pub enum ProcessorEventType {
    Inserted(Mime, Vec<u8>, Visibility),
    Notice(String),
    Removed,
}

#[derive(Debug, Clone)]
pub struct ProcessorOut {
    pub tag: Tag,
    pub event: ProcessorEventType,
    pub path: String,
    pub real_path: PathBuf,
}

#[async_trait::async_trait]
pub trait FileProcessor {
    type Context;
    type Error;
    async fn process(
        &self,
        ctx: &Self::Context,
        event: ProcessorOut,
    ) -> Result<Vec<ProcessorOut>, Self::Error>;
}

async fn watch_files_for_layer<E>(
    layer: DirectoryLayer,
    sender: mpsc::Sender<ProcessorOut>,
) -> Result<Box<dyn notify::Watcher>, Error<E>> {
    let root = layer
        .src
        .canonicalize()
        .map_err(|e| Error::CanonicalizePath(layer.src.clone(), e))?;
    let mut watcher = notify::recommended_watcher({
        let sender = sender.clone();
        let root = root.clone();
        let layer = layer.clone();
        move |event: Result<notify::Event, notify::Error>| match event {
            Ok(event) => {
                let kind = event.kind;
                for path in event.paths {
                    let real_path = path.clone();
                    let path = path
                        .strip_prefix(&root)
                        .expect("children of root must have root as prefix");
                    let path = layer.dist.join(path);
                    let Some(path) = path.to_str() else {
                        warn!(path=format!("{path:?}"), "non-utf8 path");
                        return;
                    };
                    if !layer.filter.is_enable(path) {
                        return;
                    }
                    dbg!(&path);
                    match kind {
                        notify::EventKind::Remove(_) => {
                            sender
                                .blocking_send(ProcessorOut {
                                    tag: "builtin:file_remove".into(),
                                    event: ProcessorEventType::Notice("removed".to_owned()),
                                    path: path.to_owned(),
                                    real_path,
                                })
                                .unwrap();
                        }
                        _ => {
                            sender
                                .blocking_send(ProcessorOut {
                                    tag: "builtin:file_modify".into(),
                                    event: ProcessorEventType::Notice("modified".to_owned()),
                                    path: path.to_owned(),
                                    real_path,
                                })
                                .unwrap();
                        }
                    }
                }
            }
            Err(e) => {
                error!(err = e.to_string(), "file_watch_error");
            }
        }
    })
    .map_err(Error::FileWatch)?;
    watcher
        .watch(&root, notify::RecursiveMode::Recursive)
        .map_err(Error::FileWatch)?;
    let files = get_files(&root).await?;
    let root_str = root
        .to_str()
        .ok_or_else(|| Error::NonUtf8Path(root.clone()))?;
    let dist_str = layer
        .dist
        .to_str()
        .ok_or_else(|| Error::NonUtf8Path(root.clone()))?;
    for (path, _) in files {
        if !layer.filter.is_enable(&path) {
            continue;
        }
        let real_path = PathBuf::from(path.clone());
        let path = path
            .strip_prefix(root_str)
            .expect("children must have root as prefix");
        let path = format!("{dist_str}{path}");
        dbg!(&path);
        sender
            .send(ProcessorOut {
                tag: "builtin:file_modify".into(),
                event: ProcessorEventType::Notice("modified".to_owned()),
                path,
                real_path,
            })
            .await
            .unwrap();
    }
    Ok(Box::new(watcher))
}

pub mod utilities {
    use std::{ffi::OsStr, marker::PhantomData, os::unix::prelude::OsStrExt};

    use itertools::Itertools;
    use tokio::{fs, io::AsyncReadExt};
    use tracing::{debug, info};

    use crate::dev_server::ProcessorEventType;

    use super::{FileProcessor, Filter, ProcessorOut, Visibility};

    pub struct FileLoader<C, E, F> {
        _phantom1: PhantomData<C>,
        _phantom2: PhantomData<E>,
        err: F,
        filter: Filter,
        visibility: Visibility,
    }

    impl<C, E, F: Fn(std::io::Error) -> E> FileLoader<C, E, F> {
        pub fn new(filter: Filter, visibility: Visibility, err: F) -> Self {
            Self {
                _phantom1: PhantomData::default(),
                _phantom2: PhantomData::default(),
                filter,
                visibility,
                err,
            }
        }
    }

    #[async_trait::async_trait]
    impl<C: Sync, E: Sync, F: Fn(std::io::Error) -> E + Sync> FileProcessor for FileLoader<C, E, F> {
        type Context = C;
        type Error = E;

        async fn process(
            &self,
            _ctx: &Self::Context,
            event: ProcessorOut,
        ) -> Result<Vec<super::ProcessorOut>, Self::Error> {
            if matches!(&event.event, ProcessorEventType::Notice(tag) if tag == "modified")
                && event.tag == "builtin:file_modify".into()
            {
                if !self.filter.is_enable(&event.path) {
                    return Ok(Vec::new());
                }
                let mut file = fs::File::open(&event.real_path).await.map_err(&self.err)?;
                let mut buf = Vec::new();
                file.read_to_end(&mut buf).await.map_err(&self.err)?;
                let mime = if event.real_path.extension()
                    == Some(OsStr::from_bytes("css".as_bytes()))
                {
                    info!("CSS");
                    mime::TEXT_CSS
                } else if event.real_path.extension() == Some(OsStr::from_bytes("js".as_bytes())) {
                    info!("JS");
                    mime::APPLICATION_JAVASCRIPT
                } else {
                    mime::APPLICATION_OCTET_STREAM
                };
                return Ok(vec![ProcessorOut {
                    tag: "builtin-util:file_read".into(),
                    event: ProcessorEventType::Inserted(mime, buf, self.visibility),
                    path: event.path,
                    real_path: event.real_path,
                }]);
            }
            Ok(Vec::new())
        }
    }

    pub struct LogProcessor<C: Sync, E: Sync> {
        _phantom1: PhantomData<C>,
        _phantom2: PhantomData<E>,
    }

    impl<C: Sync, E: Sync> Default for LogProcessor<C, E> {
        fn default() -> Self {
            Self {
                _phantom1: PhantomData::default(),
                _phantom2: PhantomData::default(),
            }
        }
    }

    #[async_trait::async_trait]
    impl<C: Sync, E: Sync> FileProcessor for LogProcessor<C, E> {
        type Context = C;

        type Error = E;

        async fn process(
            &self,
            _ctx: &Self::Context,
            event: ProcessorOut,
        ) -> Result<Vec<super::ProcessorOut>, Self::Error> {
            let path = &event.path;
            let tag = &event.tag;
            match &event.event {
                ProcessorEventType::Inserted(mime, content, visibility) => {
                    if let Ok(content) = std::str::from_utf8(content) {
                        let content = content.chars().take(10).join("");
                        debug!(
                            tag = format!("{tag:?}"),
                            path = path,
                            mime = mime.to_string(),
                            content = content,
                            visibility = format!("{visibility:?}"),
                            "inserted"
                        );
                    } else {
                        debug!(
                            tag = format!("{tag:?}"),
                            path = path,
                            mime = mime.to_string(),
                            content = format!("<binary>"),
                            "inserted"
                        );
                    }
                }
                ProcessorEventType::Notice(msg) => {
                    debug!(tag = format!("{tag:?}"), path = path, msg = msg, "notice");
                }
                ProcessorEventType::Removed => {
                    debug!(tag = format!("{tag:?}"), path = path, "removed");
                }
            }
            Ok(Vec::new())
        }
    }
}

pub async fn watch_files<C: Sync, E: Sync, I: IntoIterator<Item = DirectoryLayer>>(
    state: Arc<State>,
    ctx: C,
    layers: I,
    processors: Vec<Box<dyn FileProcessor<Context = C, Error = E>>>,
) -> Result<(), Error<E>> {
    let (tx, mut rx) = mpsc::channel(1024);
    let mut watchers = Vec::new();
    for layer in layers {
        watchers.push(watch_files_for_layer(layer, tx.clone()).await?);
    }
    while let Some(event) = rx.recv().await {
        for processor in &processors {
            let result = processor
                .process(&ctx, event.clone())
                .await
                .map_err(Error::Processor)?;
            for out in result {
                if let ProcessorEventType::Inserted(mime, content, Visibility::Published) =
                    &out.event
                {
                    dbg!(&event.path);
                    state
                        .files
                        .write()
                        .await
                        .insert(out.path.clone(), (mime.clone(), content.clone()));
                }
                tx.send(out).await.unwrap();
            }
        }
    }
    Ok(())
}
