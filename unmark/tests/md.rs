use std::{assert_eq, fs};

use serde::{Deserialize, Serialize};

use unmark::md::{parse, Ast};

#[derive(Deserialize, Serialize, Debug, PartialEq, Eq)]
struct TestFrontmatter {
    tag: Vec<String>,
    date: String,
}

#[test]
fn test_parse_frontmatter() {
    let frontmatter_expected = TestFrontmatter {
        tag: vec!["life".to_owned(), "tech".to_owned()],
        date: "2023/5/20".to_owned(),
    };
    let ast_expected = vec![
        Ast::Section {
            level: 1,
            title: vec![Ast::Text("Heading1".to_owned())],
            contents: vec![
                Ast::Paragraph(vec![Ast::Text("contents1".to_owned())]),
                Ast::Section {
                    level: 2,
                    title: vec![Ast::Text("Heading1.1".to_owned())],
                    contents: vec![
                        Ast::Paragraph(vec![Ast::Text("contents1.1".to_owned())]),
                        Ast::Section {
                            level: 3,
                            title: vec![Ast::Text("Heading1.1.1".to_owned())],
                            contents: vec![
                                Ast::Paragraph(vec![Ast::Text("contents1.1.1".to_owned())]),
                                Ast::Section {
                                    level: 4,
                                    title: vec![Ast::Text("Heading1.1.1.1".to_owned())],
                                    contents: vec![Ast::Paragraph(vec![Ast::Text(
                                        "contents1.1.1.1".to_owned(),
                                    )])],
                                },
                            ],
                        },
                        Ast::Section {
                            level: 3,
                            title: vec![Ast::Text("Heading1.1.2".to_owned())],
                            contents: vec![Ast::Paragraph(vec![Ast::Text(
                                "contents1.1.2".to_owned(),
                            )])],
                        },
                        Ast::Section {
                            level: 3,
                            title: vec![Ast::Text("Heading1.1.3".to_owned())],
                            contents: vec![Ast::Paragraph(vec![Ast::Text(
                                "contents1.1.3".to_owned(),
                            )])],
                        },
                    ],
                },
                Ast::Section {
                    level: 2,
                    title: vec![Ast::Text("Heading1.2".to_owned())],
                    contents: vec![Ast::Paragraph(vec![Ast::Text("contents1.2".to_owned())])],
                },
            ],
        },
        Ast::Section {
            level: 1,
            title: vec![Ast::Text("Heading2".to_owned())],
            contents: vec![Ast::Paragraph(vec![Ast::Text("contents2".to_owned())])],
        },
    ];
    let src = fs::read_to_string("tests/full.md").unwrap();
    let (ast_actual, frontmatter_actual) = parse::<TestFrontmatter>(&src).unwrap();
    assert_eq!(frontmatter_expected, frontmatter_actual);
    assert_eq!(ast_expected, ast_actual);
}
