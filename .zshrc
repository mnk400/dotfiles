# Oh My Zsh
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="agnoster"
DEFAULT_USER="$USER"            # hide user@host segment (shown over SSH)
AGNOSTER_STATUS_JOB_FG=blue
plugins=(git)
source $ZSH/oh-my-zsh.sh

# Environment
export TEXT_EDITOR="vim"
export BUN_INSTALL="$HOME/.bun"

# PATH
export PATH="/Users/manik/Projects/Scripts:$PATH"
export PATH="/Users/manik/Projects/Scripts/general:$PATH"
export PATH="/Users/manik/Projects/Scripts/icons:$PATH"
export PATH="/Users/manik/Projects/Scripts/lib:$PATH"
export PATH="$BUN_INSTALL/bin:$PATH"

# Aliases
alias cat="bat -P"
alias yippie="hyperkey t"
alias zshrc="${TEXT_EDITOR} ~/.zshrc"
alias ohmyzsh="${TEXT_EDITOR} ~/.oh-my-zsh"
alias vimrc="${TEXT_EDITOR} ~/.vimrc"
alias python=python3

# Tool initialization
[[ -s "$HOME/.bun/_bun" ]] && source "$HOME/.bun/_bun"
eval "$(atuin init zsh)"
source $HOME/.creds

# Custom completions
fpath=(~/.zsh/completions $fpath)
autoload -U compinit && compinit

# BasicTeX
export PATH="/Library/TeX/texbin:$PATH"
