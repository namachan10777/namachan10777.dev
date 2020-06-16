use super::Value;
use pest::iterators::{Pair, Pairs};
use pest::Parser;

#[derive(Parser)]
#[grammar = "grammar.pest"]
struct TextParser;

#[derive(Debug, PartialEq)]
enum Error {
    InternalError(String),
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
        _ => unreachable!(),
    }
}

#[cfg(test)]
mod test {
    use super::*;
    fn parse<T, F>(rule: Rule, s: &str, f: F) -> Result<Option<T>, pest::error::Error<Rule>>
    where
        F: FnOnce(Pair<Rule>) -> T,
    {
        TextParser::parse(rule, s).map(|mut pairs| pairs.next().map(f))
    }

    #[test]
    fn parse_int() {
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
    fn parse_float() {
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
    fn parse_str() {
        assert_eq!(
            parse(Rule::str, "\"abc\"", parse_value),
            Ok(Some(Value::Str("abc".to_owned()))),
        );
        assert_eq!(
            parse(Rule::str, "\"abc\\\"def\\\\\"", parse_value),
            Ok(Some(Value::Str("abc\"def\\".to_owned()))),
        );
    }
}
