use std::fmt;

macro_rules! xml {
    ($tag:ident [ $( $prop:ident=$value:expr ),* ]) => {
        XMLElem::Single(format!("{}", stringify!($tag)), vec![
            $(
                crate::xml::Attr::Pair(format!("{}", stringify!($prop)), $value.to_owned()),
            )*
        ])
    };
    ($tag:ident [ $( $prop:ident=$value:expr ),* ] [ $( $inner:expr ),* ]) => {
        XMLElem::WithElem(format!("{}", stringify!($tag)), vec![
            $(
                crate::xml::Attr::Pair(format!("{}", stringify!($prop)), $value.to_owned()),
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
                crate::xml::Attr::Pair(format!("{}", stringify!($prop)), $value.to_owned()),
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
pub enum Attr {
    Pair(String, String),
    Single(String),
}

impl ToString for Attr {
    fn to_string(&self) -> String {
        match self {
            Attr::Pair(attr, val) => format!("{}=\"{}\"", attr, val),
            Attr::Single(attr) => attr.to_owned(),
        }
    }
}

#[derive(Clone)]
pub enum XMLElem {
    Single(String, Vec<Attr>),
    WithElem(String, Vec<Attr>, Vec<XMLElem>),
    Text(String),
    Raw(String),
}

pub struct XML {
    ver: String,
    encoding: String,
    dtd: String,
    body: XMLElem,
}

pub struct Html {
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

impl Html {
    pub fn new(dtd: &str, body: XMLElem) -> Self {
        Self {
            body,
            dtd: dtd.to_owned(),
        }
    }
}

impl fmt::Display for XMLElem {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> Result<(), fmt::Error> {
        match self {
            XMLElem::Single(name, attrs) => {
                write!(f, "<{} ", name)?;
                for attr in attrs {
                    write!(f, "{} ", attr.to_string())?;
                }
                write!(f, "/>")
            }
            XMLElem::WithElem(name, attrs, inner) => {
                write!(f, "<{} ", name)?;
                for attr in attrs {
                    write!(f, "{} ", attr.to_string())?;
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
        const WRAP_WIDTH: usize = 120;
        const INDENT: &str = "  ";
        let stringify_attrs = |attrs: &[Attr]| {
            attrs
                .iter()
                .map(|attr| attr.to_string())
                .collect::<Vec<String>>()
        };
        let attrs_length =
            |attrs: &[String]| attrs.iter().map(|s| s.len()).fold(0, |l, acc| l + acc + 1);
        let add_indent_per_attrs = |attrs: Vec<String>| {
            attrs
                .into_iter()
                .map(|line| INDENT.to_owned() + indent + &line)
                .collect()
        };
        match self {
            // UTF-8を適切に区切るのは無理なのでここはwrappingしません
            XMLElem::Text(txt) => {
                if txt.trim().is_empty() {
                    vec![]
                } else {
                    txt.trim()
                        .replace("&", "&amp;")
                        .replace(">", "&gt;")
                        .replace("<", "&lt;")
                        .split('\n')
                        .map(|s| indent.to_owned() + s.trim_start())
                        .collect()
                }
            }
            XMLElem::Single(name, attrs) => {
                let attrs = stringify_attrs(attrs);
                let attrs_length = attrs_length(&attrs);
                // < + tag        + /> + attrs
                if !attrs.is_empty()
                    && indent.len() + 1 + name.len() + attrs_length + 2 > WRAP_WIDTH
                {
                    let mut lines = Vec::new();
                    lines.push(format!("{}<{}", indent, name));
                    lines.append(&mut add_indent_per_attrs(attrs));
                    lines.push(format!("{}/>", indent));
                    lines
                } else if !attrs.is_empty() {
                    vec![format!("{}<{} {}/>", indent, name, attrs.join(" "))]
                } else {
                    vec![format!("{}<{}/>", indent, name)]
                }
            }
            XMLElem::Raw(raw) => vec![indent.to_owned() + raw],
            XMLElem::WithElem(name, attrs, inner) => {
                let stringify_inners = |indent: &str, inner: &[XMLElem]| {
                    inner
                        .iter()
                        .map(|xml| xml.pp_impl(indent))
                        .collect::<Vec<Vec<String>>>()
                        .concat()
                };
                let attrs = stringify_attrs(attrs);
                let attrs_length = attrs_length(&attrs);
                // < + tag        + > + attrs
                let mut lines = Vec::new();
                // attributes行分割
                let inners_head =
                    if !attrs.is_empty() && 1 + name.len() + 1 + attrs_length > WRAP_WIDTH {
                        lines.push(format!("{}<{}", indent, name));
                        lines.append(&mut add_indent_per_attrs(attrs));
                        format!("{}>", indent)
                    } else if !attrs.is_empty() {
                        format!("{}<{} {}>", indent, name, attrs.join(" "))
                    } else {
                        format!("{}<{}>", indent, name)
                    };
                if name == "pre" {
                    let code = inner.iter().map(|e| format!("{}", e)).collect::<Vec<String>>().join("");
                    lines.push(format!("{}{}</pre>", inners_head, code));
                }
                else {
                    let inners = stringify_inners("", inner);
                    if inners_head.len()
                        + inners.iter().map(|l| l.len()).sum::<usize>()
                        + 1
                        + name.len()
                        + 2
                        < WRAP_WIDTH
                    {
                        lines.push(format!("{}{}</{}>", inners_head, inners.join(""), name));
                    } else {
                        lines.push(inners_head);
                        lines.append(&mut stringify_inners(&(indent.to_owned() + INDENT), inner));
                        lines.push(format!("{}</{}>", indent, name));
                    }
                }
                lines
            }
        }
    }

    pub fn pretty_print(&self) -> String {
        self.pp_impl("").join("\n")
    }
}

#[cfg(test)]
mod test_pp {
    use super::*;
    #[test]
    fn test_text() {
        let xml = XMLElem::Text("hoge\nfoo\nbar".to_owned());
        assert_eq!(xml.pp_impl("  "), vec!["  hoge", "  foo", "  bar",]);
    }

    #[test]
    fn test_single() {
        let xml = xml!(img [src="https://namachan10777.dev/res/icon.jpg", alt="my icon"]);
        assert_eq!(
            xml.pp_impl("  "),
            vec!["  <img src=\"https://namachan10777.dev/res/icon.jpg\" alt=\"my icon\"/>",]
        );
        let xml = xml!(br []);
        assert_eq!(xml.pp_impl("  "), vec!["  <br/>",]);
        let xml = xml!(udhr [
            ja="人類社会のすべての構成員の固有の尊厳と平等で譲ることの出来ない",
            en="Wheres recognition of the inherent dignity and of the equal and"
        ]);
        assert_eq!(
            xml.pp_impl("  "),
            vec![
                "  <udhr",
                "    ja=\"人類社会のすべての構成員の固有の尊厳と平等で譲ることの出来ない\"",
                "    en=\"Wheres recognition of the inherent dignity and of the equal and\"",
                "  />"
            ]
        );
    }

    #[test]
    fn test_withelem() {
        let xml = xml!(udhr [] [
            xml!(ja [] [xml!("人類社会のすべての構成員の固有の尊厳と平等で譲ることの出来ない".to_owned())]),
            xml!(en [] [xml!("Wheres recognition of the inherent dignity and of the equal and".to_owned())])
        ]);
        assert_eq!(
            xml.pp_impl("  "),
            vec![
                "  <udhr>",
                "    <ja>人類社会のすべての構成員の固有の尊厳と平等で譲ることの出来ない</ja>",
                "    <en>Wheres recognition of the inherent dignity and of the equal and</en>",
                "  </udhr>"
            ]
        );
        let xml = xml!(text [] [
            xml!(span [] [xml!("あいう".to_owned())]),
            xml!(span [] [xml!("えおか".to_owned())])
        ]);
        assert_eq!(
            xml.pp_impl("  "),
            vec!["  <text><span>あいう</span><span>えおか</span></text>".to_owned()],
        );
        let xml = xml!(udhr [
            ja="人類社会のすべての構成員の固有の尊厳と平等で譲ることの出来ない",
            en="Wheres recognition of the inherent dignity and of the equal and"
        ] [
            xml!(ja [] [xml!("人類社会のすべての構成員の固有の尊厳と平等で譲ることの出来ない".to_owned())]),
            xml!(en [] [xml!("Wheres recognition of the inherent dignity and of the equal and".to_owned())])
        ]);
        assert_eq!(
            xml.pp_impl("  "),
            vec![
                "  <udhr",
                "    ja=\"人類社会のすべての構成員の固有の尊厳と平等で譲ることの出来ない\"",
                "    en=\"Wheres recognition of the inherent dignity and of the equal and\"",
                "  >",
                "    <ja>人類社会のすべての構成員の固有の尊厳と平等で譲ることの出来ない</ja>",
                "    <en>Wheres recognition of the inherent dignity and of the equal and</en>",
                "  </udhr>"
            ]
        );
        let xml = xml!(udhr [
            ja="人類社会のすべての構成員の固有の尊厳と平等で譲ることの出来ない",
            en="Wheres recognition of the inherent dignity and of the equal and"
        ] [
            xml!(span [] [xml!("あいう".to_owned())]),
            xml!(span [] [xml!("えおか".to_owned())])
        ]);
        assert_eq!(
            xml.pp_impl("  "),
            vec![
                "  <udhr",
                "    ja=\"人類社会のすべての構成員の固有の尊厳と平等で譲ることの出来ない\"",
                "    en=\"Wheres recognition of the inherent dignity and of the equal and\"",
                "  ><span>あいう</span><span>えおか</span></udhr>"
            ]
        );
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

impl XML {
    pub fn pretty_print(&self) -> String {
        format!(
            "<?xml version=\"{}\" encoding=\"{}\" ?>\n<!DOCTYPE {}>\n{}",
            self.ver,
            self.encoding,
            self.dtd,
            self.body.pretty_print()
        )
    }
}

impl Html {
    pub fn pretty_print(&self) -> String {
        format!("<!DOCTYPE {}>\n{}", self.dtd, self.body.pretty_print())
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
                        Attr::Pair("src".to_owned(), "sample.png".to_owned()),
                        Attr::Pair("alt".to_owned(), "sample image".to_owned())
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
                    vec![Attr::Pair("class".to_owned(), "hoge fuga".to_owned())],
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
                        vec![Attr::Pair("class".to_owned(), "hoge fuga".to_owned())],
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
