FROM rust:1.43 AS build-env

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y curl git

RUN rustup component add clippy-preview

ENTRYPOINT ["/bin/sh"]
