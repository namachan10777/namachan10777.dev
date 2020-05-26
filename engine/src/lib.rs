extern crate pest;
#[macro_use]
extern crate pest_derive;

pub mod backend;
pub mod frontend;

use backend::XMLElem;

pub fn conv(input: frontend::TextElem) -> backend::XML {
    let head = XMLElem::WithElem("head".to_owned(), vec![], vec![]);
    let body = XMLElem::WithElem("body".to_owned(), vec![], vec![]);
    backend::XML::new(
        "1.0",
        "UTF-8",
        "html",
        XMLElem::WithElem("html".to_owned(), vec![], vec![head, body]),
    )
}
