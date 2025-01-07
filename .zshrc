# Amazon Q pre block. Keep at the top of this file.
[[ -f "${HOME}/Library/Application Support/amazon-q/shell/zshrc.pre.zsh" ]] && builtin source "${HOME}/Library/Application Support/amazon-q/shell/zshrc.pre.zsh"
# Path to your oh-my-zsh installation.
export ZSH="$HOME/.local/share/fig/plugins/ohmyzsh"

# ZSH theme
ZSH_THEME="Agnoster"

# Plugins
plugins=(git)

# Source stuff
# oh my zsh
source $ZSH/oh-my-zsh.sh
# rust
source "$HOME/.cargo/env"

#### User Config ####
#####################

# Setting texteditor 
export TEXT_EDITOR="vim"

# Script directories
SCRIPTS="/Users/manik/Projects/Scripts/nas:/Users/manik/Projects/Scripts/dotfiles:/Users/manik/Projects/Scripts/photos"

# Adding directories to PATH
export PATH="$PATH:$SCRIPTS"

# ALiases
alias zshrc="${TEXT_EDITOR} ~/.zshrc"
alias ohmyzsh="${TEXT_EDITOR} ~/.oh-my-zsh"
alias vimrc="${TEXT_EDITOR} ~/.vimrc"
alias python=python3

# Ruby env stuff
if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi


[[ -f "$HOME/fig-export/dotfiles/dotfile.zsh" ]] && builtin source "$HOME/fig-export/dotfiles/dotfile.zsh"

# Amazon Q post block. Keep at the bottom of this file.
[[ -f "${HOME}/Library/Application Support/amazon-q/shell/zshrc.post.zsh" ]] && builtin source "${HOME}/Library/Application Support/amazon-q/shell/zshrc.post.zsh"
