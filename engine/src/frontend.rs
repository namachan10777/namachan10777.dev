use pest::iterators::Pair;
use pest::Parser;

#[grammar = "grammar.pest"]
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
    Code(String, String),
}

fn parse_block(p: Pair<Rule>) -> Block {
    match p.as_rule() {
        Rule::h1 => {
            let mut inner = p.into_inner();
            let title = inner.next().unwrap().as_str().to_owned();
            let children = inner.map(parse_block).collect::<Vec<Block>>();
            Block::Section(title, children)
        }
        Rule::paragraph => Block::P(vec![Inline::Text(p.as_str().to_owned())]),
        Rule::codeblock => {
            let mut inner = p.into_inner();
            let heading = inner.next();
            let lang = heading
                .unwrap()
                .into_inner()
                .next()
                .map(|p| p.as_str().to_owned())
                .unwrap_or("text".to_owned());
            let src = inner
                .map(|p| p.as_str().to_owned())
                .collect::<Vec<String>>();
            Block::Code(
                lang,
                src[..src.len() - 1]
                    .into_iter()
                    .fold(String::new(), |acc, s| acc + s + "\n"),
            )
        }
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

        let src3 = ["# h1\n", "h1\n", "\n", "\n", "hoge\n"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone());
        let src4 = ["# h1\n", "```\n", "echo \"foo\"\n", "```", "hoge\n"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone());
        assert_eq!(
            parse_block(SrcParser::parse(Rule::h1, src1).unwrap().next().unwrap()),
            Block::Section("h1".to_owned(), vec![])
        );
        assert_eq!(
            parse_block(SrcParser::parse(Rule::h1, src2).unwrap().next().unwrap()),
            Block::Section("h1\nh1".to_owned(), vec![])
        );
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::h1, src3.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::Section(
                "h1\nh1".to_owned(),
                vec![Block::P(vec![Inline::Text("hoge".to_owned())])]
            )
        );
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::h1, src4.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::Section(
                "h1".to_owned(),
                vec![
                    Block::Code("text".to_owned(), "echo \"foo\"\n".to_owned()),
                    Block::P(vec![Inline::Text("hoge".to_owned())])
                ]
            )
        );
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
