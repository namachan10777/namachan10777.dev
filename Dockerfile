FROM rust:1.43 AS build-env

RUN rustup target add x86_64-unknown-linux-musl && \
    apt-get update && \
    apt-get install -y musl-tools
ADD ./engine ./engine
WORKDIR	engine
RUN cargo build --release --target=x86_64-unknown-linux-musl

FROM alpine:latest
RUN apk add git curl

COPY --from=build-env engine/target/x86_64-unknown-linux-musl/release/engine /usr/local/bin/engine

ENTRYPOINT [ "/bin/sh" ]
