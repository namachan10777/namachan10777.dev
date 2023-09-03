VERSION 0.7

FROM rust:1.71.1-slim-bullseye
RUN rustup component add clippy rustfmt
RUN cargo install cargo-chef
SAVE IMAGE --cache-hint
WORKDIR /work

unmark-plan:
    COPY unmark/ .
    RUN cargo chef prepare --recipe-path recipe.json
    SAVE ARTIFACT recipe.json /recipe.json

unmark-test:
    COPY +unmark-plan/recipe.json .
    RUN cargo chef cook --recipe-path recipe.json
    RUN cargo clippy
    RUN cargo test
    SAVE IMAGE --cache-hint

    COPY unmark/ .
    RUN cargo fmt -- --check
    RUN cargo build
    RUN cargo test
    RUN cargo clippy -- -D warnings

unmark-tool:
    COPY +unmark-plan/recipe.json .
    RUN cargo chef cook --release --recipe-path recipe.json
    RUN cargo test --release # to cache dev-dependencies
    SAVE IMAGE --cache-hint
    COPY unmark/ .
    RUN cargo build --release --example app
    SAVE ARTIFACT target/release/examples/app /bin

web:
    FROM debian:bullseye-slim
    RUN apt-get update && apt-get install -y zstd
    WORKDIR /work
    COPY +unmark-tool/bin unmark
    COPY articles articles
    COPY .git .git
    RUN ./unmark build articles --dist dist
    SAVE ARTIFACT dist /dist

deploy:
    FROM node:20-bullseye-slim
    WORKDIR /work
    RUN npm install -g wrangler
    ARG --required PROJECT_NAME
    BUILD +unmark-test
    COPY +web/dist dist
    RUN --secret CLOUDFLARE_ACCOUNT_ID=CLOUDFLARE_ACCOUNT_ID --secret CLOUDFLARE_API_TOKEN=CLOUDFLARE_API_TOKEN \
        wrangler pages deploy dist --project-name=$PROJECT_NAME
