use std::{
    collections::HashMap,
    fs,
    io::Read,
    path::{Path, PathBuf},
};

use regex::Regex;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Blob {
    pub content: Vec<u8>,
    pub mime: mime::Mime,
    pub publish: bool,
}

pub type Tree = HashMap<PathBuf, Blob>;

pub trait Rule {
    type Error;
    fn build(&self, tree: &Tree) -> Result<Tree, Self::Error>;
}

pub trait OneToOneRule {
    type Error;
    fn build(&self, path: &Path, content: &Blob) -> Result<(PathBuf, Blob), Self::Error>;
}

struct OneToOneImpl<R> {
    re: Regex,
    rule: R,
}

impl<R: OneToOneRule<Error = E>, E> Rule for OneToOneImpl<R> {
    type Error = E;

    fn build(&self, tree: &Tree) -> Result<Tree, Self::Error> {
        let mut out = HashMap::new();
        for (path, content) in tree {
            if self.re.is_match(&path.to_string_lossy()) {
                let (dest, content) = self.rule.build(path, &content)?;
                out.insert(dest, content);
            }
        }
        Ok(out)
    }
}

pub fn one_to_one_based_on_regex<R: 'static + OneToOneRule<Error = E>, E>(
    regex: Regex,
    rule: R,
) -> Box<dyn Rule<Error = E>> {
    Box::new(OneToOneImpl { re: regex, rule })
}

pub struct DirMap {
    pub from: PathBuf,
    pub dest: PathBuf,
    pub publish: bool,
    pub filter: Box<dyn Fn(&Path, &[u8]) -> bool>,
}

impl DirMap {
    pub fn new_by_re<P1: Into<PathBuf>, P2: Into<PathBuf>>(
        from: P1,
        dest: P2,
        publish: bool,
        re: Regex,
    ) -> Self {
        Self {
            from: from.into(),
            dest: dest.into(),
            publish,
            filter: Box::new(move |path, _| re.is_match(&path.to_string_lossy())),
        }
    }
}

fn file_tree<P: AsRef<Path>>(root: P) -> std::io::Result<Tree> {
    let mut dirs = vec![root.as_ref().to_owned()];
    let mut tree = HashMap::new();
    while let Some(dir) = dirs.pop() {
        let meta = fs::metadata(&dir)?;
        if meta.is_file() {
            let mut content = Vec::new();
            let mut file = fs::File::open(&dir)?;
            file.read_to_end(&mut content)?;
            let mime = mime_guess::from_path(&dir).first_or_octet_stream();
            tree.insert(
                dir.canonicalize()?,
                Blob {
                    content,
                    mime,
                    publish: false,
                },
            );
        } else if meta.is_dir() {
            for entry in fs::read_dir(&dir)? {
                dirs.push(entry?.path());
            }
        }
    }
    Ok(tree)
}

pub fn static_load(dirs: Vec<DirMap>) -> std::io::Result<Tree> {
    let mut tree = HashMap::new();
    for dir in dirs {
        let from = dir.from.canonicalize()?;
        for (path, content) in file_tree(&dir.from)? {
            if (dir.filter)(path.as_ref(), &content.content) {
                let path = dir.dest.join(path.strip_prefix(&from).unwrap());
                tree.insert(
                    path,
                    Blob {
                        publish: dir.publish,
                        ..content
                    },
                );
            }
        }
    }
    Ok(tree)
}

pub fn build<E>(initial_tree: Tree, rules: Vec<Box<dyn Rule<Error = E>>>) -> Result<Tree, E> {
    let mut tree = initial_tree;
    for rule in rules {
        for (path, content) in rule.build(&tree)? {
            tree.insert(path, content);
        }
    }
    Ok(tree)
}
