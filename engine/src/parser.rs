use pest::Parser;
use pest::iterators::Pair;

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
        Rule::plain => {
            TextElem::Plain(pair.as_str().to_owned())
        },
        Rule::command => {
            let mut inner = pair.into_inner();
            TextElem::Command(
                inner.next().unwrap().as_str().to_owned(),
                inner.map(|arg| parse_value(arg)).collect())
        },
        _ => unreachable!()
    }
}

fn parse_value(pair: Pair<Rule>) -> Value {
    match pair.as_rule() {
        Rule::text => {
            Value::Text(pair.into_inner().map(|elem| parse_text_elem(elem)).collect())
        },
        Rule::inline_string => {
            let s = pair.as_str();
            Value::InlineStr(s[1..s.len()-1].to_owned())
        },
        Rule::block_string => {
            let s = pair.as_str();
            Value::BlockStr(s[3..s.len()-3].to_owned())
        },
        _ => unreachable!()
    }
}

#[cfg(test)]
mod test_parser {
    use super::*;
    #[test]
    fn test_text() {
        assert_eq!(parse_value(SrcParser::parse(Rule::text, "{hoge}").unwrap().next().unwrap()),
            Value::Text(vec![TextElem::Plain("hoge".to_owned())]));
    }

    #[test]
    fn test_strings() {
        assert_eq!(parse_value(SrcParser::parse(Rule::inline_string, "`hoge`").unwrap().next().unwrap()),
            Value::InlineStr("hoge".to_owned()));
        assert_eq!(parse_value(SrcParser::parse(Rule::block_string, "```hoge```").unwrap().next().unwrap()),
            Value::BlockStr("hoge".to_owned()));
    }

    #[test]
    fn test_command() {
        assert_eq!(parse_text_elem(SrcParser::parse(Rule::command, "\\abc;").unwrap().next().unwrap()),
            TextElem::Command("abc".to_owned(), vec![]));
        assert_eq!(parse_text_elem(SrcParser::parse(Rule::command, "\\abc{def};").unwrap().next().unwrap()),
            TextElem::Command("abc".to_owned(), vec![Value::Text(vec![TextElem::Plain("def".to_owned())])]));
    }
}

pub fn parse(s: &str) -> Value {
    parse_value(SrcParser::parse(Rule::text, s).unwrap().next().unwrap())
}
