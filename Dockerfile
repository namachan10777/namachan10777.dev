FROM rust:1.43 AS build-env

ADD ./engine ./engine
RUN	rustup target add x86_64-unknown-linux-musl
RUN	apt-get update && \
	apt-get install -y musl-tools
WORKDIR	engine
RUN	cargo build --release --target=x86_64-unknown-linux-musl

FROM alpine:latest
RUN apk add git curl

COPY --from=build-env engine/target/x86_64-unknown-linux-musl/release/engine /usr/local/bin/engine

#ENTRYPOINT [ "/home/satysfi/.opam/4.06.0/bin/satysfi" ]
ENTRYPOINT [ "/bin/sh" ]
