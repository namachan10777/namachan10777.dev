FROM rust:1.50-alpine

RUN apk update && \
    apk add --no-cache curl git jq musl-dev openssh

RUN rustup component add clippy-preview rustfmt

ENTRYPOINT ["/bin/sh"]
