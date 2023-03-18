use clap::Parser;
use pulldown_cmark::Event;
use std::path::PathBuf;
use tokio::fs;
use tracing_subscriber::{fmt, EnvFilter};

#[derive(Parser)]
struct Opts {
    src: PathBuf,
}

fn process_html<'a, Parser: Iterator<Item = Event<'a>>>(parser: Parser) {
    for event in parser {
        //debug!("{:?}", event);
    }
}

mod frontmatter {
    use serde::{Deserialize, Serialize};

    #[derive(Serialize, Deserialize)]
    pub struct Article {
        title: String,
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    use tracing_subscriber::prelude::*;
    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(fmt::layer())
        .init();

    let opts = Opts::parse();
    let mut options = pulldown_cmark::Options::empty();
    options.insert(pulldown_cmark::Options::ENABLE_STRIKETHROUGH);
    let src = fs::read_to_string(opts.src).await?;
    let parser =
        unmark::parser::ParserWithFrontMatter::<frontmatter::Article>::new_ext(&src, options)?;

    process_html(parser);
    Ok(())
}
