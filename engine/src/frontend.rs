use pest::iterators::Pair;
use pest::Parser;

#[grammar="grammar.pest"]
#[derive(Parser)]
struct SrcParser;


#[derive(Debug, PartialEq)]
pub enum Inline {
	Text(String),
	Code(String),
}


#[derive(Debug, PartialEq)]
pub enum ListItem {
	Inline(Inline),
	Nest(Vec<ListItem>),
}

#[derive(Debug, PartialEq)]
pub enum Block {
	Section(String, Vec<Block>),
	P(Vec<Inline>),
	Ul(Vec<ListItem>),
	Code(String),
}

fn parse_block(p: Pair<Rule>) -> Block {
    match p.as_rule() {
        Rule::h1 => {
            Block::Section(p.as_str()[1..].to_owned(), vec![])
        },
        _ => unreachable!(),
    }
}

#[cfg(test)]
mod test {
    use super::*;
    #[test]
    fn block() {
        let src1 = "# h1";
        let src2 = "# h1\nh1";
        assert_eq!(parse_block(SrcParser::parse(Rule::h1, src1).unwrap().next().unwrap()), Block::Section(" h1".to_owned(), vec![]));
        assert_eq!(parse_block(SrcParser::parse(Rule::h1, src2).unwrap().next().unwrap()), Block::Section(" h1\nh1".to_owned(), vec![]));
    }
}

pub fn parse(s: &str) -> Block {
    parse_block(
        SrcParser::parse(Rule::main, s)
            .unwrap()
            .next()
            .unwrap()
            .into_inner()
            .next()
            .unwrap(),
    )
}
