use std::{collections::HashMap, fmt::Display};

use pulldown_cmark::CowStr;

#[derive(Debug, PartialEq, Eq, Clone, Copy, Hash)]
pub enum Language {
    Rust,
    Html,
    BourneShell,
    Fish,
    TypeScript,
    JavaScript,
    PlainText,
}

#[derive(Debug)]
pub struct UnsupportedLanguage(String);

impl Display for UnsupportedLanguage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let lang = &self.0;
        write!(f, "unsupported_language: {lang}")
    }
}

impl std::error::Error for UnsupportedLanguage {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        None
    }

    fn description(&self) -> &str {
        "deprecated"
    }

    fn cause(&self) -> Option<&dyn std::error::Error> {
        self.source()
    }
}

impl TryFrom<&str> for Language {
    type Error = UnsupportedLanguage;

    fn try_from(src: &str) -> Result<Self, Self::Error> {
        match src {
            "rust" => Ok(Language::Rust),
            "rs" => Ok(Language::Rust),
            "javascript" => Ok(Language::JavaScript),
            "js" => Ok(Language::JavaScript),
            "typescript" => Ok(Language::TypeScript),
            "ts" => Ok(Language::TypeScript),
            "fish" => Ok(Language::Fish),
            "sh" => Ok(Language::BourneShell),
            "shell" => Ok(Language::BourneShell),
            "html" => Ok(Language::Html),
            "text" => Ok(Language::PlainText),
            "" => Ok(Language::PlainText),
            _ => Err(UnsupportedLanguage(src.to_owned())),
        }
    }
}

#[derive(Debug)]
pub enum Dom<'a> {
    P(Vec<Dom<'a>>),
    Section {
        title: Box<Dom<'a>>,
        level: u8,
        contents: Vec<Dom<'a>>,
    },
    Text(CowStr<'a>),
    Code(CowStr<'a>),
    CodeBlock {
        language: Language,
        content: Vec<CowStr<'a>>,
    },
    Link {
        title: String,
        url: String,
    },
    Image {
        alt: String,
        url: String,
    },
    ImageLink {
        alt: String,
        url: String,
    },
    Custom {
        name: String,
        attributes: HashMap<String, String>,
        children: Vec<Dom<'a>>,
    },
}
