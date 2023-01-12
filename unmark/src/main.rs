use clap::Parser;
use std::path::PathBuf;
use tokio::fs;
use tracing_subscriber::{fmt, EnvFilter};

#[derive(Parser)]
struct Opts {
    src: PathBuf,
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
    let parser = pulldown_cmark::Parser::new_ext(&src, options);
    let mut html_output = String::new();
    pulldown_cmark::html::push_html(&mut html_output, parser);
    println!("{}", html_output);
    Ok(())
}
