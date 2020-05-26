use pest::iterators::Pair;
use pest::Parser;

#[derive(Parser)]
#[grammar = "grammar.pest"]
struct SrcParser;

#[derive(Debug, PartialEq)]
pub enum TextElem {
    Command(String, Vec<Value>),
    Plain(String),
}

#[derive(Debug, PartialEq)]
pub enum Value {
    Text(Vec<TextElem>),
    Int(i64),
    Float(f64),
    InlineStr(String),
    BlockStr(String),
}

fn parse_text_elem(pair: Pair<Rule>) -> TextElem {
    match pair.as_rule() {
        Rule::plain => TextElem::Plain(pair.as_str().to_owned()),
        Rule::command => {
            let mut inner = pair.into_inner();
            TextElem::Command(
                inner
                    .next()
                    .unwrap()
                    .into_inner()
                    .next()
                    .unwrap()
                    .as_str()
                    .to_owned(),
                inner.map(|arg| parse_value(arg)).collect(),
            )
        }
        _ => unreachable!(),
    }
}

fn parse_value(pair: Pair<Rule>) -> Value {
    match pair.as_rule() {
        Rule::text => Value::Text(
            pair.into_inner()
                .map(|elem| parse_text_elem(elem))
                .collect(),
        ),
        Rule::inline_string => {
            let s = pair.as_str();
            Value::InlineStr(s[1..s.len() - 1].to_owned())
        }
        Rule::block_string => {
            let s = pair.as_str();
            Value::BlockStr(s[3..s.len() - 3].to_owned())
        }
        Rule::floating => {
            let f = pair.as_str().parse().unwrap();
            Value::Float(f)
        }
        Rule::digint => {
            let i = pair.as_str().parse().unwrap();
            Value::Int(i)
        }
        Rule::hexint => {
            let s = &pair.as_str()[2..];
            Value::Int(i64::from_str_radix(s, 16).unwrap())
        }
        Rule::octint => {
            let s = &pair.as_str()[2..];
            Value::Int(i64::from_str_radix(s, 8).unwrap())
        }
        Rule::binint => {
            let s = &pair.as_str()[2..];
            Value::Int(i64::from_str_radix(s, 2).unwrap())
        }
        _ => unreachable!(),
    }
}

#[cfg(test)]
mod test_parser {
    use super::*;
    #[test]
    fn test_text() {
        assert_eq!(
            parse_value(
                SrcParser::parse(Rule::text, "{hoge}")
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Value::Text(vec![TextElem::Plain("hoge".to_owned())])
        );
    }

    #[test]
    fn test_strings() {
        assert_eq!(
            parse_value(
                SrcParser::parse(Rule::inline_string, "`hoge`")
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Value::InlineStr("hoge".to_owned())
        );
        assert_eq!(
            parse_value(
                SrcParser::parse(Rule::block_string, "```hoge```")
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Value::BlockStr("hoge".to_owned())
        );
    }

    #[test]
    fn test_floating() {
        assert_eq!(
            parse_value(
                SrcParser::parse(Rule::floating, "+.14")
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Value::Float(0.14)
        );
        assert_eq!(
            parse_value(
                SrcParser::parse(Rule::floating, "-3.14e0")
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Value::Float(-3.14)
        );
    }

    #[test]
    fn test_integer() {
        assert_eq!(
            parse_value(
                SrcParser::parse(Rule::digint, "334")
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Value::Int(334)
        );
        assert_eq!(
            parse_value(
                SrcParser::parse(Rule::hexint, "0xFF")
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Value::Int(255)
        );
    }

    #[test]
    fn test_command() {
        assert_eq!(
            parse_text_elem(
                SrcParser::parse(Rule::command, "\\abc;")
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            TextElem::Command("abc".to_owned(), vec![])
        );
        assert_eq!(
            parse_text_elem(
                SrcParser::parse(Rule::command, "\\abc{def};")
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            TextElem::Command(
                "abc".to_owned(),
                vec![Value::Text(vec![TextElem::Plain("def".to_owned())])]
            )
        );
        assert_eq!(
            parse_value(
                SrcParser::parse(Rule::text, "{\\abc `def` `ghi`;}")
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Value::Text(vec![TextElem::Command(
                "abc".to_owned(),
                vec![
                    Value::InlineStr("def".to_owned()),
                    Value::InlineStr("ghi".to_owned()),
                ]
            )])
        );
    }
}

pub fn parse(s: &str) -> TextElem {
    parse_text_elem(
        SrcParser::parse(Rule::main, s)
            .unwrap()
            .next()
            .unwrap()
            .into_inner()
            .next()
            .unwrap(),
    )
}
