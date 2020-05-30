use pest::iterators::{Pair, Pairs};
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
    Block(Block),
    Dummy,
    Nest(Vec<ListItem>),
}

#[derive(Debug, PartialEq)]
pub enum Block {
    Section(String, Vec<Block>),
    ExtBlock(String, Vec<Block>),
    P(Vec<Inline>),
    Ul(Vec<ListItem>),
    Code(String, String),
}

fn parse_list(mut ps: Pairs<Rule>) -> Vec<ListItem> {
    ps.map(|p| match p.as_rule() {
        Rule::dummyline => ListItem::Dummy,
        Rule::ul1 => ListItem::Nest(parse_list(p.into_inner())),
        Rule::ul2 => ListItem::Nest(parse_list(p.into_inner())),
        Rule::ul3 => ListItem::Nest(parse_list(p.into_inner())),
        block => ListItem::Block(parse_block(p)),
    })
    .collect::<Vec<ListItem>>()
}

fn parse_block(p: Pair<Rule>) -> Block {
    let heading_common = |p: Pair<Rule>| {
        let mut inner = p.into_inner();
        let title = inner.next().unwrap().as_str().to_owned();
        let children = inner.map(parse_block).collect::<Vec<Block>>();
        Block::Section(title, children)
    };
    match p.as_rule() {
        Rule::h1 => heading_common(p),
        Rule::h2 => heading_common(p),
        Rule::h3 => heading_common(p),
        Rule::h4 => heading_common(p),
        Rule::h5 => heading_common(p),
        Rule::h6 => heading_common(p),
        Rule::ul1 => Block::Ul(parse_list(p.into_inner())),
        Rule::ul2 => Block::Ul(parse_list(p.into_inner())),
        Rule::ul3 => Block::Ul(parse_list(p.into_inner())),
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
                    .fold(String::new(), |acc, s| acc + s),
            )
        }
        Rule::extblock => {
            let mut inner = p.into_inner();
            let attr = inner.next().unwrap().as_str().to_owned();
            let children = inner.map(parse_block).collect::<Vec<Block>>();
            Block::ExtBlock(attr, children)
        }
        _ => unreachable!(),
    }
}

#[cfg(test)]
mod test {
    use super::*;
    #[test]
    fn codeblock() {
        let src = ["```bash", "hoge", "", "goo", "noo", "```"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::codeblock, src.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::Code("bash".to_owned(), "hoge\n\ngoo\nnoo\n".to_owned()),
        );
    }
    #[test]
    fn ext() {
        let src = ["==[address]", "hoge", "=="]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::extblock, src.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::ExtBlock(
                "address".to_owned(),
                vec![Block::P(vec![Inline::Text("hoge".to_owned())])]
            )
        );
    }
    #[test]
    fn list() {
        let src = [
            " * li1", " * li1", " ** li2", " ** li2", " *** li3", " ** li2",
        ]
        .iter()
        .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        let src2 = ["==[address]", "*l1", "=="]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::ul1, src.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::Ul(vec![
                ListItem::Block(Block::P(vec![Inline::Text("li1".to_owned())])),
                ListItem::Nest(vec![
                    ListItem::Block(Block::P(vec![Inline::Text("li1".to_owned())])),
                    ListItem::Nest(vec![
                        ListItem::Block(Block::P(vec![Inline::Text("li2".to_owned())])),
                        ListItem::Nest(vec![
                            ListItem::Block(Block::P(vec![Inline::Text("li2".to_owned())])),
                            ListItem::Nest(vec![ListItem::Block(Block::P(vec![Inline::Text(
                                "li3".to_owned()
                            )]))]),
                            ListItem::Nest(vec![ListItem::Block(Block::P(vec![Inline::Text(
                                "li2".to_owned()
                            )]))])
                        ])
                    ])
                ])
            ])
        );
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::extblock, src2.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::ExtBlock(
                "address".to_owned(),
                vec![Block::Ul(vec![ListItem::Block(Block::P(vec![
                    Inline::Text("l1".to_owned())
                ]))])]
            )
        );
    }
    #[test]
    fn block() {
        let src1 = "# h1";
        let src2 = "# h1\nh1";

        let src3 = ["# h1\n", "h1\n", "\n", "\n", "hoge\n"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone());
        let src4 = ["# h1", "```", "echo \"foo\"", "```", "hoge"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        println!("{}", src4);
        let src5 = [
            "#h1",
            "##h2",
            "",
            "h2 content",
            "###h3",
            "##h2",
            "###h3",
            "##h2",
        ]
        .iter()
        .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        assert_eq!(
            parse_block(SrcParser::parse(Rule::h1, src1).unwrap().next().unwrap()),
            Block::Section(" h1".to_owned(), vec![])
        );
        assert_eq!(
            parse_block(SrcParser::parse(Rule::h1, src2).unwrap().next().unwrap()),
            Block::Section(" h1\nh1".to_owned(), vec![])
        );
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::h1, src3.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::Section(
                " h1\nh1".to_owned(),
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
                " h1".to_owned(),
                vec![
                    Block::Code("text".to_owned(), "echo \"foo\"\n".to_owned()),
                    Block::P(vec![Inline::Text("hoge".to_owned())])
                ]
            )
        );
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::h1, src5.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::Section(
                "h1".to_owned(),
                vec![
                    Block::Section(
                        "h2".to_owned(),
                        vec![
                            Block::P(vec![Inline::Text("h2 content".to_owned())]),
                            Block::Section("h3".to_owned(), vec![])
                        ]
                    ),
                    Block::Section(
                        "h2".to_owned(),
                        vec![Block::Section("h3".to_owned(), vec![])]
                    ),
                    Block::Section("h2".to_owned(), vec![])
                ]
            )
        );
    }
}

pub fn parse(s: &str) -> Block {
    let toplevels = SrcParser::parse(Rule::main, s)
        .unwrap()
        .next()
        .unwrap()
        .into_inner()
        .collect::<Vec<Pair<Rule>>>();
    parse_block(toplevels[toplevels.len() - 2].clone())
}
