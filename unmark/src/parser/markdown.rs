use pulldown_cmark::{Event, HeadingLevel, Tag};
use tracing::debug;

use crate::dom;

#[derive(Debug, thiserror::Error)]
pub enum Error<'a> {
    #[error("markdown not found")]
    MarkdownNotFound,
    #[error("parse custom component {0}")]
    ParseCustomComponent(super::custom_component::Error<'a>),
}

type ParseResult<'a, T> = Result<(T, usize), Error<'a>>;

#[derive(Debug, Clone, Copy)]
struct Context {
    pos: usize,
}
