"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs-extra");
const latex_utensils_1 = require("latex-utensils");
class Command {
    constructor(extension) {
        this.packages = [];
        this.bracketCmds = {};
        this.definedCmds = {};
        this.defaultCmds = [];
        this.defaultSymbols = [];
        this.packageCmds = {};
        this.extension = extension;
    }
    initialize(defaultCmds, defaultEnvs) {
        const snippetReplacements = vscode.workspace.getConfiguration('latex-workshop').get('intellisense.commandsJSON.replace');
        // Initialize default commands and `latex-mathsymbols`
        Object.keys(defaultCmds).forEach(key => {
            if (key in snippetReplacements) {
                const action = snippetReplacements[key];
                if (action !== '') {
                    defaultCmds[key].snippet = action;
                    this.defaultCmds.push(this.entryToCompletion(defaultCmds[key]));
                }
            }
            else {
                this.defaultCmds.push(this.entryToCompletion(defaultCmds[key]));
            }
        });
        // Initialize default env begin-end pairs, de-duplication
        Array.from(new Set(defaultEnvs)).forEach(env => {
            const suggestion = {
                label: env,
                kind: vscode.CompletionItemKind.Snippet,
                package: ''
            };
            // Use 'an' or 'a' depending on the first letter
            const art = ['a', 'e', 'i', 'o', 'u'].includes(`${env}`.charAt(0)) ? 'an' : 'a';
            suggestion.detail = `Insert ${art} ${env} environment.`;
            if (['enumerate', 'itemize'].includes(env)) {
                suggestion.insertText = new vscode.SnippetString(`begin{${env}}\n\t\\item $0\n\\\\end{${env}}`);
            }
            else {
                suggestion.insertText = new vscode.SnippetString(`begin{${env}}\n\t$0\n\\\\end{${env}}`);
            }
            suggestion.filterText = env;
            this.defaultCmds.push(suggestion);
        });
        // Handle special commands with brackets
        const bracketCmds = ['(', '[', '{', 'left(', 'left[', 'left\\{'];
        this.defaultCmds.filter(cmd => bracketCmds.includes(this.getCmdName(cmd))).forEach(cmd => {
            this.bracketCmds[cmd.label.slice(1)] = cmd;
        });
    }
    provide() {
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        const useOptionalArgsEntries = configuration.get('intellisense.optionalArgsEntries.enabled');
        const suggestions = [];
        const cmdList = []; // This holds defined commands without the backslash
        // Insert default commands
        this.defaultCmds.forEach(cmd => {
            if (!useOptionalArgsEntries && this.getCmdName(cmd).includes('[')) {
                return;
            }
            suggestions.push(cmd);
            cmdList.push(this.getCmdName(cmd, true));
        });
        // Insert unimathsymbols
        if (configuration.get('intellisense.unimathsymbols.enabled')) {
            if (this.defaultSymbols.length === 0) {
                const symbols = JSON.parse(fs.readFileSync(`${this.extension.extensionRoot}/data/unimathsymbols.json`).toString());
                Object.keys(symbols).forEach(key => {
                    this.defaultSymbols.push(this.entryToCompletion(symbols[key]));
                });
            }
            this.defaultSymbols.forEach(symbol => {
                suggestions.push(symbol);
                cmdList.push(this.getCmdName(symbol, true));
            });
        }
        // Insert commands from packages
        const extraPackages = configuration.get('intellisense.package.extra');
        if (extraPackages) {
            extraPackages.forEach(pkg => {
                this.provideCmdInPkg(pkg, suggestions, cmdList);
            });
        }
        this.extension.manager.getIncludedTeX().forEach(tex => {
            const pkgs = this.extension.manager.cachedContent[tex].element.package;
            if (pkgs === undefined) {
                return;
            }
            pkgs.forEach(pkg => this.provideCmdInPkg(pkg, suggestions, cmdList));
        });
        // Start working on commands in tex
        this.extension.manager.getIncludedTeX().forEach(tex => {
            const cmds = this.extension.manager.cachedContent[tex].element.command;
            if (cmds === undefined) {
                return;
            }
            cmds.forEach(cmd => {
                if (!cmdList.includes(this.getCmdName(cmd, true))) {
                    suggestions.push(cmd);
                    cmdList.push(this.getCmdName(cmd, true));
                }
            });
        });
        return suggestions;
    }
    /**
     * @param content a string to be surrounded. If not provided, then we
     * loop over all the selections and surround each of them
     */
    surround(content) {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        const candidate = [];
        this.provide().forEach(item => {
            if (item.insertText === undefined) {
                return;
            }
            if (item.label === '\\begin') { // Causing a lot of trouble
                return;
            }
            const command = (typeof item.insertText !== 'string') ? item.insertText.value : item.insertText;
            if (command.match(/(.*)(\${\d.*?})/)) {
                candidate.push(command.replace(/\n/g, '').replace(/\t/g, '').replace('\\\\', '\\'));
            }
        });
        vscode.window.showQuickPick(candidate, {
            placeHolder: 'Press ENTER to surround previous selection with selected command',
            matchOnDetail: true,
            matchOnDescription: true
        }).then(selected => {
            if (selected === undefined) {
                return;
            }
            editor.edit(editBuilder => {
                let selectedCommand = selected;
                let selectedContent = content;
                for (const selection of editor.selections) {
                    if (!content) {
                        selectedContent = editor.document.getText(selection);
                        selectedCommand = '\\' + selected;
                    }
                    editBuilder.replace(new vscode.Range(selection.start, selection.end), selectedCommand.replace(/(.*)(\${\d.*?})/, `$1${selectedContent}`) // Replace text
                        .replace(/\${\d:?(.*?)}/g, '$1') // Remove snippet placeholders
                        .replace('\\\\', '\\') // Unescape backslashes, e.g., begin{${1:env}}\n\t$2\n\\\\end{${1:env}}
                        .replace(/\$\d/, '')); // Remove $2 etc
                }
            });
        });
        return;
    }
    update(file, nodes, content) {
        // Remove newcommand cmds, because they will be re-insert in the next step
        Object.keys(this.definedCmds).forEach(cmd => {
            if (this.definedCmds[cmd].file === file) {
                delete this.definedCmds[cmd];
            }
        });
        if (nodes !== undefined) {
            this.extension.manager.cachedContent[file].element.command = this.getCmdFromNodeArray(file, nodes);
        }
        else if (content !== undefined) {
            this.extension.manager.cachedContent[file].element.command = this.getCmdFromContent(file, content);
        }
    }
    getCmdName(item, removeArgs = false) {
        const name = item.filterText ? item.filterText : item.label.slice(1);
        if (removeArgs) {
            const i = name.search(/[[{]/);
            return i > -1 ? name.substr(0, i) : name;
        }
        return name;
    }
    getCmdFromNodeArray(file, nodes, cmdList = []) {
        let cmds = [];
        nodes.forEach(node => {
            cmds = cmds.concat(this.getCmdFromNode(file, node, cmdList));
        });
        return cmds;
    }
    updatePkg(file, nodes, content) {
        if (nodes !== undefined) {
            nodes.forEach(node => {
                if (latex_utensils_1.latexParser.isCommand(node) && node.name === 'usepackage') {
                    node.args.forEach(arg => {
                        if (latex_utensils_1.latexParser.isOptionalArg(arg)) {
                            return;
                        }
                        for (const c of arg.content) {
                            if (!latex_utensils_1.latexParser.isTextString(c)) {
                                continue;
                            }
                            c.content.split(',').forEach(pkg => {
                                pkg = pkg.trim();
                                if (pkg === '') {
                                    return;
                                }
                                const pkgs = this.extension.manager.cachedContent[file].element.package;
                                if (pkgs) {
                                    pkgs.push(pkg);
                                }
                                else {
                                    this.extension.manager.cachedContent[file].element.package = [pkg];
                                }
                            });
                        }
                    });
                }
                else {
                    if (latex_utensils_1.latexParser.hasContentArray(node)) {
                        this.updatePkg(file, node.content);
                    }
                }
            });
        }
        else if (content !== undefined) {
            const pkgReg = /\\usepackage(?:\[[^[\]{}]*\])?{(.*)}/g;
            const pkgs = [];
            if (this.extension.manager.cachedContent[file].element.package === undefined) {
                this.extension.manager.cachedContent[file].element.package = [];
            }
            while (true) {
                const result = pkgReg.exec(content);
                if (result === null) {
                    break;
                }
                result[1].split(',').forEach(pkg => {
                    pkg = pkg.trim();
                    if (pkgs.includes(pkg)) {
                        return;
                    }
                    const filePkgs = this.extension.manager.cachedContent[file].element.package;
                    if (filePkgs !== undefined) {
                        filePkgs.push(pkg);
                    }
                });
            }
        }
    }
    getCmdFromNode(file, node, cmdList = []) {
        const cmds = [];
        if (latex_utensils_1.latexParser.isDefCommand(node)) {
            const name = node.token.slice(1);
            if (!cmdList.includes(name)) {
                const cmd = {
                    label: `\\${name}`,
                    kind: vscode.CompletionItemKind.Function,
                    documentation: '`' + name + '`',
                    insertText: new vscode.SnippetString(name + this.getArgsFromNode(node)),
                    filterText: name,
                    package: ''
                };
                cmds.push(cmd);
                cmdList.push(name);
            }
        }
        else if (latex_utensils_1.latexParser.isCommand(node)) {
            if (!cmdList.includes(node.name)) {
                const cmd = {
                    label: `\\${node.name}`,
                    kind: vscode.CompletionItemKind.Function,
                    documentation: '`' + node.name + '`',
                    insertText: new vscode.SnippetString(node.name + this.getArgsFromNode(node)),
                    filterText: node.name,
                    package: ''
                };
                if (node.name.match(/([a-zA-Z]*(cite|ref)[a-zA-Z]*)|bibentry|begin/)) {
                    cmd.command = { title: 'Post-Action', command: 'editor.action.triggerSuggest' };
                }
                cmds.push(cmd);
                cmdList.push(node.name);
            }
            if (['newcommand', 'renewcommand', 'providecommand', 'DeclarePairedDelimiter', 'DeclarePairedDelimiterX', 'DeclarePairedDelimiterXPP'].includes(node.name) &&
                Array.isArray(node.args) && node.args.length > 0) {
                const label = node.args[0].content[0].name;
                let args = '';
                if (latex_utensils_1.latexParser.isOptionalArg(node.args[1])) {
                    const numArgs = parseInt(node.args[1].content[0].content);
                    for (let i = 1; i <= numArgs; ++i) {
                        args += '{${' + i + '}}';
                    }
                }
                if (!cmdList.includes(label)) {
                    const cmd = {
                        label: `\\${label}`,
                        kind: vscode.CompletionItemKind.Function,
                        documentation: '`' + label + '`',
                        insertText: new vscode.SnippetString(label + args),
                        filterText: label,
                        package: 'user-defined'
                    };
                    cmds.push(cmd);
                    this.definedCmds[label] = {
                        file,
                        location: new vscode.Location(vscode.Uri.file(file), new vscode.Position(node.location.start.line - 1, node.location.start.column))
                    };
                    cmdList.push(label);
                }
            }
        }
        if (latex_utensils_1.latexParser.hasContentArray(node)) {
            return cmds.concat(this.getCmdFromNodeArray(file, node.content, cmdList));
        }
        return cmds;
    }
    getArgsFromNode(node) {
        let args = '';
        if (!('args' in node)) {
            return args;
        }
        let index = 0;
        if (latex_utensils_1.latexParser.isCommand(node)) {
            node.args.forEach(arg => {
                ++index;
                if (latex_utensils_1.latexParser.isOptionalArg(arg)) {
                    args += '[${' + index + '}]';
                }
                else {
                    args += '{${' + index + '}}';
                }
            });
            return args;
        }
        if (latex_utensils_1.latexParser.isDefCommand(node)) {
            node.args.forEach(arg => {
                ++index;
                if (latex_utensils_1.latexParser.isCommandParameter(arg)) {
                    args += '{${' + index + '}}';
                }
            });
            return args;
        }
        return args;
    }
    getCmdFromContent(file, content) {
        const cmdReg = /\\([a-zA-Z@]+)({[^{}]*})?({[^{}]*})?({[^{}]*})?/g;
        const cmds = [];
        const cmdList = [];
        while (true) {
            const result = cmdReg.exec(content);
            if (result === null) {
                break;
            }
            if (cmdList.includes(result[1])) {
                continue;
            }
            const cmd = {
                label: `\\${result[1]}`,
                kind: vscode.CompletionItemKind.Function,
                documentation: '`' + result[1] + '`',
                insertText: new vscode.SnippetString(this.getArgsFromRegResult(result)),
                filterText: result[1],
                package: ''
            };
            if (result[1].match(/([a-zA-Z]*(cite|ref)[a-zA-Z]*)|bibentry|begin/)) {
                cmd.command = { title: 'Post-Action', command: 'editor.action.triggerSuggest' };
            }
            cmds.push(cmd);
            cmdList.push(result[1]);
        }
        const newCommandReg = /\\(?:(?:(?:re|provide)?(?:new)?command)|(?:DeclarePairedDelimiter(?:X|XPP)?))(?:{)?\\(\w+)/g;
        while (true) {
            const result = newCommandReg.exec(content);
            if (result === null) {
                break;
            }
            if (cmdList.includes(result[1])) {
                continue;
            }
            const cmd = {
                label: `\\${result[1]}`,
                kind: vscode.CompletionItemKind.Function,
                documentation: '`' + result[1] + '`',
                insertText: result[1],
                filterText: result[1],
                package: 'user-defined'
            };
            cmds.push(cmd);
            cmdList.push(result[1]);
            this.definedCmds[result[1]] = {
                file,
                location: new vscode.Location(vscode.Uri.file(file), new vscode.Position(content.substr(0, result.index).split('\n').length - 1, 0))
            };
        }
        return cmds;
    }
    getArgsFromRegResult(result) {
        let text = result[1];
        if (result[2]) {
            text += '{${1}}';
        }
        if (result[3]) {
            text += '{${2}}';
        }
        if (result[4]) {
            text += '{${3}}';
        }
        return text;
    }
    entryToCompletion(item) {
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        const useTabStops = configuration.get('intellisense.useTabStops.enabled');
        const backslash = item.command.startsWith(' ') ? '' : '\\';
        const label = item.label ? `${item.label}` : `${backslash}${item.command}`;
        const suggestion = {
            label,
            kind: vscode.CompletionItemKind.Function,
            package: 'latex'
        };
        if (item.snippet) {
            if (useTabStops) {
                item.snippet = item.snippet.replace(/\$\{(\d+):[^}]*\}/g, '$${$1}');
            }
            suggestion.insertText = new vscode.SnippetString(item.snippet);
        }
        else {
            suggestion.insertText = item.command;
        }
        if (item.label) {
            suggestion.filterText = item.command;
        }
        suggestion.detail = item.detail;
        suggestion.documentation = item.documentation ? item.documentation : '`' + item.command + '`';
        suggestion.sortText = item.command.replace(/^[a-zA-Z]/, c => {
            const n = c.match(/[a-z]/) ? c.toUpperCase().charCodeAt(0) : c.toLowerCase().charCodeAt(0);
            return n !== undefined ? n.toString(16) : c;
        });
        if (item.postAction) {
            suggestion.command = { title: 'Post-Action', command: item.postAction };
        }
        else if (/[a-zA-Z]*([Cc]ite|ref|input)[a-zA-Z]*|(sub)?(import|includefrom|inputfrom)/.exec(item.command)) {
            // Automatically trigger completion if the command is for citation, filename or reference
            suggestion.command = { title: 'Post-Action', command: 'editor.action.triggerSuggest' };
        }
        return suggestion;
    }
    provideCmdInPkg(pkg, suggestions, cmdList) {
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        if (!(configuration.get('intellisense.package.enabled'))) {
            return;
        }
        const useOptionalArgsEntries = configuration.get('intellisense.optionalArgsEntries.enabled');
        // Load command in pkg
        if (!(pkg in this.packageCmds)) {
            let filePath = `${this.extension.extensionRoot}/data/packages/${pkg}_cmd.json`;
            if (!fs.existsSync(filePath)) {
                // Many package with names like toppackage-config.sty are just wrappers around
                // the general package toppacke.sty and do not define commands on their own.
                const indexDash = pkg.lastIndexOf('-');
                if (indexDash > -1) {
                    const generalPkg = pkg.substring(0, indexDash);
                    filePath = `${this.extension.extensionRoot}/data/packages/${generalPkg}_cmd.json`;
                }
            }
            this.packageCmds[pkg] = [];
            if (fs.existsSync(filePath)) {
                const cmds = JSON.parse(fs.readFileSync(filePath).toString());
                Object.keys(cmds).forEach(key => {
                    this.packageCmds[pkg].push(this.entryToCompletion(cmds[key]));
                });
            }
            else {
                this.packageCmds[pkg] = [];
            }
        }
        // No package command defined
        if (!(pkg in this.packageCmds) || this.packageCmds[pkg].length === 0) {
            return;
        }
        // Insert commands
        this.packageCmds[pkg].forEach(cmd => {
            if (!useOptionalArgsEntries && this.getCmdName(cmd).includes('[')) {
                return;
            }
            if (!cmdList.includes(this.getCmdName(cmd))) {
                suggestions.push(cmd);
                cmdList.push(this.getCmdName(cmd));
            }
        });
    }
}
exports.Command = Command;
//# sourceMappingURL=command.js.map