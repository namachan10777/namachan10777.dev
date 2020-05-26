extern crate pest;
#[macro_use]
extern crate pest_derive;

pub mod backend;
pub mod frontend;

use backend::XMLElem;
use frontend::TextElem;

#[derive(Default)]
struct Context {}

fn link(tp: &str, rel: &str) -> XMLElem {
    XMLElem::Single(
        "link".to_owned(),
        vec![
            ("type".to_owned(), tp.to_owned()),
            ("href".to_owned(), rel.to_owned()),
        ],
    )
}

fn meta(pairs: Vec<(&str, &str)>) -> XMLElem {
    XMLElem::Single(
        "meta".to_owned(),
        pairs
            .into_iter()
            .map(|(a, v)| (a.to_owned(), v.to_owned()))
            .collect(),
    )
}

fn proc(_ctx: &Context, input: frontend::TextElem) -> backend::XMLElem {
    match input {
        TextElem::Plain(s) => XMLElem::Text(s),
        TextElem::Command(cmd, _args) => match cmd.as_str() {
            "index" => XMLElem::WithElem(
                "html".to_owned(),
                vec![],
                vec![XMLElem::WithElem(
                    "head".to_owned(),
                    vec![],
                    vec![
                        link("stylesheet", "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&amp;display=swap"),
                        link("stylesheet", "index.css"),
                        meta(vec![("name","twitter:card"), ("content","summary" )]),
                        meta(vec![("name","twitter:site"), ("content","@namachan10777" )]),
                        meta(vec![("name","twitter:creator"), ("content","@namachan10777" )]),
                        meta(vec![("property","og:title"), ("content","namachan10777" )]),
                        meta(vec![("property","og:description"), ("content","namachan10777")]),
                        meta(vec![("property","og:type"), ("content","article" )]),
                        meta(vec![("property","og:image"), ("content","https://namachan10777.dev/res/icon.jpg")]),
                        meta(vec![("property","og:url"), ("content","https://namachan10777.dev/index.html")]),
                    ],
                )],
            ),
            _ => panic!(format!("unknown cmd: {}", cmd.as_str())),
        },
    }
}

pub fn conv(input: frontend::TextElem) -> backend::XML {
    backend::XML::new("1.0", "UTF-8", "html", proc(&Default::default(), input))
}
