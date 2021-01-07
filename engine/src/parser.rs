use super::{Cmd, Location, Position, TextElem, Value};
use pest::error::LineColLocation;
use pest::iterators::{Pair, Pairs};
use pest::Parser;
use std::collections::HashMap;

#[derive(Parser)]
#[grammar = "grammar.pest"]
struct TextParser;

#[derive(Debug, PartialEq)]
pub enum Error<'a> {
    SyntaxError(Location<'a>),
}

fn pest_loc_to_engine_loc(fname: &str, loc: LineColLocation) -> Location {
    match loc {
        LineColLocation::Pos((l, c)) => Location::At(Position::new(fname, l, c)),
        LineColLocation::Span((l1, c1), (l2, c2)) => {
            Location::Span(Position::new(fname, l1, c1), Position::new(fname, l2, c2))
        }
    }
}

fn get_location<'a>(fname: &'a str, pair: &Pair<Rule>) -> Location<'a> {
    let span = pair.as_span();
    let s = span.start_pos();
    let (s_line, s_col) = s.line_col();
    let e = span.end_pos();
    let (e_line, e_col) = e.line_col();
    Location::Span(
        Position::new(fname, s_line, s_col),
        Position::new(fname, e_line, e_col),
    )
}

fn parse_cmd<'a>(fname: &'a str, pair: Pair<Rule>) -> Cmd<'a> {
    match pair.as_rule() {
        Rule::cmd => {
            let mut inner = pair.into_inner();
            let name = &inner.next().unwrap().as_str()[1..];
            let attrs = inner
                .next()
                .unwrap()
                .into_inner()
                .map(|p| {
                    let loc = get_location(fname, &p);
                    let mut inner = p.into_inner();
                    let attr = inner.next().unwrap().as_str();
                    let value =
                        parse_value(fname, inner.next().unwrap().into_inner().next().unwrap());
                    (attr.to_owned(), (value, loc))
                })
                .collect::<HashMap<String, (Value, Location)>>();
            let inner = inner.next().unwrap();
            let cmd_inner = match inner.as_rule() {
                Rule::text => fold_textelem(fname, inner.into_inner()),
                Rule::cmds => fold_textelem(fname, inner.into_inner()),
                Rule::end_of_cmd => vec![],
                _ => unreachable!(),
            };
            Cmd {
                name: name.to_owned(),
                attrs,
                inner: cmd_inner,
            }
        }
        _ => unreachable!(),
    }
}

fn parse_text_elem<'a>(fname: &'a str, pair: Pair<Rule>) -> (TextElem<'a>, Location<'a>) {
    let loc = get_location(fname, &pair);
    (
        match pair.as_rule() {
            Rule::cmd => TextElem::Cmd(parse_cmd(fname, pair)),
            Rule::esc_endbrace => TextElem::Plain(String::from("}")),
            Rule::esc_esc => TextElem::Plain(String::from("\\")),
            Rule::char_in_text => TextElem::Plain(pair.as_str().to_owned()),
            Rule::inlinestr => TextElem::Str(pair.as_str()[1..pair.as_str().len() - 1].to_owned()),
            _ => unreachable!(),
        },
        loc,
    )
}

fn fold_textelem<'a>(fname: &'a str, pairs: Pairs<Rule>) -> Vec<(TextElem<'a>, Location<'a>)> {
    let mut text_loc = Location::Generated;
    let mut inner = Vec::new();
    let mut text = String::new();
    for elem in pairs.map(|p| parse_text_elem(fname, p)) {
        match elem.0 {
            TextElem::Plain(s) => {
                text.push_str(s.as_str());
                text_loc = text_loc.merge(&elem.1);
            }
            TextElem::Cmd(cmd) => {
                if !text.is_empty() {
                    inner.push((TextElem::Plain(text.clone()), text_loc));
                }
                inner.push((TextElem::Cmd(cmd), elem.1));
                text_loc = Location::Generated;
                text.clear();
            }
            TextElem::Str(s) => {
                if !text.is_empty() {
                    inner.push((TextElem::Plain(text.clone()), text_loc));
                }
                text.clear();
                text_loc = Location::Generated;
                inner.push((TextElem::Str(s), elem.1));
            }
        }
    }
    if !text.is_empty() {
        inner.push((TextElem::Plain(text), text_loc));
    }
    inner
}

fn parse_value<'a>(fname: &'a str, pair: Pair<Rule>) -> Value<'a> {
    match pair.as_rule() {
        Rule::int => Value::Int(pair.as_str().parse().unwrap()),
        Rule::float => Value::Float(pair.as_str().parse().unwrap()),
        Rule::str => {
            let inner = pair
                .into_inner()
                .map(|p| match p.as_rule() {
                    Rule::char_in_str => p.as_str(),
                    Rule::esc_dq_str => "\"",
                    Rule::esc_esc_str => "\\",
                    _ => unreachable!(),
                })
                .collect::<Vec<_>>();
            Value::Str(inner.join(""))
        }
        Rule::blockstr => Value::Str(String::from(&pair.as_str()[4..pair.as_str().len() - 4])),
        Rule::text => Value::Text(fold_textelem(fname, pair.into_inner())),
        Rule::cmds => Value::Text(fold_textelem(fname, pair.into_inner())),
        _ => unreachable!(),
    }
}

#[cfg(test)]
mod test {
    use super::*;
    macro_rules! hash {
        ( ) => {
            HashMap::new()
        };
        ( $( ($key:expr, $value:expr) ),* ) => {
            {
                let mut hash = HashMap::new();
                $(
                    hash.insert($key, $value);
                )*
                hash
            }
        };
    }

    macro_rules! parse {
        ($fname:expr, $rule:expr, $s:expr, $f:expr ) => {
            TextParser::parse($rule, $s).map(|mut pairs| pairs.next().map(|p| $f($fname, p)))
        };
    }

    #[test]
    fn test_int() {
        assert_eq!(
            parse!("a.tml", Rule::int, "1234", parse_value),
            Ok(Some(Value::Int(1234))),
        );
        assert_eq!(
            parse!("a.tml", Rule::int, "0000", parse_value),
            Ok(Some(Value::Int(0))),
        );
    }

    #[test]
    fn test_float() {
        assert_eq!(
            parse!("a.tml", Rule::float, "3.14", parse_value),
            Ok(Some(Value::Float(3.14)))
        );
        assert_eq!(
            parse!("a.tml", Rule::float, "0.0", parse_value),
            Ok(Some(Value::Float(0.0))),
        );
    }

    #[test]
    fn test_str() {
        assert_eq!(
            parse!("a.tml", Rule::str, "\"abc\"", parse_value),
            Ok(Some(Value::Str("abc".to_owned()))),
        );
        assert_eq!(
            parse!("a.tml", Rule::str, "\"abc\\\"def\\\\\"", parse_value),
            Ok(Some(Value::Str("abc\"def\\".to_owned()),)),
        );
    }

    #[test]
    fn test_cmd() {
        assert_eq!(
            parse!("a.tml", Rule::cmd, "\\cmdname class=\"cls1\";", parse_cmd),
            Ok(Some(Cmd {
                name: String::from("cmdname"),
                attrs: hash![(
                    String::from("class"),
                    (
                        Value::Str(String::from("cls1")),
                        Location::Span(
                            Position::new("a.tml", 1, 10),
                            Position::new("a.tml", 1, 22)
                        )
                    )
                )],
                inner: vec![]
            }))
        );
        assert_eq!(
            parse!(
                "a.tml",
                Rule::cmd,
                "\\cmdname class=\"cls1\"{\\c1; `hoge`\\c2 {\\c3;}}",
                parse_cmd
            ),
            Ok(Some(Cmd {
                name: String::from("cmdname"),
                attrs: hash![(
                    String::from("class"),
                    (
                        Value::Str(String::from("cls1")),
                        Location::Span(
                            Position::new("a.tml", 1, 10),
                            Position::new("a.tml", 1, 22)
                        )
                    )
                )],
                inner: vec![
                    (
                        TextElem::Cmd(Cmd {
                            name: "c1".to_owned(),
                            attrs: hash![],
                            inner: vec![]
                        }),
                        Location::Span(
                            Position::new("a.tml", 1, 23),
                            Position::new("a.tml", 1, 27)
                        )
                    ),
                    (
                        TextElem::Plain(" ".to_owned()),
                        Location::Span(
                            Position::new("a.tml", 1, 27),
                            Position::new("a.tml", 1, 28)
                        )
                    ),
                    (
                        TextElem::Str("hoge".to_owned()),
                        Location::Span(
                            Position::new("a.tml", 1, 28),
                            Position::new("a.tml", 1, 34)
                        )
                    ),
                    (
                        TextElem::Cmd(Cmd {
                            name: "c2".to_owned(),
                            attrs: hash![],
                            inner: vec![(
                                TextElem::Cmd(Cmd {
                                    name: "c3".to_owned(),
                                    attrs: hash![],
                                    inner: vec![]
                                }),
                                Location::Span(
                                    Position::new("a.tml", 1, 39),
                                    Position::new("a.tml", 1, 43)
                                )
                            )]
                        }),
                        Location::Span(
                            Position::new("a.tml", 1, 34),
                            Position::new("a.tml", 1, 44)
                        )
                    )
                ]
            }))
        );
    }
    #[test]
    fn test_text() {
        assert_eq!(
            parse!("a.tml", Rule::text, "{}", parse_value),
            Ok(Some(Value::Text(vec![]),)),
        );
        assert_eq!(
            parse!("a.tml", Rule::text, "{\\}\\\\}", parse_value),
            Ok(Some(Value::Text(vec![(
                TextElem::Plain(String::from("}\\")),
                Location::Span(Position::new("a.tml", 1, 2), Position::new("a.tml", 1, 6))
            )]),)),
        );
        assert_eq!(
            parse!("a.tml", Rule::text, "{\\cmd {foo\\red {bar}}}", parse_value),
            Ok(Some(Value::Text(vec![(
                TextElem::Cmd(Cmd {
                    name: String::from("cmd"),
                    attrs: hash![],
                    inner: vec![
                        (
                            TextElem::Plain(String::from("foo")),
                            Location::Span(
                                Position::new("a.tml", 1, 8),
                                Position::new("a.tml", 1, 11)
                            )
                        ),
                        (
                            TextElem::Cmd(Cmd {
                                name: String::from("red"),
                                attrs: hash![],
                                inner: vec![(
                                    TextElem::Plain(String::from("bar")),
                                    Location::Span(
                                        Position::new("a.tml", 1, 17),
                                        Position::new("a.tml", 1, 20)
                                    )
                                )]
                            }),
                            Location::Span(
                                Position::new("a.tml", 1, 11),
                                Position::new("a.tml", 1, 21)
                            )
                        ),
                    ]
                }),
                Location::Span(Position::new("a.tml", 1, 2), Position::new("a.tml", 1, 22))
            )]),)),
        );
    }
    #[test]
    fn blockstr() {
        let src = vec!["###`", "foo", "hoge \"bar\"", "`###"].join("\n");
        assert_eq!(
            parse!("a.tml", Rule::blockstr, src.as_str(), parse_value),
            Ok(Some(Value::Str("\nfoo\nhoge \"bar\"\n".to_owned()),))
        );
    }
}

pub fn parse<'a>(fname: &'a str, s: &str) -> Result<(Cmd<'a>, Location<'a>), Error<'a>> {
    let pair = TextParser::parse(Rule::main, s)
        .map_err(|e| Error::SyntaxError(pest_loc_to_engine_loc(fname, e.line_col)))?
        .next()
        .unwrap()
        .into_inner()
        .next()
        .unwrap();
    let loc = get_location(fname, &pair);
    Ok((parse_cmd(fname, pair), loc))
}
