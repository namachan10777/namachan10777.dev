use maplit::hashset;
use regex::Regex;
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, HashSet},
    os::unix::prelude::OsStrExt,
    path::{Path, PathBuf},
    time::Instant,
};
use tokio::fs;
use tracing::{debug, info};

use generic_array::GenericArray;

#[derive(Clone)]
pub struct Blob {
    pub content: Vec<u8>,
    pub mime: mime::Mime,
    pub publish: bool,
    hash: Hash,
}

impl Blob {
    pub fn new(content: Vec<u8>, mime: mime::Mime, publish: bool) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(&content);
        Self {
            content,
            mime,
            publish,
            hash: hasher.finalize(),
        }
    }
}

pub trait Build {
    type Error;
    fn io_expect(&self) -> (Vec<PathBuf>, Vec<PathBuf>);
    fn build(&self, tree: &HashMap<&Path, &Blob>) -> Result<HashMap<PathBuf, Blob>, Self::Error>;
}

type BoxedBuild<E> = Box<dyn Build<Error = E>>;

pub trait Rule {
    type Error;
    fn builds(
        &self,
        tree: &HashMap<PathBuf, Blob>,
    ) -> Result<Vec<BoxedBuild<Self::Error>>, Self::Error>;
}

type Hash = GenericArray<u8, generic_array::typenum::consts::U32>;

struct CacheEntry {
    blobs: HashMap<PathBuf, Blob>,
    input_hash: Hash,
}

pub struct Cache {
    entries: HashMap<Hash, CacheEntry>,
}

impl Cache {
    pub fn empty() -> Self {
        Self {
            entries: Default::default(),
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum Error<E> {
    #[error("no entry for {0:?}")]
    NoEntry(PathBuf),
    #[error("build error: {0:?}")]
    Build(E),
    #[error("output path not matched {0:?}, {1:?}")]
    OutputPathNotMatched(Vec<PathBuf>, Vec<PathBuf>),
}

fn cache_key<P: AsRef<Path>, I: Iterator<Item = P>>(paths: I) -> Hash {
    let mut hasher = Sha256::new();
    let mut paths: Vec<_> = paths.map(|p| p.as_ref().to_owned()).collect();
    paths.sort();
    for path in paths {
        hasher.update(path.as_os_str().as_bytes());
    }
    hasher.finalize()
}

pub struct DirMap<F> {
    pub src: PathBuf,
    pub dst: PathBuf,
    pub filter: F,
    pub publish: bool,
}

impl DirMap<Box<dyn Fn(&Path) -> bool + Send + Sync + 'static>> {
    pub fn new_by_re(src: PathBuf, dst: PathBuf, re: Regex, publish: bool) -> Self {
        Self {
            src,
            dst,
            filter: Box::new(move |path| re.is_match(path.to_str().unwrap())),
            publish,
        }
    }
}

async fn glob<P: AsRef<Path>>(root: P) -> std::io::Result<HashSet<PathBuf>> {
    if root.as_ref().is_file() {
        return Ok(hashset! {root.as_ref().to_owned()});
    }
    let mut dirs = vec![root.as_ref().to_owned()];
    let mut files = HashSet::new();
    while let Some(dir) = dirs.pop() {
        let mut entries = fs::read_dir(&dir).await?;
        while let Some(entry) = entries.next_entry().await? {
            let filetype = entry.file_type().await?;
            if filetype.is_dir() {
                dirs.push(entry.path());
            } else if filetype.is_file() {
                files.insert(entry.path());
            }
        }
    }
    Ok(files)
}

pub async fn static_load(dirs: &[BoxedDirMap]) -> std::io::Result<HashMap<PathBuf, Blob>> {
    let mut tree = HashMap::new();
    for dir in dirs {
        for path in glob(&dir.src).await? {
            if !(dir.filter)(&path) {
                continue;
            }
            let content = std::fs::read(&path)?;
            let mime = mime_guess::from_path(&path).first_or_octet_stream();
            let path = dir.dst.join(path.strip_prefix(&dir.src).unwrap());
            tree.insert(path, Blob::new(content, mime, dir.publish));
        }
    }
    Ok(tree)
}

// 出力のハッシュ値をキーにしてキャッシュを作成
// builder.io_expectで入出力パスを取得してキャッシュキーを作成
// 既にキャッシュが存在し、入力のハッシュが一致していた場合はキャッシュを利用
pub fn build<E>(
    cache: &mut Cache,
    mut tree: HashMap<PathBuf, Blob>,
    rules: &[Box<dyn Rule<Error = E> + Send + Sync + 'static>],
) -> Result<HashMap<PathBuf, Blob>, Error<E>> {
    for rule in rules {
        let builds = rule.builds(&tree).map_err(Error::Build)?;
        for build in builds {
            let (mut input_paths, output_paths) = build.io_expect();
            input_paths.sort();
            // 出力のキャッシュキーを計算
            let output_key = cache_key(output_paths.iter());
            let mut input_hasher = Sha256::new();
            let mut ref_tree = HashMap::new();
            for path in &input_paths {
                // 入力のハッシュを計算
                let entry = tree.get(path).ok_or_else(|| Error::NoEntry(path.clone()))?;
                input_hasher.update(entry.hash);
                ref_tree.insert(path.as_ref(), entry);
            }
            let input_hash = input_hasher.finalize();
            // キャッシュが存在
            if let Some(cache) = cache.entries.get(&output_key) {
                // 入力とキャッシュの入力が一致
                if cache.input_hash == input_hash {
                    info!(path = format!("{output_paths:?}"), "cache_hit");
                    // ツリーをキャッシュから書く
                    for (path, blob) in &cache.blobs {
                        tree.insert(path.clone(), blob.clone());
                    }
                    continue;
                }
            }

            let sw = Instant::now();
            // キャッシュにヒットしなかったので計算
            let output = build.build(&ref_tree).map_err(Error::Build)?;
            info!(
                path = format!("{output_paths:?}"),
                time_ms = sw.elapsed().as_millis(),
                "build"
            );
            if output_key != cache_key(output.keys()) {
                return Err(Error::OutputPathNotMatched(
                    output_paths,
                    output.keys().cloned().collect(),
                ));
            }
            // キャッシュに保存
            cache.entries.insert(
                output_key,
                CacheEntry {
                    blobs: output.clone(),
                    input_hash,
                },
            );
            // ツリーに書く
            for (path, blob) in output {
                tree.insert(path, blob);
            }
        }
    }
    for path in tree.keys() {
        debug!(path = format!("{path:?}"), "built_file");
    }
    Ok(tree)
}

pub type BoxedDirMap = DirMap<Box<dyn Fn(&Path) -> bool + 'static + Send + Sync>>;

pub mod dev_server {
    use std::{collections::HashMap, io, net::SocketAddr, path::PathBuf, sync::Arc};

    use axum::{
        extract::{FromRequest, State},
        headers::ContentType,
        http::StatusCode,
        Router, TypedHeader,
    };
    use notify::{Event, Watcher};
    use tokio::{
        fs,
        sync::{mpsc, RwLock},
    };
    use tracing::{error, warn};

    use super::{static_load, Blob, BoxedDirMap, Cache, Rule};

    struct AnyPath(PathBuf);

    #[async_trait::async_trait]
    impl<S, B: Send + Sync + 'static> FromRequest<S, B> for AnyPath {
        type Rejection = ();

        async fn from_request(req: axum::http::Request<B>, _: &S) -> Result<Self, Self::Rejection> {
            Ok(Self(req.uri().path().to_owned().into()))
        }
    }

    #[derive(Debug)]
    enum FsEvent {
        Insert { src: PathBuf, dst: PathBuf },
        Remove { dst: PathBuf },
    }

    async fn watch_dir(
        dir: BoxedDirMap,
        tx: mpsc::Sender<FsEvent>,
    ) -> Result<impl Watcher, notify::Error> {
        let root = dir.src.clone();
        let src = dir.src.canonicalize().unwrap();
        let mut watcher = notify::recommended_watcher(move |event| match event {
            Ok(Event {
                kind: notify::EventKind::Create(_) | notify::EventKind::Modify(_),
                paths,
                ..
            }) => {
                for path in paths {
                    if !(dir.filter)(&path) {
                        continue;
                    }
                    let Ok(path) = path.canonicalize() else {
                        return;
                    };
                    let dst = dir.dst.join(path.strip_prefix(&src).unwrap());
                    if let Err(e) = tx.blocking_send(FsEvent::Insert { src: path, dst }) {
                        warn!(error = e.to_string(), "fs_event_queue");
                    }
                }
            }
            Ok(Event {
                kind: notify::EventKind::Remove(_),
                paths,
                ..
            }) => {
                for path in paths {
                    if !(dir.filter)(&path) {
                        continue;
                    }
                    let dst = dir.dst.join(path.strip_prefix(&dir.src).unwrap());
                    if let Err(e) = tx.blocking_send(FsEvent::Remove { dst }) {
                        warn!(error = e.to_string(), "fs_event_queue");
                    }
                }
            }
            Ok(_) => {}
            Err(e) => {
                warn!(error = format!("{e}"), "watch_error");
            }
        })?;
        watcher.watch(&root, notify::RecursiveMode::Recursive)?;
        Ok(watcher)
    }

    async fn process_fs_event(tree: &mut HashMap<PathBuf, Blob>, event: FsEvent) -> io::Result<()> {
        match event {
            FsEvent::Insert { src, dst } => {
                let content = fs::read(&src).await?;
                let mime = mime_guess::from_path(&src).first_or_octet_stream();
                let blob = Blob::new(content, mime, false);
                tree.insert(dst, blob);
            }
            FsEvent::Remove { dst, .. } => {
                tree.remove(&dst);
            }
        }
        Ok(())
    }

    async fn continuous_build<E>(
        cache: &mut Cache,
        mut src_tree: HashMap<PathBuf, Blob>,
        mut fs_events: mpsc::Receiver<FsEvent>,
        state: Arc<FileState>,
        rules: &[Box<dyn Rule<Error = E> + Send + Sync + 'static>],
    ) -> Result<(), Error<E>> {
        while let Some(event) = fs_events.recv().await {
            process_fs_event(&mut src_tree, event)
                .await
                .map_err(Error::FsError)?;
            while let Ok(event) = fs_events.try_recv() {
                process_fs_event(&mut src_tree, event)
                    .await
                    .map_err(Error::FsError)?;
            }
            let tree = super::build(cache, src_tree.clone(), rules).map_err(Error::Build)?;
            *state.tree.write().await = tree;
        }
        Ok(())
    }

    #[derive(Debug, thiserror::Error)]
    pub enum Error<E> {
        #[error("network error: {0}")]
        Network(Box<dyn std::error::Error + 'static + Send + Sync>),
        #[error("build error: {0}")]
        Build(super::Error<E>),
        #[error("fs error: {0}")]
        FsError(std::io::Error),
    }

    struct FileState {
        tree: RwLock<HashMap<PathBuf, Blob>>,
    }

    async fn file(
        State(state): State<Arc<FileState>>,
        AnyPath(path): AnyPath,
    ) -> (StatusCode, TypedHeader<ContentType>, Vec<u8>) {
        if let Some(blob) = state.tree.read().await.get(&path) {
            (
                StatusCode::OK,
                TypedHeader(ContentType::from(blob.mime.clone())),
                blob.content.clone(),
            )
        } else {
            (
                StatusCode::NOT_FOUND,
                TypedHeader(ContentType::text()),
                b"Not Found".to_vec(),
            )
        }
    }

    pub async fn serve<E: Send + Sync + 'static>(
        addr: &SocketAddr,
        dirs: Vec<BoxedDirMap>,
        rules: Vec<Box<dyn Rule<Error = E> + 'static + Send + Sync>>,
    ) -> Result<(), Error<E>> {
        let mut cache = Cache::empty();
        let src_tree = static_load(&dirs).await.map_err(Error::FsError)?;
        let tree = super::build(&mut cache, src_tree.clone(), &rules).map_err(Error::Build)?;
        let state = Arc::new(FileState {
            tree: RwLock::new(tree),
        });
        let (tx, rx) = mpsc::channel(1024);
        let mut watchers = Vec::new();
        for dir in dirs {
            watchers.push(watch_dir(dir, tx.clone()).await);
        }
        let state_for_build = state.clone();
        tokio::spawn(async move {
            let _ = continuous_build(&mut cache, src_tree, rx, state_for_build, &rules).await;
        });
        let app = Router::new()
            .fallback(axum::routing::get(file))
            .with_state(state.clone());
        axum::Server::bind(addr)
            .serve(app.into_make_service())
            .with_graceful_shutdown(async {
                let _ = tokio::signal::ctrl_c().await;
            })
            .await
            .map_err(|e| Error::Network(Box::new(e)))?;
        Ok(())
    }
}

pub mod util {
    use std::{
        collections::HashMap,
        path::{Path, PathBuf},
    };

    use maplit::hashmap;
    use regex::Regex;

    use super::{Blob, Build, Rule};

    pub trait MapRule {
        type Error;
        fn out_path(&self, path: &std::path::Path) -> std::path::PathBuf;
        fn build(&self, path: &std::path::Path, blog: &Blob) -> Result<Blob, Self::Error>;
    }

    #[derive(Clone)]
    struct MapRuleImpl<R> {
        re: Regex,
        rule: R,
    }

    #[derive(Clone)]
    struct MapBuild<R> {
        demand: PathBuf,
        out: PathBuf,
        rule: R,
    }

    pub fn map_rule<E, R: 'static + Send + Sync + Clone + MapRule<Error = E>>(
        rule: R,
        re: Regex,
    ) -> Box<dyn Rule<Error = E> + Send + Sync + 'static> {
        Box::new(MapRuleImpl { re, rule })
    }

    impl<E, R: MapRule<Error = E>> Build for MapBuild<R> {
        type Error = E;
        fn build(
            &self,
            tree: &std::collections::HashMap<&std::path::Path, &super::Blob>,
        ) -> Result<std::collections::HashMap<PathBuf, super::Blob>, Self::Error> {
            let out = self
                .rule
                .build(&self.demand, tree.get(&self.demand.as_ref()).unwrap())?;
            Ok(hashmap! {self.out.clone() => out})
        }

        fn io_expect(&self) -> (Vec<PathBuf>, Vec<PathBuf>) {
            (vec![self.demand.clone()], vec![self.out.clone()])
        }
    }

    impl<E, R: 'static + Clone + MapRule<Error = E>> Rule for MapRuleImpl<R> {
        type Error = E;
        fn builds(
            &self,
            tree: &std::collections::HashMap<std::path::PathBuf, super::Blob>,
        ) -> Result<Vec<Box<dyn super::Build<Error = Self::Error>>>, Self::Error> {
            Ok(tree
                .iter()
                .flat_map(|(path, _)| {
                    if self.re.is_match(&path.to_string_lossy()) {
                        let build: Box<dyn Build<Error = E>> = Box::new(MapBuild {
                            demand: path.clone(),
                            out: self.rule.out_path(path),
                            rule: self.rule.clone(),
                        });
                        Some(build)
                    } else {
                        None
                    }
                })
                .collect())
        }
    }

    pub trait MapWithDeps {
        type Error;
        fn out_path(&self, path: &std::path::Path) -> std::path::PathBuf;
        fn deps(&self, path: &std::path::Path, blob: &Blob) -> Vec<PathBuf>;
        fn build(
            &self,
            path: &std::path::Path,
            blob: &HashMap<&Path, &Blob>,
        ) -> Result<Blob, Self::Error>;
    }

    struct MapWithDepsBuild<R> {
        rule: R,
        src: PathBuf,
        demands: Vec<PathBuf>,
        out: PathBuf,
    }

    struct MapWithDepsImpl<R> {
        re: Regex,
        rule: R,
    }

    impl<E, R: 'static + Clone + MapWithDeps<Error = E>> Build for MapWithDepsBuild<R> {
        type Error = E;

        fn io_expect(&self) -> (Vec<PathBuf>, Vec<PathBuf>) {
            (self.demands.clone(), vec![self.out.clone()])
        }

        fn build(
            &self,
            tree: &HashMap<&Path, &Blob>,
        ) -> Result<HashMap<PathBuf, Blob>, Self::Error> {
            Ok(hashmap! { self.out.clone() => self.rule.build(&self.src, tree)? })
        }
    }

    impl<E, R: 'static + Clone + MapWithDeps<Error = E>> Rule for MapWithDepsImpl<R> {
        type Error = E;
        fn builds(
            &self,
            tree: &std::collections::HashMap<std::path::PathBuf, super::Blob>,
        ) -> Result<Vec<Box<dyn super::Build<Error = Self::Error>>>, Self::Error> {
            Ok(tree
                .iter()
                .flat_map(|(path, _)| {
                    if self.re.is_match(&path.to_string_lossy()) {
                        let mut demands = self.rule.deps(path, tree.get(path).unwrap());
                        demands.push(path.clone());
                        let build: Box<dyn Build<Error = E>> = Box::new(MapWithDepsBuild {
                            rule: self.rule.clone(),
                            src: path.clone(),
                            demands,
                            out: self.rule.out_path(path),
                        });
                        Some(build)
                    } else {
                        None
                    }
                })
                .collect())
        }
    }

    pub fn map_with_dep<E, R: 'static + Send + Sync + Clone + MapWithDeps<Error = E>>(
        rule: R,
        re: Regex,
    ) -> Box<dyn Rule<Error = E> + Send + Sync + 'static> {
        Box::new(MapWithDepsImpl { re, rule })
    }

    pub trait Aggregate {
        type Error;
        fn demands(&self, tree: &HashMap<PathBuf, Blob>) -> Vec<PathBuf>;
        fn out(&self, tree: &HashMap<PathBuf, Blob>) -> PathBuf;
        fn build(
            &self,
            tree: &std::collections::HashMap<&Path, &Blob>,
        ) -> Result<Blob, Self::Error>;
    }

    struct AggregateImpl<R> {
        rule: R,
    }

    struct AggregateBuild<R> {
        rule: R,
        demands: Vec<PathBuf>,
        out: PathBuf,
    }

    impl<E, R: 'static + Clone + Aggregate<Error = E>> Build for AggregateBuild<R> {
        type Error = E;

        fn io_expect(&self) -> (Vec<PathBuf>, Vec<PathBuf>) {
            (self.demands.clone(), vec![self.out.clone()])
        }

        fn build(
            &self,
            tree: &HashMap<&Path, &Blob>,
        ) -> Result<HashMap<PathBuf, Blob>, Self::Error> {
            let blob = self.rule.build(tree)?;
            Ok(hashmap! {self.out.clone() => blob})
        }
    }

    impl<E, R: 'static + Clone + Aggregate<Error = E>> Rule for AggregateImpl<R> {
        type Error = E;

        fn builds(
            &self,
            tree: &std::collections::HashMap<PathBuf, Blob>,
        ) -> Result<Vec<Box<dyn Build<Error = Self::Error>>>, Self::Error> {
            Ok(vec![Box::new(AggregateBuild {
                rule: self.rule.clone(),
                out: self.rule.out(tree),
                demands: self.rule.demands(tree),
            })])
        }
    }

    pub fn aggregate<E, R: 'static + Send + Sync + Clone + Aggregate<Error = E>>(
        rule: R,
    ) -> Box<dyn Rule<Error = E> + Send + Sync + 'static> {
        Box::new(AggregateImpl { rule })
    }

    pub trait Spread {
        type Error;
        fn out_path(&self, path: &std::path::Path, blog: &Blob) -> Vec<std::path::PathBuf>;
        fn build(
            &self,
            path: &std::path::Path,
            blog: &Blob,
        ) -> Result<HashMap<PathBuf, Blob>, Self::Error>;
    }

    struct SpreadImpl<R> {
        re: Regex,
        rule: R,
    }

    struct SpreadBuild<R> {
        rule: R,
        out: Vec<PathBuf>,
        src: PathBuf,
    }

    impl<E, R: Spread<Error = E>> Build for SpreadBuild<R> {
        type Error = E;
        fn build(
            &self,
            tree: &HashMap<&Path, &Blob>,
        ) -> Result<HashMap<PathBuf, Blob>, Self::Error> {
            self.rule
                .build(&self.src, tree.get(&self.src.as_ref()).unwrap())
        }
        fn io_expect(&self) -> (Vec<PathBuf>, Vec<PathBuf>) {
            (vec![self.src.clone()], self.out.clone())
        }
    }

    impl<E, R: 'static + Send + Sync + Clone + Spread<Error = E>> Rule for SpreadImpl<R> {
        type Error = E;
        fn builds(
            &self,
            tree: &HashMap<PathBuf, Blob>,
        ) -> Result<Vec<Box<dyn Build<Error = Self::Error>>>, Self::Error> {
            Ok(tree
                .iter()
                .flat_map(|(path, blob)| {
                    if self.re.is_match(&path.to_string_lossy()) {
                        let build: Box<dyn Build<Error = E>> = Box::new(SpreadBuild {
                            src: path.clone(),
                            out: self.rule.out_path(path, blob),
                            rule: self.rule.clone(),
                        });
                        Some(build)
                    } else {
                        None
                    }
                })
                .collect())
        }
    }

    pub fn spread<E, R: 'static + Send + Sync + Clone + Spread<Error = E>>(
        re: Regex,
        rule: R,
    ) -> Box<dyn Rule<Error = E> + Send + Sync + 'static> {
        Box::new(SpreadImpl { rule, re })
    }

    pub struct Publish<E>(std::marker::PhantomData<E>);

    impl<E> Clone for Publish<E> {
        fn clone(&self) -> Self {
            Self(Default::default())
        }
    }

    impl<E> MapRule for Publish<E> {
        type Error = E;

        fn out_path(&self, path: &std::path::Path) -> std::path::PathBuf {
            path.to_path_buf()
        }

        fn build(&self, _: &std::path::Path, blob: &Blob) -> Result<Blob, Self::Error> {
            Ok(Blob::new(blob.content.clone(), blob.mime.clone(), true))
        }
    }

    pub fn publish<E: Send + Sync + 'static>(
        re: Regex,
    ) -> Box<dyn Rule<Error = E> + Send + Sync + 'static> {
        map_rule(Publish(Default::default()), re)
    }
}

#[cfg(test)]
mod test {
    use std::path::PathBuf;

    use super::{
        util::{map_rule, MapRule},
        Blob,
    };
    use maplit::hashmap;
    use regex::Regex;

    #[derive(Clone)]
    struct Upper;

    impl MapRule for Upper {
        type Error = anyhow::Error;

        fn out_path(&self, path: &std::path::Path) -> std::path::PathBuf {
            path.with_extension("txt")
        }

        fn build(&self, _path: &std::path::Path, blob: &Blob) -> Result<Blob, Self::Error> {
            Ok(Blob::new(
                String::from_utf8_lossy(&blob.content)
                    .to_uppercase()
                    .as_bytes()
                    .to_owned(),
                blob.mime.clone(),
                true,
            ))
        }
    }

    #[test]
    fn build() {
        use tracing_subscriber::prelude::*;
        tracing_subscriber::registry()
            .with(tracing_subscriber::fmt::layer())
            .with(tracing_subscriber::EnvFilter::from_default_env())
            .init();
        let mut cache = super::Cache::empty();
        let src_tree = hashmap! {
            "test.txt".into() => super::Blob::new("Hello World!".as_bytes().to_vec(), mime::TEXT_PLAIN_UTF_8, true),
        };
        let rules = vec![map_rule(Upper, Regex::new(r#"^.+\.txt$"#).unwrap())];
        let tree = super::build(&mut cache, src_tree.clone(), &rules).unwrap();
        let key: PathBuf = "test.txt".into();
        assert_eq!(
            String::from_utf8_lossy(&tree.get(&key).unwrap().content),
            "HELLO WORLD!"
        );
        let rules = vec![map_rule(Upper, Regex::new(r#"^.+\.txt$"#).unwrap())];
        let tree = super::build(&mut cache, src_tree, &rules).unwrap();
        assert_eq!(
            String::from_utf8_lossy(&tree.get(&key).unwrap().content),
            "HELLO WORLD!"
        );
    }
}
