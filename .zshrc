# Kiro CLI pre block. Keep at the top of this file.
[[ -f "${HOME}/Library/Application Support/kiro-cli/shell/zshrc.pre.zsh" ]] && builtin source "${HOME}/Library/Application Support/kiro-cli/shell/zshrc.pre.zsh"

# Oh My Zsh
export ZSH="$HOME/.local/share/fig/plugins/ohmyzsh"
ZSH_THEME="Agnoster"
plugins=(git)
source $ZSH/oh-my-zsh.sh

# Environment
export TEXT_EDITOR="vim"
export BUN_INSTALL="$HOME/.bun"

# PATH
export PATH="/Users/manik/Projects/Scripts:$PATH"
export PATH="/Users/manik/Projects/Scripts/dotfiles:$PATH"
export PATH="/Users/manik/Projects/Scripts/general:$PATH"
export PATH="/Users/manik/Projects/Scripts/nas:$PATH"
export PATH="/Users/manik/Projects/Scripts/icons:$PATH"
export PATH="/Users/manik/Projects/Scripts/lib:$PATH"
export PATH="/Users/manik/Projects/Scripts/files:$PATH"
export PATH="$BUN_INSTALL/bin:$PATH"
export PATH="/Users/manik/.antigravity/antigravity/bin:$PATH"

# Aliases
alias cat="bat -P"
alias yippie="hyperkey t"
alias zshrc="${TEXT_EDITOR} ~/.zshrc"
alias ohmyzsh="${TEXT_EDITOR} ~/.oh-my-zsh"
alias vimrc="${TEXT_EDITOR} ~/.vimrc"
alias python=python3
alias a=runbook

# Tool initialization
which rbenv > /dev/null && eval "$(rbenv init -)"
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"
[[ -f "$HOME/fig-export/dotfiles/dotfile.zsh" ]] && source "$HOME/fig-export/dotfiles/dotfile.zsh"
[[ -s "$HOME/.bun/_bun" ]] && source "$HOME/.bun/_bun"
eval "$(atuin init zsh)"
source $HOME/.creds

# Custom completions
fpath=(~/.zsh/completions $fpath)
autoload -U compinit && compinit

# Kiro CLI post block. Keep at the bottom of this file.
[[ -f "${HOME}/Library/Application Support/kiro-cli/shell/zshrc.post.zsh" ]] && builtin source "${HOME}/Library/Application Support/kiro-cli/shell/zshrc.post.zsh"

# Added by Antigravity
export PATH="/Users/manik/.antigravity/antigravity/bin:$PATH"
