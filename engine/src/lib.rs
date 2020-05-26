extern crate pest;
#[macro_use]
extern crate pest_derive;

pub mod backend;
pub mod frontend;

use backend::XMLElem;

pub fn conv(input: frontend::TextElem) -> backend::XML {
	backend::XML::new("1.0", "UTF-8", "html", XMLElem::Text("hoge".to_owned()))
}
