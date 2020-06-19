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

syn match tmlCommand "\\[a-zA-Z][-a-zA-Z0-9]*"  nextgroup=@tmlCommandArgs skipwhite skipempty
syn match tmlArg "[a-zA-Z][-a-zA-Z0-9]*=" contains=@tmlValues
syn region tmlCodeBlock start="###`" end="`###"
syn region tmlStr start="\"" end="\""

syn cluster tmlCommandArgs contains=tmlArg
syn cluster tmlValues contains=tmlCodeBlock,tmlStr

hi def link tmlCommand Identifier
hi def link tmlCodeBlock String
hi def link tmlStr String
hi def link tmlArg Constant

let b:current_syntax = "tml"
