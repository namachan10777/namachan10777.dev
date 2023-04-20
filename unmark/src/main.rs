use clap::Parser;
use comrak::Arena;
use frontmatter::Article;
use std::path::PathBuf;
use tokio::fs;
use tracing_subscriber::{fmt, EnvFilter};
use unmark::{document, Context};

#[derive(Parser)]
struct Opts {
    src: PathBuf,
}

mod frontmatter {
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
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
    let src = fs::read_to_string(opts.src).await?;
    let arena = Arena::new();
    let (_frontmatter, md) = unmark::parser::parse::<Article>(&arena, &src).unwrap();
    let ctx = Context {
        title: "Hello World!",
        section_level: 0,
    };
    let tree = document(ctx, md)?;
    println!("{tree}");
    Ok(())
}
