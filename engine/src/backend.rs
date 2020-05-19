enum XMLElem {
    Single(Vec<(String, String)>),
    WithElem(Vec<(String, String)>, Vec<XMLElem>),
    Text(String),
}

struct XML {
    ver: String,
    encoding: String,
    body: XMLElem,
}
