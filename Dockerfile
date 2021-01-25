FROM rust:1.49-alpine

RUN apk update && \
    apk add --no-cache curl git jq musl-dev

RUN rustup component add clippy-preview rustfmt

ENTRYPOINT ["/bin/sh"]
