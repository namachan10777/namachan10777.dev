use std::collections::HashMap;

#[derive(Debug, thiserror::Error)]
pub enum Error<'a> {
    #[error("parse {0}")]
    Parse(nom::Err<nom::error::Error<&'a str>>),
}

use anyhow::anyhow;
use itertools::Itertools;
use nom::{
    branch::alt,
    bytes::{complete::tag, streaming::take_while},
    character::complete::{alphanumeric1, space0},
    combinator::{eof, map_res},
    multi::many0,
    sequence::pair,
    IResult, Parser,
};

#[derive(Debug, PartialEq, Eq)]
pub enum CustomTag<'a> {
    Start {
        name: &'a str,
        attributes: HashMap<&'a str, String>,
    },
    End {
        name: &'a str,
    },
    Single {
        name: &'a str,
        attributes: HashMap<&'a str, String>,
    },
}

#[derive(Debug, PartialEq, Eq)]
enum EscapeType {
    Tab,
    CarriageReturn,
    Newline,
    DQuote,
}

impl AsRef<str> for EscapeType {
    fn as_ref(&self) -> &str {
        match self {
            EscapeType::Tab => "\t",
            EscapeType::Newline => "\n",
            EscapeType::DQuote => "\"",
            EscapeType::CarriageReturn => "\r",
        }
    }
}

impl ToString for EscapeType {
    fn to_string(&self) -> String {
        self.as_ref().to_owned()
    }
}

#[derive(Debug, PartialEq, Eq)]
enum Fragment<'a> {
    Escaped(EscapeType),
    Text(&'a str),
}

impl<'a> ToString for Fragment<'a> {
    fn to_string(&self) -> String {
        match self {
            Fragment::Text(text) => (*text).to_owned(),
            Fragment::Escaped(esc) => esc.to_string(),
        }
    }
}

fn parse_fragment(input: &str) -> IResult<&str, Fragment<'_>> {
    let escape_char = alt((tag("t"), tag("r"), tag("n"), tag("\"")));
    let escape_char = map_res(escape_char, |ch| match ch {
        "t" => Ok(EscapeType::Tab),
        "r" => Ok(EscapeType::CarriageReturn),
        "n" => Ok(EscapeType::Newline),
        "\"" => Ok(EscapeType::DQuote),
        _ => Err(nom::Err::Failure(anyhow!("invalid escape char {ch}"))),
    });
    let escape =
        pair(tag("\\"), escape_char).map(|(_, escape_char)| Fragment::Escaped(escape_char));
    let text = take_while(|ch| ch != '"' && ch != '\\');
    let text = map_res(text, |text: &str| {
        if !text.is_empty() {
            Ok(Fragment::Text(text))
        } else {
            Err(nom::Err::Failure(anyhow!("empty text")))
        }
    });
    alt((escape, text))(input)
}

fn parse_string(input: &str) -> IResult<&str, Vec<Fragment<'_>>> {
    let (input, _) = tag("\"")(input)?;
    let (input, fragments) = many0(|input| {
        let (input, fragment) = parse_fragment(input)?;
        Ok((input, fragment))
    })(input)?;
    let (input, _) = tag("\"")(input)?;
    Ok((input, fragments))
}

fn parse_attribute(input: &str) -> IResult<&str, (&str, String)> {
    let (input, attribute) = alphanumeric1(input)?;
    let (input, _) = space0(input)?;
    let (input, _) = tag("=")(input)?;
    let (input, _) = space0(input)?;
    let (input, string_fragments) = parse_string(input)?;
    Ok((
        input,
        (
            attribute,
            string_fragments
                .into_iter()
                .map(|fragment| fragment.to_string())
                .collect_vec()
                .join(""),
        ),
    ))
}

fn parse_attributes(input: &str) -> IResult<&str, HashMap<&str, String>> {
    let (input, attributes) =
        many0(pair(space0, parse_attribute).map(|(_, attribute)| attribute))(input)?;
    Ok((input, attributes.into_iter().collect()))
}

fn parse_tag_single(input: &str) -> IResult<&str, CustomTag<'_>> {
    let (input, _) = tag("<")(input)?;
    let (input, _) = space0(input)?;
    let (input, name) = alphanumeric1(input)?;
    let (input, attributes) = parse_attributes(input)?;
    let (input, _) = space0(input)?;
    let (input, _) = tag("/>")(input)?;
    Ok((input, CustomTag::Single { name, attributes }))
}

fn parse_tag_open(input: &str) -> IResult<&str, CustomTag<'_>> {
    let (input, _) = tag("<")(input)?;
    let (input, _) = space0(input)?;
    let (name, _) = alphanumeric1(input)?;
    let (input, attributes) = parse_attributes(input)?;
    let (input, _) = space0(input)?;
    let (input, _) = tag(">")(input)?;
    Ok((input, CustomTag::Start { name, attributes }))
}

fn parse_tag_close(input: &str) -> IResult<&str, CustomTag<'_>> {
    let (input, _) = tag("</")(input)?;
    let (input, _) = space0(input)?;
    let (input, name) = alphanumeric1(input)?;
    let (input, _) = space0(input)?;
    let (input, _) = tag(">")(input)?;
    Ok((input, CustomTag::End { name }))
}

pub fn parse_html(src: &str) -> Result<CustomTag<'_>, Error> {
    let (input, tag) =
        alt((parse_tag_open, parse_tag_close, parse_tag_single))(src).map_err(Error::Parse)?;
    let (_, _) = eof(input).map_err(Error::Parse)?;
    Ok(tag)
}

#[cfg(test)]
mod test {
    use maplit::hashmap;

    use super::*;

    #[test]
    fn test_parse_string() {
        let src = r#""Hello\tWorld!"test"#;
        assert_eq!(
            parse_string(src).unwrap(),
            (
                "test",
                vec![
                    Fragment::Text("Hello"),
                    Fragment::Escaped(EscapeType::Tab),
                    Fragment::Text("World!")
                ]
            )
        );
        assert!(parse_string("hoge").is_err());
    }

    #[test]
    fn test_parse_attribute() {
        let src = r#"hoge="fuga""#;
        assert_eq!(
            parse_attribute(src).unwrap(),
            ("", ("hoge", "fuga".to_owned()))
        );
    }

    #[test]
    fn test_parse_single_tag() {
        let src = r#"<input type="button" class="button" />"#;
        assert_eq!(
            parse_tag_single(src).unwrap(),
            (
                "",
                CustomTag::Single {
                    name: "input",
                    attributes: hashmap! {
                        "type" => "button".to_owned(),
                        "class" => "button".to_owned()
                    }
                }
            )
        );
    }
}
