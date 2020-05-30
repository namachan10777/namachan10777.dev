use pest::iterators::Pair;
use pest::Parser;

#[derive(Parser)]
#[grammar="grammar.pest"]
struct SrcParser;

pub enum Inline {
	Text(String),
	Code(String),
}

pub enum ListItem {
	Inline(Inline),
	Nest(Vec<ListItem>),
}

pub enum Block {
	Section(String, Vec<Block>),
	P(Vec<Inline>),
	Ul(Vec<ListItem>),
	Code(String),
}

fn parse_block(_i: Pair<Rule>) -> Block {
	Block::P(vec![])
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
