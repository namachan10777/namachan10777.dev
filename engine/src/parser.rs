use pest::Parser;
use pest::iterators::Pair;

#[derive(Parser)]
#[grammar = "grammar.pest"]
struct SrcParser;

pub type Command = (String, Vec<Value>);

#[derive(Debug, PartialEq)]
pub enum TextElem {
    Command(Command),
    Plain(String),
}

#[derive(Debug, PartialEq)]
pub enum Value {
    Text(Vec<TextElem>),
    Int(i64),
    Float(f64),
    Str(String),
}

fn parse_value(pair: Pair<Rule>) -> Value {
    match pair.as_rule() {
        Rule::text => {
            let s = pair.as_str();
            Value::Text(vec![TextElem::Plain(s[1..s.len()-1].to_owned())])
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
}

pub fn parse(s: &str) -> Value {
    Value::Str("".to_owned())
}
