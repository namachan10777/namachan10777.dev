use axohtml::{
    elements::PhrasingContent,
    html, text,
    types::{Id, SpacedSet},
};
use once_cell::sync::Lazy;
use tree_sitter_highlight::{HighlightConfiguration, HighlightEvent, Highlighter};

const HIGHLIGHT_NAMES: &[&str] = &[
    "attribute",
    "constant",
    "function.builtin",
    "function",
    "keyword",
    "operator",
    "property",
    "punctuation",
    "punctuation.bracket",
    "punctuation.delimiter",
    "string",
    "string.special",
    "tag",
    "type",
    "type.builtin",
    "variable",
    "variable.builtin",
    "variable.parameter",
];

static RUST_CONFIG: Lazy<HighlightConfiguration> = Lazy::new(|| {
    let mut config = HighlightConfiguration::new(
        tree_sitter_rust::language(),
        tree_sitter_rust::HIGHLIGHT_QUERY,
        "",
        "",
    )
    .unwrap();
    config.configure(HIGHLIGHT_NAMES);
    config
});

static JAVASCRIPT_CONFIG: Lazy<HighlightConfiguration> = Lazy::new(|| {
    let mut config = HighlightConfiguration::new(
        tree_sitter_javascript::language(),
        tree_sitter_javascript::HIGHLIGHT_QUERY,
        tree_sitter_javascript::INJECTION_QUERY,
        tree_sitter_javascript::LOCALS_QUERY,
    )
    .unwrap();
    config.configure(HIGHLIGHT_NAMES);
    config
});

fn get_config(info: &str) -> Option<&'static Lazy<HighlightConfiguration>> {
    match info {
        "rs" | "rust" => Some(&RUST_CONFIG),
        "js" | "javascript" | "ecmascript" => Some(&JAVASCRIPT_CONFIG),
        _ => None,
    }
}

enum StackElement {
    Built(Box<dyn PhrasingContent<String>>),
    Hi(usize),
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("treesitter {0}")]
    TreeSitter(tree_sitter_highlight::Error),
    #[error("no start tag")]
    NoStartTag,
    #[error("no end tag")]
    NoEndTag,
}

impl From<tree_sitter_highlight::Error> for Error {
    fn from(value: tree_sitter_highlight::Error) -> Self {
        Self::TreeSitter(value)
    }
}

pub fn highlight(lang: &str, src: &str) -> Result<Vec<Box<dyn PhrasingContent<String>>>, Error> {
    let mut scope_stack = Vec::new();
    let mut highlighter = Highlighter::new();
    let Some(config) = get_config(lang) else {
        return Ok(vec![text!(src)])
    };
    for event in highlighter.highlight(config, src.as_bytes(), None, |_| None)? {
        match event? {
            HighlightEvent::HighlightEnd => {
                let mut builts = Vec::new();
                loop {
                    match scope_stack.pop() {
                        Some(StackElement::Built(built)) => builts.push(built),
                        Some(StackElement::Hi(hi)) => {
                            let class_name = Id::new(format!(
                                "highlight-{}",
                                &HIGHLIGHT_NAMES[hi].replace('.', "-")
                            ));
                            let mut class = SpacedSet::new();
                            class.add(class_name);
                            builts.reverse();
                            scope_stack.push(StackElement::Built(
                                html!(<span class=class>{builts}</span>),
                            ));
                            break;
                        }
                        None => return Err(Error::NoStartTag),
                    }
                }
            }
            HighlightEvent::Source { start, end } => {
                scope_stack.push(StackElement::Built(
                    html!(<span class="highlight-normal">{text!(&src[start..end])}</span>),
                ));
            }
            HighlightEvent::HighlightStart(hi) => {
                scope_stack.push(StackElement::Hi(hi.0));
            }
        }
    }
    scope_stack
        .into_iter()
        .map(|e| match e {
            StackElement::Built(built) => Ok(built),
            StackElement::Hi(_) => Err(Error::NoEndTag),
        })
        .collect::<Result<_, _>>()
}

#[cfg(test)]
mod test {
    use std::fs;

    use super::highlight;

    #[test]
    fn test_highlight() {
        highlight("rs", &fs::read_to_string("src/htmlgen.rs").unwrap()).unwrap();
    }
}
