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

# BEGIN SCRIPTS PATH - Automatically
# Main Scripts directory
export PATH="/Users/manik/Projects/Scripts:$PATH"
# Scripts subdirectory: dotfiles
export PATH="/Users/manik/Projects/Scripts/dotfiles:$PATH"
# Scripts subdirectory: general
export PATH="/Users/manik/Projects/Scripts/general:$PATH"
# Scripts subdirectory: nas
export PATH="/Users/manik/Projects/Scripts/nas:$PATH"
# Scripts subdirectory: icons
export PATH="/Users/manik/Projects/Scripts/icons:$PATH"
# Scripts subdirectory: lib
export PATH="/Users/manik/Projects/Scripts/lib:$PATH"
# Scripts subdirectory: files
export PATH="/Users/manik/Projects/Scripts/files:$PATH"
# END SCRIPTS PATH

# ALiases
alias zshrc="${TEXT_EDITOR} ~/.zshrc"
alias ohmyzsh="${TEXT_EDITOR} ~/.oh-my-zsh"
alias vimrc="${TEXT_EDITOR} ~/.vimrc"
alias python=python3

# Ruby env stuff
if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi

[[ -f "$HOME/fig-export/dotfiles/dotfile.zsh" ]] && builtin source "$HOME/fig-export/dotfiles/dotfile.zsh"

eval "$(atuin init zsh)"

export PATH="/Users/manik/Projects/Scripts:$PATH"

# bun completions
[ -s "/Users/manik/.bun/_bun" ] && source "/Users/manik/.bun/_bun"

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Amazon Q post block. Keep at the bottom of this file.
[[ -f "${HOME}/Library/Application Support/amazon-q/shell/zshrc.post.zsh" ]] && builtin source "${HOME}/Library/Application Support/amazon-q/shell/zshrc.post.zsh"
