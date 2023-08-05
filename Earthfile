VERSION 0.7

FROM rust:1.71.1-slim-bullseye
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
    SAVE IMAGE --cache-hint
    COPY unmark/src .
    COPY unmark/tests .
    RUN cargo fmt -- --check
    RUN cargo build
    RUN cargo test
    RUN cargo clippy -- -D warnings

unmark-tool:
    COPY +unmark-plan/recipe.json .
    RUN cargo chef cook --recipe-path recipe.json
    SAVE IMAGE --cache-hint
    COPY unmark/src .
    COPY unmark/test .
    RUN cargo build --release --example app
    SAVE ARTIFACT target/release/examples/app /bin



web:
    FROM debian:bullseye-slim
    COPY +root-tool/bin unmark
    COPY articles articles
    RUN ./unmark build articles