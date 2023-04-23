use clap::Parser;
use comrak::Arena;
use frontmatter::Article;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use syntect::{highlighting::ThemeSet, parsing::SyntaxSet};
use tokio::fs;
use tracing_subscriber::{fmt, EnvFilter};
use unmark::{document, Context};

#[derive(Parser)]
struct Opts {
    #[clap(short, long, required_unless_present = "example")]
    config: Option<PathBuf>,
    #[clap(short, long)]
    example: bool,
}

mod frontmatter {
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    pub struct Article {
        title: String,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Config {
    syntect_theme: String,
    root: PathBuf,
}

impl Config {
    fn example() -> Self {
        Config {
            syntect_theme: "InspiredGitHub".to_owned(),
            root: PathBuf::from("index.md"),
        }
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
    if let Some(config) = opts.config {
        let config = fs::read_to_string(config).await?;
        let config: Config = ron::from_str(&config)?;
        let src = fs::read_to_string(config.root).await?;
        let arena = Arena::new();
        let (_frontmatter, md) = unmark::parser::parse::<Article>(&arena, &src).unwrap();
        let ss = SyntaxSet::load_defaults_newlines();
        let ts = ThemeSet::load_defaults();
        let ctx = Context {
            // FIXME
            title: "Hello World!",
            theme_set: &ts,
            syntax_set: &ss,
            section_level: 0,
        };

        let tree = document(ctx, md)?;
        println!("<!DOCTYPE html>{tree}");
    } else {
        let example = Config::example();
        println!(
            "{}",
            ron::ser::to_string_pretty(&example, Default::default())?
        );
    }
    Ok(())
}
