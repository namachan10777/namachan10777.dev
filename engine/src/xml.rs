use std::fmt;

macro_rules! xml {
    ($tag:ident [ $( $prop:ident=$value:expr ),* ]) => {
        XMLElem::Single(format!("{}", stringify!($tag)), vec![
            $(
                (format!("{}", stringify!($prop)), $value.to_owned()),
            )*
        ])
    };
    ($tag:ident [ $( $prop:ident=$value:expr ),* ] [ $( $inner:expr ),* ]) => {
        XMLElem::WithElem(format!("{}", stringify!($tag)), vec![
            $(
                (format!("{}", stringify!($prop)), $value.to_owned()),
            )*
        ],
        vec![
            $(
                $inner,
            )*
        ]
        )
    };
    ($tag:ident [$( $prop:ident=$value:expr ),*] $inner:expr) => {
        XMLElem::WithElem(format!("{}", stringify!($tag)), vec![
            $(
                (format!("{}", stringify!($prop)), $value.to_owned()),
            )*
        ],
        $inner
        )
    };
    ($txt:expr) => {
        XMLElem::Text($txt)
    };
    ($txt:expr) => {
        XMLElem::Text($txt.to_owned())
    }
}

#[derive(Clone)]
pub enum XMLElem {
    Single(String, Vec<(String, String)>),
    WithElem(String, Vec<(String, String)>, Vec<XMLElem>),
    Text(String),
    Raw(String),
}

pub struct XML {
    ver: String,
    encoding: String,
    dtd: String,
    body: XMLElem,
}

impl XML {
    pub fn new(ver: &str, encoding: &str, dtd: &str, body: XMLElem) -> Self {
        XML {
            ver: ver.to_owned(),
            encoding: encoding.to_owned(),
            dtd: dtd.to_owned(),
            body,
        }
    }
}

impl XMLElem {
    pub fn extract_string(&self) -> String {
        match self {
            XMLElem::Single(_, _) => String::new(),
            XMLElem::WithElem(_, _, inner) => inner
                .iter()
                .map(|inner| inner.extract_string())
                .collect::<Vec<_>>()
                .join(""),
            XMLElem::Raw(_) => String::new(),
            XMLElem::Text(s) => s.to_owned(),
        }
    }
}

impl fmt::Display for XMLElem {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> Result<(), fmt::Error> {
        match self {
            XMLElem::Single(name, attrs) => {
                write!(f, "<{} ", name)?;
                for (name, value) in attrs {
                    write!(f, "{}=\"{}\" ", name, value)?;
                }
                write!(f, "/>")
            }
            XMLElem::WithElem(name, attrs, inner) => {
                write!(f, "<{} ", name)?;
                for (name, value) in attrs {
                    write!(f, "{}=\"{}\" ", name, value)?;
                }
                write!(f, ">")?;
                for inner in inner {
                    write!(f, "{}", inner)?;
                }
                write!(f, "</{}>", name)
            }
            XMLElem::Text(txt) => {
                let txt = txt
                    .replace("&", "&amp;")
                    .replace(">", "&gt;")
                    .replace("<", "&lt;");
                write!(f, "{}", txt)
            }
            XMLElem::Raw(raw) => write!(f, "{}", raw),
        }
    }
}

impl XMLElem {
    fn pp_impl(&self, indent: &str) -> Vec<String> {
        match self {
            XMLElem::Text(txt) => txt.split('\n').map(|s| indent.to_owned() + s).collect(),
            XMLElem::Single(name, attrs) => vec![format!(
                "{}<{}{}/>",
                indent,
                name,
                attrs
                    .iter()
                    .map(|(attr, val)| format!(" {}=\"{}\"", attr, val))
                    .collect::<Vec<String>>()
                    .join("")
            )],
            XMLElem::Raw(raw) => vec![indent.to_owned() + raw],
            XMLElem::WithElem(name, attrs, inner) => {
                unimplemented!()
            }
            _ => unimplemented!(),
        }
    }

    pub fn pretty_print(&self) -> String {
        self.pp_impl("").join("\n")
    }
}

#[cfg(test)]
mod test_pp{
    use super::*;
    #[test]
    fn test_text() {
        let xml = XMLElem::Text("hoge\nfoo\nbar".to_owned());
        assert_eq!(xml.pp_impl("  "), vec![
            "  hoge",
            "  foo",
            "  bar",
        ]);
    }

    #[test]
    fn test_single() {
        let xml = xml!(img [src="https://namachan10777.dev/res/icon.jpg", alt="my icon"]);
        assert_eq!(xml.pp_impl("  "), vec![
            "  <img src=\"https://namachan10777.dev/res/icon.jpg\" alt=\"my icon\"/>",
        ]);
        let xml = xml!(br []);
        assert_eq!(xml.pp_impl("  "), vec![
            "  <br/>",
        ]);
    }
}

impl fmt::Display for XML {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> Result<(), fmt::Error> {
        write!(
            f,
            "<?xml version=\"{}\" encoding=\"{}\" ?><!DOCTYPE {}>{}",
            self.ver, self.encoding, self.dtd, self.body
        )
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_display_for_xml_elem() {
        assert_eq!(
            format!("{}", XMLElem::Text("hoge".to_owned())),
            "hoge".to_owned()
        );
        assert_eq!(
            format!(
                "{}",
                XMLElem::Single(
                    "img".to_owned(),
                    vec![
                        ("src".to_owned(), "sample.png".to_owned()),
                        ("alt".to_owned(), "sample image".to_owned())
                    ]
                )
            ),
            "<img src=\"sample.png\" alt=\"sample image\" />"
        );
        assert_eq!(
            format!(
                "{}",
                XMLElem::WithElem(
                    "p".to_owned(),
                    vec![("class".to_owned(), "hoge fuga".to_owned())],
                    vec![
                        XMLElem::Text("inner1".to_owned()),
                        XMLElem::Single("br".to_owned(), vec![])
                    ]
                )
            ),
            "<p class=\"hoge fuga\" >inner1<br /></p>"
        );
        assert_eq!(
            format!(
                "{}",
                XML {
                    ver: "1.0".to_owned(),
                    encoding: "UTF-8".to_owned(),
                    dtd: "html".to_owned(),
                    body: XMLElem::WithElem(
                        "p".to_owned(),
                        vec![("class".to_owned(), "hoge fuga".to_owned())],
                        vec![
                            XMLElem::Text("inner1".to_owned()),
                            XMLElem::Single("br".to_owned(), vec![])
                        ]
                    )
                }
            ),
            format!(
                "{}{}{}",
                "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>",
                "<!DOCTYPE html>",
                "<p class=\"hoge fuga\" >inner1<br /></p>"
            )
        );
    }
}
