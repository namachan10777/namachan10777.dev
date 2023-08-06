use std::path::{Path, PathBuf};

use axohtml::{html, text};
use git2::{Commit, Repository};

pub struct GitRepo {
    repo: Repository,
    rel_path: PathBuf,
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("root git directory not found")]
    RootNotFound(PathBuf),
    #[error("open git repository {0}")]
    OpenRepo(git2::Error),
    #[error("get git log {0}")]
    GetLog(git2::Error),
}

fn find_git_repository<P: AsRef<Path>>(article_root: P) -> Result<PathBuf, Error> {
    let mut root = article_root
        .as_ref()
        .canonicalize()
        .map_err(|_| Error::RootNotFound(article_root.as_ref().to_owned()))?;
    while !root.join(".git").exists() {
        root = root
            .parent()
            .ok_or_else(|| Error::RootNotFound(article_root.as_ref().to_owned()))?
            .to_owned();
    }
    Ok(root)
}

impl GitRepo {
    pub fn open<P: AsRef<Path>>(article_root: P) -> Result<Self, Error> {
        let article_root = article_root
            .as_ref()
            .canonicalize()
            .map_err(|_| Error::RootNotFound(article_root.as_ref().to_owned()))?;
        let git_root_path = find_git_repository(&article_root)?;
        let rel_path = article_root
            .strip_prefix(&git_root_path)
            .map_err(|_| Error::RootNotFound(article_root.clone()))?
            .to_owned();
        let repo = Repository::open(&git_root_path).map_err(Error::OpenRepo)?;
        Ok(Self { rel_path, repo })
    }

    pub fn path_on_git<P: AsRef<Path>>(&self, path: P) -> PathBuf {
        let path = path.as_ref();
        if let Ok(path) = path.strip_prefix("/") {
            self.rel_path.join(path)
        } else {
            self.rel_path.join(path)
        }
    }

    pub fn get_file_logs<P: AsRef<Path>>(&self, path: P) -> Result<Vec<Commit>, Error> {
        get_file_logs(&self.repo, self.path_on_git(path)).map_err(Error::GetLog)
    }
}

fn get_file_logs<P: AsRef<Path>>(repo: &Repository, path: P) -> Result<Vec<Commit>, git2::Error> {
    let mut revwalk = repo.revwalk()?;
    revwalk.set_sorting(git2::Sort::TIME)?;
    revwalk.push_head()?;
    let mut old_id = None;
    let mut oids = Vec::new();
    for oid in revwalk {
        let oid = oid?;
        let Ok(commit) = repo.find_commit(oid) else {
            continue;
        };
        let Ok(entry) = commit.tree()?.get_path(path.as_ref()) else {
            continue;
        };
        if old_id.map(|old_id| old_id != entry.id()).unwrap_or(true) {
            oids.push(commit);
        }
        old_id = Some(entry.id());
    }
    Ok(oids)
}

pub fn gen_history<P1: AsRef<Path>, P2: AsRef<Path>>(
    article_root: P1,
    file_path: P2,
) -> Result<Box<dyn axohtml::elements::FlowContent<String>>, Error> {
    let repo = GitRepo::open(article_root)?;
    let commits = repo.get_file_logs(file_path.as_ref())?;
    let logs = commits.iter().map(|commit| {
        let id = commit.id();
        let id_short_str = &id.to_string()[..8];
        let path = repo.path_on_git(file_path.as_ref()).to_string_lossy().to_string();
        let github_url =
            format!("https://github.com/namachan10777/namachan10777.dev/blob/{id}/{path}");
        let title = commit
            .message()
            .iter()
            .flat_map(|msg| msg.lines().next())
            .next()
            .unwrap_or("");
        html!(
            <li class="git-entry">
                <a href=github_url><span>{text!(id_short_str)}</span></a>
                <span>{text!(title)}</span>
            </li>
        )
    });
    Ok(html!(
        <footer>
            <h2>"編集履歴"</h2>
            <ul>
                {logs}
            </ul>
        </footer>
    ))
}
