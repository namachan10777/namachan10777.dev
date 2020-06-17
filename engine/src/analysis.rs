use super::{Article, Context, File, Project, TextElem, Value};

use std::collections::HashMap;

#[derive(Debug)]
pub enum Error {
    InvalidFormat(String),
}

pub type AResult<T> = Result<T, Error>;

fn extract_title(article: &Article) -> AResult<Vec<TextElem>> {
    article
        .body
        .attrs
        .get("title")
        .ok_or_else(|| Error::InvalidFormat(String::from("missing attribute title in \\index")))
        .and_then(|v| match v {
            Value::Text(v) => Ok(v.clone()),
            _ => Err(Error::InvalidFormat(String::from(
                "wrong attribute type at title",
            ))),
        })
}

pub fn parse(proj: &Project) -> AResult<Context> {
    let mut map = HashMap::new();
    for (fname, file) in proj {
        match file {
            File::Article(article) => {
                let title = extract_title(article)?;
                map.insert(fname, title);
            }
            File::Misc(_) => (),
        }
    }
    Ok(Context { level: 0 })
}
