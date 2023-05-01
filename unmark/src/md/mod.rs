use std::borrow::Cow;


#[derive(Debug, PartialEq, Eq, Clone)]
pub enum InlineContent<'a> {
    Text(Cow<'a, str>),
    Bold(InlineContents<'a>),
    Italic(InlineContents<'a>),
    BoldItalic(InlineContents<'a>),
    Link {
        text: InlineContents<'a>,
        url: Cow<'a, str>,
    },
    Image {
        alt: Cow<'a, str>,
        url: Cow<'a, str>,
    },
    Break
}

pub type InlineContents<'a> = Vec<InlineContent<'a>>;

pub enum BlockContent<'a> {
    Paragraph(InlineContents<'a>),
    Section {
        header: InlineContents<'a>,
        level: u8,
        inner: BlockContents<'a>,
    },
    BlockQuote(BlockContents<'a>),
    UnorderedList(Vec<BlockContents<'a>>),
    OrderedList(Vec<BlockContents<'a>>),

}

pub type BlockContents<'a> = Vec<BlockContent<'a>>;