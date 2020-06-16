use super::{Cmd, TextElem, Value};
use pest::iterators::{Pair, Pairs};
use pest::Parser;
use std::collections::HashMap;

#[derive(Parser)]
#[grammar = "grammar.pest"]
struct TextParser;

#[derive(Debug, PartialEq)]
enum Error {
    InternalError(String),
}

fn parse_cmd(pair: Pair<Rule>) -> Cmd {
    match pair.as_rule() {
        Rule::cmd => {
            let mut inner = pair.into_inner();
            let name = &inner.next().unwrap().as_str()[1..];
            let mut attrs = HashMap::new();
            inner.next().unwrap().into_inner().for_each(|p| {
                let mut inner = p.into_inner();
                let attr = inner.next().unwrap().as_str();
                let value = parse_value(inner.next().unwrap().into_inner().next().unwrap());
                attrs.insert(attr.to_owned(), value);
            });
            let inner = inner.next().unwrap();
            let cmd_inner = match inner.as_rule() {
                Rule::text => fold_textelem(inner.into_inner()),
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

fn parse_text_elem(pair: Pair<Rule>) -> TextElem {
    match pair.as_rule() {
        Rule::cmd => TextElem::Cmd(parse_cmd(pair)),
        Rule::esc_endbrace => TextElem::Plain(String::from("}")),
        Rule::esc_esc => TextElem::Plain(String::from("\\")),
        Rule::char_in_text => TextElem::Plain(pair.as_str().to_owned()),
        _ => unreachable!(),
    }
}

fn fold_textelem(pairs: Pairs<Rule>) -> Vec<TextElem> {
    let mut inner = Vec::new();
    let mut text = String::new();
    for elem in pairs.map(parse_text_elem) {
        match elem {
            TextElem::Plain(s) => {
                text.push_str(s.as_str());
            }
            TextElem::Cmd(cmd) => {
                if text.len() > 0 {
                    inner.push(TextElem::Plain(text.clone()));
                }
                inner.push(TextElem::Cmd(cmd));
                text.clear();
            }
        }
    }
    if text.len() > 0 {
        inner.push(TextElem::Plain(text));
    }
    println!("{:?}", inner);
    inner
}

fn parse_value(pair: Pair<Rule>) -> Value {
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
        Rule::blockstr => {
            Value::Str(String::from(&pair.as_str()[4..pair.as_str().len()-4]))
        }
        Rule::text => Value::Text(fold_textelem(pair.into_inner())),
        Rule::cmds => Value::Text(fold_textelem(pair.into_inner())),
        p => unreachable!(),
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

    fn parse<T, F>(rule: Rule, s: &str, f: F) -> Result<Option<T>, pest::error::Error<Rule>>
    where
        F: FnOnce(Pair<Rule>) -> T,
    {
        TextParser::parse(rule, s).map(|mut pairs| pairs.next().map(f))
    }

    #[test]
    fn test_int() {
        assert_eq!(
            parse(Rule::int, "1234", parse_value),
            Ok(Some(Value::Int(1234))),
        );
        assert_eq!(
            parse(Rule::int, "0000", parse_value),
            Ok(Some(Value::Int(0))),
        );
    }

    #[test]
    fn test_float() {
        assert_eq!(
            parse(Rule::float, "3.14", parse_value),
            Ok(Some(Value::Float(3.14))),
        );
        assert_eq!(
            parse(Rule::float, "0.0", parse_value),
            Ok(Some(Value::Float(0.0))),
        );
    }

    #[test]
    fn test_str() {
        assert_eq!(
            parse(Rule::str, "\"abc\"", parse_value),
            Ok(Some(Value::Str("abc".to_owned()))),
        );
        assert_eq!(
            parse(Rule::str, "\"abc\\\"def\\\\\"", parse_value),
            Ok(Some(Value::Str("abc\"def\\".to_owned()))),
        );
    }

    #[test]
    fn test_cmd() {
        assert_eq!(
            parse(Rule::cmd, "\\cmdname class=\"cls1\";", parse_cmd),
            Ok(Some(Cmd {
                name: "cmdname".to_owned(),
                attrs: hash![("class".to_owned(), Value::Str("cls1".to_owned()))],
                inner: vec![]
            }))
        );
        println!(
            "{:#?}",
            parse(
                Rule::cmd,
                "\\cmdname class=\"cls1\"{\\c1; \\c2 {\\c3;}}",
                parse_cmd
            )
        );
        assert_eq!(
            parse(
                Rule::cmd,
                "\\cmdname class=\"cls1\"{\\c1; \\c2 {\\c3;}}",
                parse_cmd
            ),
            Ok(Some(Cmd {
                name: "cmdname".to_owned(),
                attrs: hash![("class".to_owned(), Value::Str("cls1".to_owned()))],
                inner: vec![
                    TextElem::Cmd(Cmd {
                        name: "c1".to_owned(),
                        attrs: hash![],
                        inner: vec![]
                    }),
                    TextElem::Plain(" ".to_owned()),
                    TextElem::Cmd(Cmd {
                        name: "c2".to_owned(),
                        attrs: hash![],
                        inner: vec![TextElem::Cmd(Cmd {
                            name: "c3".to_owned(),
                            attrs: hash![],
                            inner: vec![]
                        })]
                    })
                ]
            }))
        );
    }
    #[test]
    fn test_text() {
        assert_eq!(
            parse(Rule::text, "{}", parse_value),
            Ok(Some(Value::Text(vec![]))),
        );
        assert_eq!(
            parse(Rule::text, "{\\}\\\\}", parse_value),
            Ok(Some(Value::Text(vec![TextElem::Plain(String::from(
                "}\\"
            )),]))),
        );
        assert_eq!(
            parse(Rule::text, "{\\cmd {foo\\red {bar}}}", parse_value),
            Ok(Some(Value::Text(vec![TextElem::Cmd(Cmd {
                name: String::from("cmd"),
                attrs: hash![],
                inner: vec![
                    TextElem::Plain(String::from("foo")),
                    TextElem::Cmd(Cmd {
                        name: String::from("red"),
                        attrs: hash![],
                        inner: vec![TextElem::Plain(String::from("bar"))]
                    }),
                ]
            })]))),
        );
    }
    #[test]
    fn test_cmds() {
        assert_eq!(
            parse(Rule::cmds, "[]", parse_value),
            Ok(Some(Value::Text(vec![]))),
        );
        assert_eq!(
            parse(Rule::cmds, "[\\cmd {foo} \\cmd2; ]", parse_value),
            Ok(Some(Value::Text(vec![
                TextElem::Cmd(Cmd {
                    name: String::from("cmd"),
                    attrs: hash![],
                    inner: vec![TextElem::Plain(String::from("foo")),]
                }),
                TextElem::Cmd(Cmd {
                    name: String::from("cmd2"),
                    attrs: hash![],
                    inner: vec![]
                })
            ]))),
        );
    }
    #[test]
    fn blockstr() {
        let src = vec!["###`", "foo", "hoge \"bar\"", "`###"].join("\n");
        assert_eq!(
            parse(Rule::blockstr, src.as_str(), parse_value),
            Ok(Some(Value::Str("\nfoo\nhoge \"bar\"\n".to_owned()))),
        );
    }
}

pub fn parse(s: &str) -> Cmd {
    parse_cmd(TextParser::parse(Rule::main, s).unwrap().next().unwrap())
}
