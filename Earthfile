VERSION 0.6

FROM rust:1.68.2-slim-bullseye
RUN rustup component add rustfmt clippy
RUN cargo install cargo-chef
WORKDIR /work

unmark-plan:
    COPY unmark/Cargo.* .
    COPY unmark/src src
    RUN cargo chef prepare --recipe-path=recipe.json
    SAVE ARTIFACT recipe.json /recipe.json

unmark-debug-prebuild:
    COPY +unmark-plan/recipe.json recipe.json
    RUN cargo chef cook --recipe-path=recipe.json
    RUN cargo clippy

unmark-release-prebuild:
    COPY +unmark-plan/recipe.json .
    RUN cargo chef cook --recipe-path=recipe.json

unmark-test:
    FROM +unmark-debug-prebuild
    COPY unmark/src src
    RUN cargo fmt -- --check
    RUN cargo clippy -- -D warnings
    RUN cargo build
    RUN cargo test

unmark-release-build:
    FROM +unmark-debug-prebuild
    COPY unmark/src src
    RUN cargo build --release
    RUN strip target/release/unmark
    SAVE ARTIFACT target/release/unmark /unmark
