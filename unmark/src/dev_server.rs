use std::{
    collections::HashMap,
    fmt::Debug,
    fs::FileType,
    io,
    path::{Path, PathBuf},
    sync::Arc,
};

use futures::StreamExt;
use itertools::Itertools;
use mime::Mime;
use notify::Watcher;
use regex::Regex;
use tokio::{
    fs,
    io::AsyncReadExt,
    sync::{mpsc, RwLock},
};
use tracing::{error, warn};

type Files = RwLock<HashMap<PathBuf, (Mime, Arc<Vec<u8>>)>>;

pub struct State {
    pub files: Files,
}

impl Default for State {
    fn default() -> Self {
        Self {
            files: RwLock::new(HashMap::new()),
        }
    }
}

impl State {}

pub struct AnyPath(String);

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
    #[error("message queue overflow")]
    MsgQueueOverflow,
}

async fn get_files<P: AsRef<Path>, E>(
    root_dir: P,
) -> Result<HashMap<PathBuf, (Mime, Vec<u8>)>, Error<E>> {
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
            let mime = mime_guess::from_path(&path).first_or_octet_stream();
            files.insert(path, (mime, content));
        } else {
            let metadata = fs::metadata(&path)
                .await
                .map_err(|e| Error::ReadDir(path.to_owned(), e))?;
            return Err(Error::IrregularFile(path.to_owned(), metadata.file_type()));
        }
    }
    Ok(files)
}

#[derive(Clone)]
pub struct Filter {
    pub pass: Option<regex::Regex>,
    pub ignore: Option<regex::Regex>,
}

impl Filter {
    pub fn is_enable<P: AsRef<Path>>(&self, path: P) -> bool {
        let Some(path_str) = path.as_ref().to_str() else {
            warn!(path=format!("{:?}", path.as_ref()), "non_utf-8_path");
            return false;
        };
        let pass = self
            .pass
            .as_ref()
            .map(|re| re.is_match(path_str))
            .unwrap_or(true);
        let ignore = self
            .ignore
            .as_ref()
            .map(|re| re.is_match(path_str))
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

/// Reserved tag
/// * `builtin:file_modify`
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
pub enum EventType<T> {
    FileInserted {
        mime: Mime,
        content: Arc<Vec<u8>>,
        visibility: Visibility,
    },
    FileChanged,
    Notice(T),
    Removed,
}

#[derive(Debug, Clone)]
pub struct Event<T> {
    pub tag: Tag,
    pub event_type: EventType<T>,
    pub out_path: PathBuf,
    pub src_path: PathBuf,
}

impl<T> Event<T> {
    pub fn get_inserted_file_by_out_path(&self, re: &Regex) -> Option<(&Mime, &[u8], Visibility)> {
        let Some(str_path)  = self.out_path.to_str() else {
            return None;
        };
        if !re.is_match(str_path) {
            return None;
        }
        let EventType::FileInserted {
            mime,
            content,
            visibility,
        } = &self.event_type else { return None };
        Some((mime, content.as_ref(), *visibility))
    }
}

#[async_trait::async_trait]
pub trait Processor<T> {
    type Context;
    type Error;
    async fn process(
        &self,
        ctx: &Self::Context,
        event: Event<T>,
    ) -> Result<Vec<Event<T>>, Self::Error>;
}

async fn watch_files_on_layer<E, T: 'static + Send + std::fmt::Debug>(
    layer: DirectoryLayer,
    sender: mpsc::Sender<Event<T>>,
) -> Result<Box<dyn notify::Watcher>, Error<E>> {
    let watch_root = layer
        .src
        .canonicalize()
        .map_err(|e| Error::CanonicalizePath(layer.src.clone(), e))?;
    let mut watcher = notify::recommended_watcher({
        let sender = sender.clone();
        let root = watch_root.clone();
        let layer = layer.clone();
        move |event: Result<notify::Event, notify::Error>| match event {
            Ok(event) => match event.kind {
                notify::EventKind::Modify(_) | notify::EventKind::Create(_) => {
                    for path in event.paths {
                        let rel_path = path
                            .strip_prefix(&root)
                            .expect("children of root must have root as prefix");
                        let out_path = layer.dist.join(rel_path);
                        sender
                            .blocking_send(Event {
                                tag: "builtin:file_watch".into(),
                                event_type: EventType::FileChanged,
                                out_path,
                                src_path: path,
                            })
                            .expect("message queue overflow");
                    }
                }
                notify::EventKind::Remove(_) => {
                    for path in event.paths {
                        let rel_path = path
                            .strip_prefix(&root)
                            .expect("children of root must have root as prefix");
                        let out_path = layer.dist.join(rel_path);
                        sender
                            .blocking_send(Event {
                                tag: "builtin:file_watch".into(),
                                event_type: EventType::Removed,
                                out_path,
                                src_path: path,
                            })
                            .expect("message queue overflow");
                    }
                }
                // ignore
                notify::EventKind::Any
                | notify::EventKind::Access(_)
                | notify::EventKind::Other => (),
            },
            Err(e) => {
                warn!(err = e.to_string(), "file_watch");
            }
        }
    })
    .map_err(Error::FileWatch)?;
    watcher
        .watch(&watch_root, notify::RecursiveMode::Recursive)
        .map_err(Error::FileWatch)?;
    for (path, (_, _)) in get_files(&watch_root).await? {
        let out_path = path
            .strip_prefix(&watch_root)
            .expect("children must have root as prefix");
        let out_path = layer.dist.join(out_path);
        sender
            .blocking_send(Event {
                tag: "builtin:file_watch".into(),
                event_type: EventType::FileChanged,
                out_path,
                src_path: path,
            })
            .expect("message queue overflow");
    }
    Ok(Box::new(watcher))
}

pub async fn watch_files<
    D: IntoIterator<Item = DirectoryLayer>,
    P: IntoIterator<Item = Box<dyn Processor<T, Context = C, Error = E> + Send + Sync>>,
    C: Send + Sync + 'static,
    E: Send + Sync + 'static,
    T: 'static + Clone + Send + Sync + Debug,
>(
    state: Arc<State>,
    initial_context: C,
    layers: D,
    processors: P,
) -> Result<(), Error<E>> {
    let (tx, mut rx) = mpsc::channel::<Event<T>>(1024);
    let layers = futures::stream::iter(layers);
    let _watchers = layers
        .then(|layer| watch_files_on_layer::<E, T>(layer, tx.clone()))
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .collect::<Result<Vec<_>, _>>()?;
    let processors = processors.into_iter().collect_vec();
    tokio::task::spawn(async move {
        while let Some(event) = rx.recv().await {
            for processor in &processors {
                for out in processor
                    .process(&initial_context, event.clone())
                    .await
                    .map_err(Error::Processor)?
                {
                    match &out.event_type {
                        EventType::Removed => {
                            state.files.write().await.remove(&out.out_path);
                        }
                        EventType::FileInserted {
                            mime,
                            content,
                            visibility: Visibility::Published,
                        } => {
                            state
                                .files
                                .write()
                                .await
                                .insert(out.out_path.clone(), (mime.clone(), content.clone()));
                        }
                        _ => (),
                    }
                    tx.send(out).await.expect("msg queue overflow");
                }
            }
        }
        Ok::<(), Error<E>>(())
    });

    unimplemented!()
}
