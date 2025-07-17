use std::path::Path;

use clap::Parser;
use pulldown_cmark::{Event, Tag};
use tracing::error;

#[derive(Parser)]
struct Opts {
    #[clap(short, long, default_value = "**/*.{md,mdx}")]
    glob: String,
}

pub enum Partial {
    Folded { content: String },
}

fn compile<P: AsRef<Path>>(path: P) -> anyhow::Result<String> {
    let text = std::fs::read_to_string(path.as_ref())
        .inspect_err(|e| error!(path=?path.as_ref(), e=e.to_string(), "failed to read src"))?;

    cfcms::compile(&text)?;
    Ok(Default::default())
}

fn main() -> anyhow::Result<()> {
    let opts = Opts::parse();
    for file in glob::glob(&opts.glob)? {
        let html = compile(&file?)?;
        println!("{}", html);
    }
    Ok(())
}
