use std::ops::Range;

use pulldown_cmark::{BrokenLinkCallback, Event, Options, Parser};
use serde::Deserialize;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("frontmatter mark not found")]
    FrontMatterMarkNotFound,
    #[error("toml parse error {0}")]
    TomlParseError(toml::de::Error),
    #[error("yaml parse error {0}")]
    YamlParseError(serde_yaml::Error),
}

pub struct ParserWithFrontMatter<'input, 'callback, T> {
    parser: pulldown_cmark::Parser<'input, 'callback>,
    pub frontmatter: T,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct Line<'a> {
    content: &'a str,
    newline: Option<&'a str>,
    range: Range<usize>,
}

struct Src<'a> {
    src: &'a str,
    current_pos: usize,
}

impl<'a> Src<'a> {
    fn new(src: &'a str) -> Self {
        Self {
            src,
            current_pos: 0,
        }
    }
}

impl<'a> Iterator for Src<'a> {
    type Item = Line<'a>;
    fn next(&mut self) -> Option<Self::Item> {
        if self.current_pos >= self.src.len() {
            return None;
        }
        let start_pos = self.current_pos;
        while self.current_pos < self.src.len() {
            let ch = &self.src[self.current_pos..self.current_pos + 1];
            match ch {
                "\r" | "\n" => break,
                _ => (),
            }
            self.current_pos += 1;
        }
        let content = &self.src[start_pos..self.current_pos];
        if self.current_pos >= self.src.len() {
            Some(Line {
                content,
                newline: None,
                range: Range {
                    start: start_pos,
                    end: self.current_pos,
                },
            })
        } else {
            self.current_pos += 1;
            Some(Line {
                content,
                newline: Some(&self.src[self.current_pos - 1..self.current_pos]),
                range: Range {
                    start: start_pos,
                    end: self.current_pos,
                },
            })
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_src() {
        let mut src = Src::new("foo\r");
        assert_eq!(
            src.next(),
            Some(Line {
                content: "foo",
                newline: Some("\r"),
                range: Range { start: 0, end: 4 }
            })
        );
        assert_eq!(src.next(), None);
        let mut src = Src::new("\nhoge\nbar");
        assert_eq!(
            src.next(),
            Some(Line {
                content: "",
                newline: Some("\n"),
                range: Range { start: 0, end: 1 }
            })
        );
        assert_eq!(
            src.next(),
            Some(Line {
                content: "hoge",
                newline: Some("\n"),
                range: Range { start: 1, end: 6 }
            })
        );
        assert_eq!(
            src.next(),
            Some(Line {
                content: "bar",
                newline: None,
                range: Range { start: 6, end: 9 }
            })
        );
    }

    #[derive(Debug, Deserialize, PartialEq, Eq)]
    struct TestFrontMatter {
        title: String,
    }

    #[test]
    fn test_frontmatter_parser() {
        let src = include_str!("../parser_example/hello_world.md");
        let (frontmatter, markdown): (TestFrontMatter, _) = parse_frontmatter(src).unwrap();
        assert_eq!(
            frontmatter,
            TestFrontMatter {
                title: "Hello World!".to_owned()
            }
        );
        assert_eq!(markdown, "\n# Hello World!\n")
    }
}

#[derive(Debug, PartialEq, Eq)]
enum FrontMatterType {
    Yaml,
    Toml,
}

fn check_frontmatter_line(mark: &str) -> Result<FrontMatterType, Error> {
    match mark {
        "+++" => Ok(FrontMatterType::Toml),
        "---" => Ok(FrontMatterType::Yaml),
        _ => Err(Error::FrontMatterMarkNotFound),
    }
}

fn parse_frontmatter<'de, T: Deserialize<'de>>(text: &'de str) -> Result<(T, &str), Error> {
    let mut src = Src::new(text);
    let mut frontmatter_start_line = None;
    while let Some(line) = src.next() {
        let mut chars = line.content.chars();
        frontmatter_start_line = Some(line);
        if !chars.all(|c| c.is_whitespace()) {
            break;
        }
    }

    dbg!(&frontmatter_start_line);

    let frontmatter_start_line = frontmatter_start_line.ok_or(Error::FrontMatterMarkNotFound)?;
    let frontmatter_start_mark = check_frontmatter_line(frontmatter_start_line.content)?;
    let frontmatter_start = frontmatter_start_line.range.end;
    let mut frontmatter_end = frontmatter_start_line.range;
    while let Some(line) = src.next() {
        frontmatter_end = line.range;
        if let Ok(frontmatter_end_mark) = check_frontmatter_line(line.content) {
            if frontmatter_end_mark == frontmatter_start_mark {
                break;
            }
        }
    }

    let frontmatter_src = &text[frontmatter_start..frontmatter_end.start];
    let markdown_src = &text[frontmatter_end.end..];

    let frontmatter: T = match frontmatter_start_mark {
        FrontMatterType::Toml => toml::from_str(frontmatter_src).map_err(Error::TomlParseError),
        FrontMatterType::Yaml => {
            serde_yaml::from_str(frontmatter_src).map_err(Error::YamlParseError)
        }
    }?;
    Ok((frontmatter, markdown_src))
}

impl<'input, 'callback, T: Deserialize<'input>> ParserWithFrontMatter<'input, 'callback, T> {
    pub fn new(text: &'input str) -> Result<Self, Error> {
        let (frontmatter, text) = parse_frontmatter(text)?;
        Ok(Self {
            parser: Parser::new(text),
            frontmatter,
        })
    }

    pub fn new_ext(text: &'input str, options: Options) -> Result<Self, Error> {
        let (frontmatter, text) = parse_frontmatter(text)?;
        Ok(Self {
            parser: Parser::new_ext(text, options),
            frontmatter,
        })
    }

    pub fn new_with_broken_link_callback(
        text: &'input str,
        options: Options,
        broken_link_callback: BrokenLinkCallback<'input, 'callback>,
    ) -> Result<Self, Error> {
        let (frontmatter, text) = parse_frontmatter(text)?;
        Ok(Self {
            parser: Parser::new_with_broken_link_callback(text, options, broken_link_callback),
            frontmatter,
        })
    }
}

impl<'input, 'callback, T> Iterator for ParserWithFrontMatter<'input, 'callback, T> {
    type Item = Event<'input>;

    fn next(&mut self) -> Option<Self::Item> {
        self.parser.next()
    }
}
