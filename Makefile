all: hello.html

hello.html: articles/hello.saty
	satysfi -b --text-mode html articles/hello.saty -o hello.html
