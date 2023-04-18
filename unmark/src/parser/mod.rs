use comrak::Arena;
use serde::Deserialize;

pub mod custom_component;
pub mod frontmatter;
pub mod markdown;

#[derive(Debug, thiserror::Error)]
pub enum Error<'a> {
    #[error("frontmatter {0}")]
    Frontmatter(frontmatter::Error),
    #[error("markdown {0}")]
    Markdown(markdown::Error<'a>),
}

pub fn parse_test<'a, T: 'a + Deserialize<'a>>(
    _src: &'a str,
) -> Result<(T, super::dom::Dom<'a>), Error> {
    unimplemented!()
}

pub fn parse<'a, T: 'a + Deserialize<'a>>(src: &'a str) -> Result<(T, super::dom::Dom<'a>), Error> {
    let (frontmatter, src): (T, &str) =
        frontmatter::parse_frontmatter(src).map_err(Error::Frontmatter)?;
    let arena = Arena::new();
    let root = comrak::parse_document(&arena, src, &comrak::ComrakOptions::default());
    dbg!(root);
    unimplemented!()
}
