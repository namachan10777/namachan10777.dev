use super::{Attribute, Block, Inline, ListItem};
use pest::error::LineColLocation;
use pest::iterators::{Pair, Pairs};
use pest::Parser;

#[derive(Debug)]
pub struct Pos {
    pub line: usize,
    pub col: usize,
}

#[derive(Debug)]
pub enum Erorr {
    At(String, Pos),
    Span(String, Pos, Pos),
}

pub type PResult<T> = Result<T, Erorr>;

#[grammar = "grammar.pest"]
#[derive(Parser)]
struct SrcParser;

fn parse_inlines(ps: Pairs<Rule>) -> Vec<Inline> {
    let mut s = String::new();
    let mut inlines = Vec::new();
    for p in ps {
        match p.as_rule() {
            Rule::block_escapes => s.push_str(&p.as_str()[1..]),
            Rule::visibleel => s.push_str(&p.as_str()),
            Rule::inlinetext => p.into_inner().for_each(|p| match p.as_rule() {
                Rule::white => s.push_str(&p.as_str()),
                Rule::inline_escapes => s.push_str(&p.as_str()[1..]),
                Rule::plain => s.push_str(&p.as_str()),
                Rule::link => {
                    let mut inner = p.into_inner();
                    let txt = parse_inlines(inner.next().unwrap().into_inner());
                    let url = inner.next().unwrap().as_str().to_owned();
                    if !s.is_empty() {
                        inlines.push(Inline::Text(s.clone()));
                        s.clear();
                    }
                    inlines.push(Inline::Link(txt, url));
                }
                Rule::img => {
                    let mut inner = p.into_inner();
                    let txt = inner.next().unwrap().as_str().to_owned();
                    let url = inner.next().unwrap().as_str().to_owned();
                    if !s.is_empty() {
                        inlines.push(Inline::Text(s.clone()));
                        s.clear();
                    }
                    inlines.push(Inline::Img(txt, url));
                }
                Rule::inline_ext => {
                    let mut inner = p.into_inner();
                    let extname = inner.next().unwrap().as_str().to_owned();
                    let extinner = inner.next().unwrap().as_str().to_owned();
                    if !s.is_empty() {
                        inlines.push(Inline::Text(s.clone()));
                        s.clear();
                    }
                    inlines.push(Inline::Ext(extname, extinner));
                }
                Rule::inline_code => {
                    if !s.is_empty() {
                        inlines.push(Inline::Text(s.clone()));
                        s.clear();
                    }
                    inlines.push(Inline::Code(
                        p.into_inner()
                            .map(|e| match e.as_rule() {
                                Rule::inline_code_elem => &e.as_str(),
                                Rule::escaped_code => &e.as_str()[1..],
                                _ => unreachable!(),
                            })
                            .fold(String::new(), |acc, s| acc + s),
                    ));
                }
                _ => unimplemented!(),
            }),
            r => {
                println!("{:?}", r);
                unreachable!()
            }
        }
    }
    if !s.is_empty() {
        inlines.push(Inline::Text(s));
    }
    inlines
}

fn parse_paragraphlines(ps: Pairs<Rule>) -> Vec<Inline> {
    ps.map(|p| parse_inlines(p.into_inner()))
        .fold(vec![], |mut acc, mut v| {
            acc.append(&mut v);
            acc
        })
}

fn parse_list(ps: Pairs<Rule>) -> Vec<ListItem> {
    ps.map(|p| {
        p.into_inner()
            .map(|p| match p.as_rule() {
                Rule::dummyline => ListItem::Dummy,
                Rule::ul1 => ListItem::Nest(parse_list(p.into_inner())),
                Rule::ul2 => ListItem::Nest(parse_list(p.into_inner())),
                Rule::ul3 => ListItem::Nest(parse_list(p.into_inner())),
                _ => ListItem::Block(parse_block(p)),
            })
            .collect::<Vec<ListItem>>()
    })
    .fold(vec![], |mut acc, mut v| {
        acc.append(&mut v);
        acc
    })
}

fn parse_block(p: Pair<Rule>) -> Block {
    let heading_common = |p: Pair<Rule>| {
        let mut inner = p.into_inner();
        let title = parse_paragraphlines(inner.next().unwrap().into_inner());
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
        Rule::paragraph => Block::P(parse_paragraphlines(p.into_inner())),
        Rule::codeblock => {
            let mut inner = p.into_inner();
            let heading = inner.next();
            let lang = heading
                .unwrap()
                .into_inner()
                .next()
                .map(|p| p.as_str().trim_end().to_owned())
                .unwrap_or_else(|| "text".to_owned());
            let src = inner
                .map(|p| p.as_str().to_owned())
                .collect::<Vec<String>>();
            Block::Code(
                lang,
                src[..src.len() - 1]
                    .iter()
                    .fold(String::new(), |acc, s| acc + s),
            )
        }
        Rule::extblock => {
            let mut inner = p.into_inner();
            let attr = inner.next().unwrap().as_str().to_owned();
            let children = inner.map(parse_block).collect::<Vec<Block>>();
            Block::ExtBlock(attr, children)
        }
        x => {
            println!("{:?}", x);
            unreachable!()
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    #[test]
    fn inline_code() {
        let src = "`hoge`\n";
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::paragraph, src)
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::P(vec![
                Inline::Code("hoge".to_owned()),
                Inline::Text("\n".to_owned()),
            ])
        );
    }
    #[test]
    fn link() {
        let src = "[![img](./img.jpg)](https://example.com)\n";
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::paragraph, src)
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::P(vec![
                Inline::Link(
                    vec![Inline::Img("img".to_owned(), "./img.jpg".to_owned())],
                    "https://example.com".to_owned()
                ),
                Inline::Text("\n".to_owned()),
            ])
        );
    }
    #[test]
    fn escape() {
        let src = ["#h1", "\\\\```", "```", "hoge", "```"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::h1, src.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::Section(
                vec![
                    Inline::Text("h1\n".to_owned()),
                    Inline::Text("\\```\n".to_owned())
                ],
                vec![Block::Code("text".to_owned(), "hoge\n".to_owned())]
            )
        );
    }
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
    fn paragraph() {
        let src = ["hoge", "fuga"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::paragraph, src.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::P(vec![
                Inline::Text("hoge\n".to_owned()),
                Inline::Text("fuga\n".to_owned())
            ])
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
                vec![Block::P(vec![Inline::Text("hoge\n".to_owned())])]
            )
        );
    }
    #[test]
    fn inline_ext() {
        let src = ["$link[hoge]"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::paragraph, src.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::P(vec![
                Inline::Ext("link".to_owned(), "hoge".to_owned()),
                Inline::Text("\n".to_owned()),
            ])
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
                ListItem::Block(Block::P(vec![Inline::Text(" li1\n".to_owned())])),
                ListItem::Block(Block::P(vec![Inline::Text(" li1\n".to_owned())])),
                ListItem::Nest(vec![
                    ListItem::Block(Block::P(vec![Inline::Text(" li2\n".to_owned())])),
                    ListItem::Block(Block::P(vec![Inline::Text(" li2\n".to_owned())])),
                    ListItem::Nest(vec![ListItem::Block(Block::P(vec![Inline::Text(
                        " li3\n".to_owned()
                    )]))]),
                    ListItem::Block(Block::P(vec![Inline::Text(" li2\n".to_owned())]))
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
                    Inline::Text("l1\n".to_owned())
                ]))])]
            )
        );
        let src3 = [" * [fu](fa)"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::ul1, src3.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::Ul(vec![ListItem::Block(Block::P(vec![
                Inline::Text(" ".to_owned()),
                Inline::Link(vec![Inline::Text("fu".to_owned())], "fa".to_owned()),
                Inline::Text("\n".to_owned()),
            ]))])
        );
        let src3 = [" * $link[hoge]"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::ul1, src3.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::Ul(vec![ListItem::Block(Block::P(vec![
                Inline::Text(" ".to_owned()),
                Inline::Ext("link".to_owned(), "hoge".to_owned()),
                Inline::Text("\n".to_owned()),
            ]))])
        );
    }
    #[test]
    fn block() {
        let src1 = "# h1\n";
        let src2 = "# h1\nh1\n";

        let src3 = ["# h1", "h1", "", "", "hoge"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x + "\n");
        let src4 = ["# h1", "```", "echo \"foo\"", "```", "hoge"]
            .iter()
            .fold("".to_owned(), |acc, x| acc + x.clone() + "\n");
        println!("{}", src2);
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
            Block::Section(vec![Inline::Text(" h1\n".to_owned())], vec![])
        );
        assert_eq!(
            parse_block(SrcParser::parse(Rule::h1, src2).unwrap().next().unwrap()),
            Block::Section(
                vec![
                    Inline::Text(" h1\n".to_owned()),
                    Inline::Text("h1\n".to_owned())
                ],
                vec![]
            )
        );
        assert_eq!(
            parse_block(
                SrcParser::parse(Rule::h1, src3.as_str())
                    .unwrap()
                    .next()
                    .unwrap()
            ),
            Block::Section(
                vec![
                    Inline::Text(" h1\n".to_owned()),
                    Inline::Text("h1\n".to_owned())
                ],
                vec![Block::P(vec![Inline::Text("hoge\n".to_owned())])]
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
                vec![Inline::Text(" h1\n".to_owned())],
                vec![
                    Block::Code("text".to_owned(), "echo \"foo\"\n".to_owned()),
                    Block::P(vec![Inline::Text("hoge\n".to_owned())])
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
                vec![Inline::Text("h1\n".to_owned())],
                vec![
                    Block::Section(
                        vec![Inline::Text("h2\n".to_owned())],
                        vec![
                            Block::P(vec![Inline::Text("h2 content\n".to_owned())]),
                            Block::Section(vec![Inline::Text("h3\n".to_owned())], vec![])
                        ]
                    ),
                    Block::Section(
                        vec![Inline::Text("h2\n".to_owned())],
                        vec![Block::Section(
                            vec![Inline::Text("h3\n".to_owned())],
                            vec![]
                        )]
                    ),
                    Block::Section(vec![Inline::Text("h2\n".to_owned())], vec![])
                ]
            )
        );
    }
}

pub fn parse_attribute(pairs: Pairs<Rule>) -> Attribute {
    let mut attr: Attribute = Default::default();
    for pair in pairs {
        match pair.as_rule() {
            Rule::attribute => {
                let mut inner = pair.into_inner();
                if let "date" = inner.next().unwrap().as_str() {
                    let date = inner.next().unwrap().as_str().trim().parse().unwrap();
                    attr.date = Some(date);
                }
            }
            _ => unreachable!(),
        }
    }
    attr
}

pub fn parse(filename: String, s: &str) -> PResult<(Attribute, Vec<Block>)> {
    let mut inner = SrcParser::parse(Rule::main, s)
        .map_err(|e| match e.line_col {
            LineColLocation::Pos((col, line)) => Erorr::At(filename, Pos { col, line }),
            LineColLocation::Span((col1, line1), (col2, line2)) => Erorr::Span(
                filename,
                Pos {
                    col: col1,
                    line: line1,
                },
                Pos {
                    col: col2,
                    line: line2,
                },
            ),
        })?
        .next()
        .unwrap()
        .into_inner();
    let attribute = parse_attribute(inner.next().unwrap().into_inner());
    Ok((
        attribute,
        inner
            .map(|p| match p.as_rule() {
                Rule::top_block => Some(parse_block(p.into_inner().next().unwrap())),
                _ => None,
            })
            .filter_map(|p| p)
            .collect::<Vec<Block>>(),
    ))
}
