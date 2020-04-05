all: hello.html

hello.html: articles/hello.saty
	satysfi -b --text-mode xhtml articles/hello.saty -o hello.xhtml
