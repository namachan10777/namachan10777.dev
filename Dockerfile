FROM ubuntu:latest AS build-env

RUN apt-get update && \
	apt-get install -y software-properties-common && \
	add-apt-repository ppa:avsm/ppa && \
	apt-get update && \
	apt-get upgrade -y  && \
	apt-get install -y bzip2 gcc git m4 make unzip wget curl ruby opam cargo rsync

RUN useradd -m satysfi
USER satysfi

RUN opam init --comp=4.10.0 --disable-sandboxing && \
	eval $(opam config env) && \
	opam repository add satysfi-external https://github.com/gfngfn/satysfi-external-repo.git && \
	opam update

WORKDIR /home/satysfi
RUN git clone https://github.com/gfngfn/SATySFi.git
WORKDIR /home/satysfi/SATySFi
RUN opam pin add -y satysfi . && \
	opam install satysfi

RUN sed -i -e 's/oscdl/ipafont/g' ./download-fonts.sh && \
	sed -i -e 's/IPAexfont00201/IPAexfont00401/g' ./download-fonts.sh && \
	./download-fonts.sh

USER root
RUN ./install-libs.sh

WORKDIR /
RUN git clone https://github.com/namachan10777/magicpak
WORKDIR /magicpak
RUN git checkout fix-cc-flag-order && \
	cargo build --release && \
	cp target/release/magicpak /usr/local/bin

RUN cp /home/satysfi/.opam/4.10.0/bin/satysfi /usr/local/bin/satysfi

WORKDIR /
RUN magicpak /usr/bin/curl bundle-curl && \
    magicpak /bin/bash bundle-bash && \
    magicpak /bin/sh bundle-sh && \
    magicpak /usr/local/bin/satysfi bundle-satysfi && \
    magicpak /usr/bin/make bundle-make && \
    magicpak /usr/bin/zip bundle-zip && \
    magicpak /bin/mkdir bundle-mkdir

RUN mkdir bundle && \
    rsync -a bundle-curl/ bundle && \
    rsync -a bundle-satysfi/ bundle && \
    rsync -a bundle-bash/ bundle && \
    rsync -a bundle-sh/ bundle && \
    rsync -a bundle-make/ bundle && \
    rsync -a bundle-zip/ bundle && \
    rsync -a bundle-mkdir/ bundle && \
    mkdir -p bundle/usr/local/share/satysfi/dist && \
    rsync -a /usr/local/share/satysfi/dist/ bundle/usr/local/share/satysfi/dist

FROM scratch
COPY --from=build-env /bundle /.

ENTRYPOINT [ "/bin/bash" ]
