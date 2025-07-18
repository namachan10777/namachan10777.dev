use std::path::PathBuf;

use anyhow::Context;
use aws_config::BehaviorVersion;
use clap::Parser;
use serde::{Deserialize, Serialize};
use tracing::error;

#[derive(Parser)]
struct Opts {
    #[clap(short, long, default_value = "cfcms.toml")]
    config: PathBuf,
}

pub enum Partial {
    Folded { content: String },
}

#[derive(Deserialize, Serialize)]
pub struct ImageConfig {
    pub endpoint: String,
    pub zone: String,
    pub bucket: String,
    pub prefix: String,
}

#[derive(Deserialize, Serialize)]
pub struct Config {
    glob: String,
    image: ImageConfig,
}

async fn build_s3_client(endpoint: &str) -> anyhow::Result<aws_sdk_s3::Client> {
    let config = aws_config::defaults(BehaviorVersion::latest())
        .endpoint_url(endpoint)
        .credentials_provider(aws_sdk_s3::config::Credentials::new(
            std::env::var("AWS_ACCESS_KEY_ID")?,
            std::env::var("AWS_SECRET_ACCESS_KEY")?,
            None,
            None,
            "R2",
        ))
        .region("auto")
        .load()
        .await;

    Ok(aws_sdk_s3::Client::new(&config))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let opts = Opts::parse();

    let config_path = opts.config.canonicalize()?;
    let config: Config = toml::from_str(&std::fs::read_to_string(&config_path)?)?;

    std::env::set_current_dir(
        config_path
            .parent()
            .with_context(|| "no parent dir found")?,
    )?;

    let compiler_config = cfcms::Config {
        image: cfcms::ImageConfig {
            zone: config.image.zone.clone(),
            prefix: config.image.prefix.clone(),
            bucket: config.image.bucket.clone(),
        },
    };
    let basedir = std::path::Path::new(".").canonicalize()?;

    let s3 = build_s3_client(&config.image.endpoint).await?;

    for path in glob::glob(&config.glob)? {
        let path = path?;
        let text = std::fs::read_to_string(&path)
            .inspect_err(|e| error!(path=?path, e=e.to_string(), "failed to read src"))?;

        cfcms::process(
            &compiler_config,
            path.to_owned(),
            basedir.clone(),
            &s3,
            &text,
        )
        .await?;
    }
    Ok(())
}
