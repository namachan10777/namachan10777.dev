use clap::Parser;
use std::path::PathBuf;

#[derive(Parser)]
struct Opts {
    src: PathBuf,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let opts = Opts::parse();
    println!("Hello, world!");
    Ok(())
}
