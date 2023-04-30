#[derive(clap::Parser)]
enum SubCommand {}

#[derive(clap::Parser)]
struct Opts {
    #[clap(subcommand)]
    subcmd: SubCommand,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    use clap::Parser;
    use tracing_subscriber::{fmt, prelude::*, EnvFilter};
    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(fmt::layer())
        .init();

    let _opts = Opts::parse();
    Ok(())
}
