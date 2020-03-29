'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = require("vscode");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let indentSpy = new IndentSpy();
    let indentSpyController = new IndentSpyController(indentSpy);
    context.subscriptions.push(indentSpy);
    context.subscriptions.push(indentSpyController);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
class LanguageConfig {
    constructor(langConfig, config) {
        this.langConfig = langConfig;
        this.config = config;
    }
    get(name, defaultValue) {
        let v = this.langConfig[`indenticator.${name}`];
        if (v !== undefined) {
            return v;
        }
        return this.config.get(name, defaultValue);
    }
}
class IndentConfiguration {
}
class IndentSpy {
    constructor() {
        this._outerConf = new IndentConfiguration();
        this._innerConf = new IndentConfiguration();
        this._locales = {
            en: { statusText: `Indents: {indent}`,
                statusTooltip: `current indent depth: {indent}` },
            de: { statusText: `Einzüge: {indent}`,
                statusTooltip: `aktuelle Einzugtiefe: {indent}` },
            default: { statusText: `Indents: {indent}`,
                statusTooltip: `current indent depth: {indent}` },
        };
        this.updateConfig();
    }
    updateConfig() {
        this._clearDecorators();
        let locale = vscode_1.env.language;
        let multipartLocale = vscode_1.env.language.indexOf('-');
        if (multipartLocale >= 0) {
            locale = locale.substring(0, multipartLocale);
        }
        if (!this._locales[locale]) {
            this._currentLocale = this._locales['default'];
        }
        else {
            this._currentLocale = this._locales[locale];
        }
        let langConfig = {};
        let config = vscode_1.workspace.getConfiguration('indenticator');
        if (vscode_1.window.activeTextEditor) {
            let docLang = vscode_1.window.activeTextEditor.document.languageId;
            let allLangConfig = config.get("languageSpecific", {});
            let docLangKey = Object.keys(allLangConfig).find(k => {
                return k.match(`^\\[(.*,\\s*)?${docLang}(,.*)?\\]$`) !== null;
            });
            if (docLangKey) {
                langConfig = allLangConfig[docLangKey] || {};
            }
        }
        let myConf = new LanguageConfig(langConfig, config);
        if (myConf.get('showCurrentDepthInStatusBar')) {
            if (!this._statusBarItem) {
                this._statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 100);
            }
        }
        else if (this._statusBarItem) {
            this._statusBarItem.dispose();
            this._statusBarItem = undefined;
        }
        this._outerConf.show = myConf.get('showHighlight');
        this._innerConf.show = myConf.get('inner.showHighlight');
        this._outerConf.style = vscode_1.window.createTextEditorDecorationType({
            dark: {
                borderColor: myConf.get('color.dark', '#888'),
                borderStyle: myConf.get('style', 'inset'),
                borderWidth: myConf.get('width', 1) + "px"
            },
            light: {
                borderColor: myConf.get('color.light', '#999'),
                borderStyle: myConf.get('style', 'inset'),
                borderWidth: myConf.get('width', 1) + "px"
            }
        });
        this._innerConf.style = vscode_1.window.createTextEditorDecorationType({
            dark: {
                borderColor: myConf.get('inner.color.dark', '#888'),
                borderStyle: myConf.get('inner.style', 'inset'),
                borderWidth: myConf.get('inner.width', 1) + "px"
            },
            light: {
                borderColor: myConf.get('inner.color.light', '#999'),
                borderStyle: myConf.get('inner.style', 'inset'),
                borderWidth: myConf.get('inner.width', 1) + "px"
            }
        });
        let showHover = myConf.get('showHover', false);
        if (typeof showHover === 'boolean') {
            this._outerConf.hover = showHover ? 1 : 0;
        }
        else {
            this._outerConf.hover = showHover;
        }
        if (this._outerConf.hover) {
            this._outerConf.hoverConf = {
                peekBack: myConf.get('hover.peekBack', 1),
                peekForward: myConf.get('hover.peekForward', 0),
                trimLinesShorterThan: myConf.get('hover.trimLinesShorterThan', 2),
                peekBlockPlaceholder: myConf.get('hover.peekBlockPlaceholder', '...')
            };
        }
        else if (this._outerConf.hoverProvider) {
            this._outerConf.hoverProvider.dispose();
        }
        showHover = myConf.get('inner.showHover', false);
        if (typeof showHover === 'boolean') {
            this._innerConf.hover = showHover ? 1 : 0;
        }
        else {
            this._innerConf.hover = showHover;
        }
        if (this._innerConf.hover) {
            this._innerConf.hoverConf = {
                peekBack: myConf.get('inner.hover.peekBack', 1),
                peekForward: myConf.get('inner.hover.peekForward', 0),
                trimLinesShorterThan: myConf.get('inner.hover.trimLinesShorterThan', 2),
                peekBlockPlaceholder: myConf.get('inner.hover.peekBlockPlaceholder', '...')
            };
        }
        else if (this._innerConf.hoverProvider) {
            this._innerConf.hoverProvider.dispose();
        }
        this.updateCurrentIndent();
    }
    updateCurrentIndent() {
        let hideStatusbarIfPossible = () => {
            if (this._statusBarItem) {
                this._statusBarItem.hide();
            }
        };
        let editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            hideStatusbarIfPossible();
            return;
        }
        let document = editor.document;
        if (!document) {
            hideStatusbarIfPossible();
            return;
        }
        let selection = editor.selection;
        if (!selection) {
            hideStatusbarIfPossible();
            return;
        }
        let tabSize = this._getTabSize(editor.options);
        let selectedIndent = this._getSelectedIndentDepth(document, selection, tabSize);
        if (this._outerConf.show || this._innerConf.show) {
            let activeRanges = this._getActiveIndentRanges(document, selection, selectedIndent, tabSize);
            if (this._outerConf.show) {
                editor.setDecorations(this._outerConf.style, activeRanges.outer);
                if (activeRanges.outer.length >= this._outerConf.hover) {
                    this._buildHover(editor, tabSize, this._outerConf);
                }
                else if (this._outerConf.hoverProvider) {
                    this._outerConf.hoverProvider.dispose();
                }
            }
            if (this._innerConf.show) {
                editor.setDecorations(this._innerConf.style, activeRanges.inner);
                if (activeRanges.inner.length >= this._innerConf.hover) {
                    this._buildHover(editor, tabSize, this._innerConf);
                }
                else if (this._innerConf.hoverProvider) {
                    this._innerConf.hoverProvider.dispose();
                }
            }
        }
        if (this._statusBarItem) {
            this._statusBarItem.text = this._currentLocale['statusText']
                .replace('{indent}', selectedIndent);
            this._statusBarItem.tooltip = this._currentLocale['statusTooltip']
                .replace('{indent}', selectedIndent);
            this._statusBarItem.show();
        }
    }
    _buildHover(editor, tabSize, conf) {
        if (conf.hoverProvider) {
            conf.hoverProvider.dispose();
        }
        conf.hoverProvider = vscode_1.languages.registerHoverProvider(editor.document.languageId, {
            provideHover: (doc, position) => {
                return this._buildHoverprovider(position, editor, tabSize, conf);
            }
        });
    }
    _buildHoverprovider(position, editor, tabSize, conf) {
        let char = conf.indentPos;
        if (position.character > char - 2
            && position.character < char + 2
            && position.line >= conf.firstLine
            && position.line <= conf.lastLine) {
            let str = this._buildHoverString(editor, tabSize, conf);
            if (str) {
                return {
                    range: new vscode_1.Range(conf.firstLine, conf.indentPos, conf.lastLine, conf.indentPos),
                    contents: [
                        {
                            language: editor.document.languageId,
                            value: str
                        }
                    ]
                };
            }
            return null;
        }
    }
    _buildHoverString(editor, tabSize, conf) {
        let hoverLines = [];
        let document = editor.document;
        let refDepth = this._getLinesIndentDepth(document.lineAt(conf.firstLine), tabSize);
        let backHoverLines = this._peekBack(editor.document, tabSize, refDepth, conf);
        let forwardHoverLines = this._peekForward(editor.document, tabSize, refDepth, conf);
        hoverLines.push(...backHoverLines);
        if (forwardHoverLines.length > 0 || backHoverLines.length > 0) {
            hoverLines.push(this._buildHoverPlaceholder(editor, tabSize, conf));
        }
        hoverLines.push(...forwardHoverLines);
        return hoverLines.join('\n');
    }
    _buildHoverPlaceholder(editor, tabSize, conf) {
        let tabChar = editor.options.insertSpaces ? ' ' : '\t';
        let spacing = tabChar.repeat(tabSize);
        return `${spacing}${conf.hoverConf.peekBlockPlaceholder}`;
    }
    _peekBack(document, tabSize, refDepth, conf) {
        let backHoverLines = [];
        if (conf.hoverConf.peekBack > 0) {
            let firstPeekLine = Math.max(conf.firstLine - (conf.hoverConf.peekBack - 1), 0);
            let pushedOnce = false;
            for (let i = firstPeekLine; i <= conf.firstLine; i++) {
                let line = document.lineAt(i);
                let lineStr = line.text.trim();
                if (!pushedOnce &&
                    lineStr.length < conf.hoverConf.trimLinesShorterThan) {
                    continue;
                }
                let lineDepth = this._getLinesIndentDepth(line, tabSize);
                if (lineDepth != refDepth) {
                    backHoverLines.splice(0);
                    continue;
                }
                backHoverLines.push(lineStr);
                pushedOnce = true;
            }
        }
        return backHoverLines;
    }
    _peekForward(document, tabSize, refDepth, conf) {
        let forwardHoverLines = [];
        if (conf.hoverConf.peekForward > 0) {
            let lastPeekLine = Math.min(conf.lastLine + (conf.hoverConf.peekForward - 1), document.lineCount - 1);
            let pushedOnce = false;
            for (let i = lastPeekLine; i >= conf.lastLine; i--) {
                let line = document.lineAt(i);
                let lineStr = line.text.trim();
                if (!pushedOnce &&
                    lineStr.length < conf.hoverConf.trimLinesShorterThan) {
                    continue;
                }
                let lineDepth = this._getLinesIndentDepth(line, tabSize);
                if (lineDepth != refDepth) {
                    forwardHoverLines.splice(0);
                    continue;
                }
                forwardHoverLines.push(lineStr);
                pushedOnce = true;
            }
        }
        return forwardHoverLines.reverse();
    }
    _clearDecorators() {
        if (this._outerConf.style) {
            for (let i = 0; i < vscode_1.window.visibleTextEditors.length; i++) {
                vscode_1.window.visibleTextEditors[i].setDecorations(this._outerConf.style, []);
            }
        }
        if (this._innerConf.style) {
            for (let i = 0; i < vscode_1.window.visibleTextEditors.length; i++) {
                vscode_1.window.visibleTextEditors[i].setDecorations(this._innerConf.style, []);
            }
        }
    }
    _getTabSize(options) {
        return options.insertSpaces ? Number(options.tabSize) : 1;
    }
    _getIndentDepth(index, tabSize) {
        return Math.ceil(index / tabSize);
    }
    _getLinesIndentDepth(line, tabSize) {
        return this._getIndentDepth(line.firstNonWhitespaceCharacterIndex, tabSize);
    }
    _createIndicatorRange(line, character) {
        return new vscode_1.Range(new vscode_1.Position(line, character), new vscode_1.Position(line, character));
    }
    _getSelectedIndentDepth(document, selection, tabSize) {
        if (selection.isSingleLine) {
            let maxlineNum = document.lineCount - 1;
            let line = document.lineAt(Math.min(selection.start.line, maxlineNum));
            return this._getIndentDepth(Math.min(selection.start.character, line.firstNonWhitespaceCharacterIndex), tabSize);
        }
        let selectedIndent = Number.MAX_VALUE;
        let maxlineNum = Math.min(selection.end.line, document.lineCount - 1);
        for (let i = selection.start.line; i <= maxlineNum; i++) {
            let line = document.lineAt(i);
            if (line.isEmptyOrWhitespace) {
                continue;
            }
            selectedIndent = Math.min(selectedIndent, this._getLinesIndentDepth(line, tabSize));
        }
        return selectedIndent;
    }
    _getActiveIndentRanges(document, selection, selectedIndent, tabSize) {
        let activeRanges = [];
        let activeInnerRanges = [];
        let line;
        let innerDeactivated;
        this._outerConf.firstLine = selection.start.line;
        this._outerConf.lastLine = selection.end.line;
        this._outerConf.indentPos = (selectedIndent - 1) * tabSize;
        this._innerConf.firstLine = selection.start.line;
        this._innerConf.lastLine = selection.end.line;
        this._innerConf.indentPos = selectedIndent * tabSize;
        let addRanges = (i, line) => {
            let lineAdded = false;
            let innerAdded = false;
            let lineIndent = this._getLinesIndentDepth(line, tabSize);
            if (this._innerConf.show && !innerDeactivated && (lineIndent > selectedIndent || (line.isEmptyOrWhitespace && selectedIndent === lineIndent &&
                (i !== selection.end.line || selection.end.character !== this._innerConf.indentPos)))) {
                activeInnerRanges.push(this._createIndicatorRange(i, this._innerConf.indentPos));
                lineAdded = true;
                innerAdded = true;
            }
            if (this._outerConf.show && this._outerConf.indentPos >= 0 && (lineIndent >= selectedIndent || (line.isEmptyOrWhitespace && selectedIndent === 1))) {
                activeRanges.push(this._createIndicatorRange(i, this._outerConf.indentPos));
                lineAdded = true;
            }
            return {
                'lineAdded': lineAdded,
                'innerAdded': innerAdded
            };
        };
        // add ranges for preceeding lines on same indent
        innerDeactivated = false;
        for (let i = selection.start.line; i >= 0; i--) {
            line = document.lineAt(i);
            let result = addRanges(i, line);
            if (!result.innerAdded && !line.isEmptyOrWhitespace && !innerDeactivated) {
                innerDeactivated = true;
                this._innerConf.firstLine = i;
            }
            if (!result.lineAdded && !line.isEmptyOrWhitespace) {
                this._outerConf.firstLine = i;
                break;
            }
        }
        // add ranges for following lines on same indent
        innerDeactivated = false;
        for (let i = selection.start.line + 1; i < document.lineCount; i++) {
            line = document.lineAt(i);
            let result = addRanges(i, line);
            if (!result.innerAdded && !line.isEmptyOrWhitespace && !innerDeactivated) {
                innerDeactivated = true;
                this._innerConf.lastLine = i;
            }
            if (!result.lineAdded && !line.isEmptyOrWhitespace) {
                this._outerConf.lastLine = i;
                break;
            }
        }
        return {
            outer: activeRanges,
            inner: activeInnerRanges
        };
    }
    dispose() {
        if (this._statusBarItem) {
            this._statusBarItem.dispose();
        }
        if (this._outerConf.hoverProvider) {
            this._outerConf.hoverProvider.dispose();
        }
        if (this._innerConf.hoverProvider) {
            this._innerConf.hoverProvider.dispose();
        }
    }
}
exports.IndentSpy = IndentSpy;
class IndentSpyController {
    constructor(indentSpy) {
        this._indentSpy = indentSpy;
        this._indentSpy.updateCurrentIndent();
        // subscribe to selection change and editor activation events
        let subscriptions = [];
        vscode_1.window.onDidChangeTextEditorSelection(this._onUpdateEvent, this, subscriptions);
        vscode_1.window.onDidChangeActiveTextEditor(this._onChangedEditor, this, subscriptions);
        // subscribe to configuration change events
        vscode_1.workspace.onDidChangeConfiguration(this._onChangedConfigEvent, this, subscriptions);
        this._disposable = vscode_1.Disposable.from(...subscriptions);
    }
    dispose() {
        this._disposable.dispose();
    }
    _onUpdateEvent(e) {
        this._indentSpy.updateCurrentIndent();
    }
    _onChangedEditor(e) {
        this._indentSpy.updateConfig();
        this._indentSpy.updateCurrentIndent();
    }
    _onChangedConfigEvent(e) {
        this._indentSpy.updateConfig();
    }
}
//# sourceMappingURL=extension.js.map