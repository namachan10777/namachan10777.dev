use std::path::Path;

use axohtml::{html, text};

use crate::tools::git::{Error, GitRepo};

pub fn gen_history<P1: AsRef<Path>, P2: AsRef<Path>>(
    article_root: P1,
    file_path: P2,
) -> Result<Box<dyn axohtml::elements::FlowContent<String>>, Error> {
    let repo = GitRepo::open(article_root)?;
    let commits = repo.get_file_logs(file_path.as_ref())?;
    let logs = commits.iter().map(|commit| {
        let id = commit.id();
        let id_short_str = &id.to_string()[..8];
        let path = repo
            .path_on_git(file_path.as_ref())
            .to_string_lossy()
            .to_string();
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
