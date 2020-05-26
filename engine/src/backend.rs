use std::fmt;

enum XMLElem {
    Single(String, Vec<(String, String)>),
    WithElem(String, Vec<(String, String)>, Vec<XMLElem>),
    Text(String),
}

struct XML {
    ver: String,
    encoding: String,
    dtd: String,
    body: XMLElem,
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
            XMLElem::Text(txt) => write!(f, "{}", txt),
        }
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
