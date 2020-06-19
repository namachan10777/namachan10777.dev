" File Types:   tml
" Version:      1
" Notes:
"

if version >= 600
	if exists("b:current_syntax")
		finish
	endif
else
	syntax clear
endif

setlocal iskeyword=a-z,A-Z,-,48-57
syn case match

syn keyword tmlTODO contained TODO FIXME

syn region tmlCodeBlock start="###`" end="`###"
syn match tmlCommand "\\[a-zA-Z][-a-zA-Z0-9]*" contained skipwhite skipempty

syn cluster tmlValues contains=tmlCodeBlock

hi def link tmlCommand Identifier
hi def link tmlCodeBlock String

let b:current_syntax = "tml"
