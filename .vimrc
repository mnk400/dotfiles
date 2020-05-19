syntax on
set backspace=indent,eol,start
execute pathogen#infect()

let g:startify_custom_header = [
\'      ___                       ___',
\'     /\__\          ___        /\__\',
\'    /:/  /         /\  \      /::|  |',
\'   /:/  /          \:\  \    /:|:|  |',
\'  /:/__/  ___      /::\__\  /:/|:|__|__ ',
\'  |:|  | /\__\  __/:/\/__/ /:/ |::::\__\',
\'  |:|  |/:/  / /\/:/  /    \/__/~~/:/  /',
\'  |:|__/:/  /  \::/__/           /:/  / ',
\'   \::::/__/    \:\__\          /:/  /  ',
\'    ~~~~         \/__/         /:/  /   ',
\'                               \/__/    ',
\]               

let g:validator_python_checkers = ['flake8']

let &t_ZH="\e[3m"
let &t_ZR="\e[23m"

highlight StartifyHeader ctermfg=DarkRed
highlight Comment cterm=italic ctermfg=darkgrey
highlight Function cterm=italic ctermfg=cyan
highlight String cterm=italic ctermfg=magenta
highlight PreProc cterm=italic ctermfg=cyan
highlight Repeat cterm=italic ctermfg=yellow
highlight Label cterm=italic ctermfg=yellow
highlight Exception cterm=italic ctermfg=yellow


call pathogen#helptags()

call plug#begin('~/.vim/plugged')

Plug 'mhinz/vim-startify'
Plug 'maralla/validator.vim'
Plug 'lervag/vimtex'
Plug '~/.vim/plugged/YouCompleteMe'

call plug#end()

