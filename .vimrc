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

highlight StartifyHeader ctermfg=DarkRed
call pathogen#helptags()

call plug#begin('~/.vim/plugged')

Plug 'mhinz/vim-startify'
Plug 'maralla/validator.vim'
Plug 'lervag/vimtex'
call plug#end()

