FROM ubuntu:latest AS build-env

RUN apt-get update && \
	apt-get install -y software-properties-common && \
	add-apt-repository ppa:avsm/ppa && \
	apt-get update && \
	apt-get upgrade -y  && \
	apt-get install -y bzip2 gcc git m4 make unzip wget curl ruby opam

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


USER satysfi
RUN mkdir -p /home/satysfi/work && \
	echo "eval $(opam config env)" >> ~/.bashrc
	

FROM ubuntu:latest
COPY --from=build-env /home/satysfi/.opam/4.10.0/bin/satysfi /usr/bin/
COPY --from=build-env /usr/local/share/satysfi /usr/local/share/satysfi

RUN apt-get update && \
	apt-get upgrade -y && \
	apt-get install -y make zip curl

ENTRYPOINT [ "/bin/bash" ]
