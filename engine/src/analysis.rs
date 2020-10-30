use super::{Article, File, Project, TextElem, Value};

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use syntect::parsing::SyntaxSet;

#[derive(Debug)]
pub enum Error {
    InvalidFormat(String),
}
pub struct Report {
    pub prevs: HashMap<PathBuf, (PathBuf, Vec<TextElem>)>,
    pub nexts: HashMap<PathBuf, (PathBuf, Vec<TextElem>)>,
    pub articles: HashMap<PathBuf, Vec<(PathBuf, Vec<TextElem>, chrono::NaiveDate)>>,
    pub ss: SyntaxSet,
}

macro_rules! get {
    ( $hash:expr, $key:expr, $tp:ident ) => {
        $hash
            .get($key)
            .ok_or(Error::InvalidFormat(format!(
                "missing attribute {} in \\index",
                $key
            )))
            .and_then(|v| match v {
                Value::$tp(v) => Ok(v.clone()),
                _ => Err(Error::InvalidFormat(format!(
                    "wrong attribute type at {}",
                    $key
                ))),
            })
    };
}

pub type AResult<T> = Result<T, Error>;

fn extract_title_and_date(
    article: &Article,
) -> AResult<Option<(Vec<TextElem>, chrono::NaiveDate)>> {
    match article.body.name.as_str() {
        "article" => {
            let title = get!(article.body.attrs, "title", Text)?;
            let date = &get!(article.body.attrs, "date", Str)?;
            let date_pattern = regex::Regex::new(r"^(\d{4})-(\d{2})-(\d{2})$").unwrap();
            let captured = date_pattern.captures(&date).unwrap();
            let year = captured.get(1).unwrap().as_str().parse().unwrap();
            let month = captured.get(2).unwrap().as_str().parse().unwrap();
            let day = captured.get(3).unwrap().as_str().parse().unwrap();
            Ok(Some((title, chrono::NaiveDate::from_ymd(year, month, day))))
        }
        _ => Ok(None),
    }
}

pub fn parse(proj: &Project) -> AResult<Report> {
    let ss = SyntaxSet::load_defaults_newlines();
    let mut articles =
        HashMap::<std::path::PathBuf, Vec<(PathBuf, Vec<TextElem>, chrono::NaiveDate)>>::new();
    for (fname, file) in proj {
        match file {
            File::Article(article) => {
                if let Some((title, date)) = extract_title_and_date(article)? {
                    if let Some(list) =
                        articles.get_mut(fname.parent().unwrap_or_else(|| Path::new("/")))
                    {
                        list.push((fname.clone(), title, date));
                    } else {
                        articles.insert(
                            fname
                                .parent()
                                .unwrap_or_else(|| Path::new("/"))
                                .to_path_buf(),
                            vec![(fname.clone(), title, date)],
                        );
                    }
                }
            }
            File::Misc(_) => (),
        }
    }
    articles
        .iter_mut()
        .for_each(|(_, articles)| articles.sort_by(|a, b| a.2.partial_cmp(&b.2).unwrap()));
    let mut prevs = HashMap::new();
    let mut nexts = HashMap::new();
    let mut before: Option<(PathBuf, Vec<TextElem>)> = None;
    for articles in articles.values() {
        for (path, title, _) in articles {
            if let Some((prev_path, prev_title)) = before {
                prevs.insert(path.clone(), (prev_path.clone(), prev_title));
                nexts.insert(prev_path, (path.clone(), title.clone()));
            }
            before = Some((path.clone(), title.clone()))
        }
    }
    Ok(Report {
        ss,
        articles,
        prevs,
        nexts,
    })
}
