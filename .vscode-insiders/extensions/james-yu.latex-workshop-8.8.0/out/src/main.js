"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const commander_1 = require("./commander");
const commander_2 = require("./components/commander");
const logger_1 = require("./components/logger");
const buildinfo_1 = require("./components/buildinfo");
const manager_1 = require("./components/manager");
const builder_1 = require("./components/builder");
const viewer_1 = require("./components/viewer");
const server_1 = require("./components/server");
const locator_1 = require("./components/locator");
const linter_1 = require("./components/linter");
const cleaner_1 = require("./components/cleaner");
const texmagician_1 = require("./components/texmagician");
const envpair_1 = require("./components/envpair");
const log_1 = require("./components/parser/log");
const syntax_1 = require("./components/parser/syntax");
const completion_1 = require("./providers/completion");
const codeactions_1 = require("./providers/codeactions");
const hover_1 = require("./providers/hover");
const graphicspreview_1 = require("./providers/preview/graphicspreview");
const mathpreview_1 = require("./providers/preview/mathpreview");
const docsymbol_1 = require("./providers/docsymbol");
const projectsymbol_1 = require("./providers/projectsymbol");
const structure_1 = require("./providers/structure");
const definition_1 = require("./providers/definition");
const latexformatter_1 = require("./providers/latexformatter");
const folding_1 = require("./providers/folding");
const snippetpanel_1 = require("./components/snippetpanel");
const bibtexformater_1 = require("./components/bibtexformater");
const config_1 = require("./config");
function conflictExtensionCheck() {
    function check(extensionID, name, suggestion) {
        if (vscode.extensions.getExtension(extensionID) !== undefined) {
            vscode.window.showWarningMessage(`LaTeX Workshop is incompatible with extension "${name}". ${suggestion}`);
        }
    }
    check('tomoki1207.pdf', 'vscode-pdf', 'Please consider disabling either extension.');
}
function selectDocumentsWithId(ids) {
    const selector = ids.map((id) => {
        return { scheme: 'file', language: id };
    });
    return selector;
}
function activate(context) {
    const extension = new Extension();
    vscode.commands.executeCommand('setContext', 'latex-workshop:enabled', true);
    // let configuration = vscode.workspace.getConfiguration('latex-workshop')
    // if (configuration.get('bind.altKeymap.enabled')) {
    //     vscode.commands.executeCommand('setContext', 'latex-workshop:altkeymap', true)
    // } else {
    //     vscode.commands.executeCommand('setContext', 'latex-workshop:altkeymap', false)
    // }
    vscode.commands.registerCommand('latex-workshop.saveWithoutBuilding', () => extension.commander.saveWithoutBuilding());
    vscode.commands.registerCommand('latex-workshop.build', () => extension.commander.build());
    vscode.commands.registerCommand('latex-workshop.recipes', (recipe) => extension.commander.recipes(recipe));
    vscode.commands.registerCommand('latex-workshop.view', (mode) => extension.commander.view(mode));
    vscode.commands.registerCommand('latex-workshop.refresh-viewer', () => extension.commander.refresh());
    vscode.commands.registerCommand('latex-workshop.tab', () => extension.commander.view('tab'));
    vscode.commands.registerCommand('latex-workshop.kill', () => extension.commander.kill());
    vscode.commands.registerCommand('latex-workshop.synctex', () => extension.commander.synctex());
    vscode.commands.registerCommand('latex-workshop.texdoc', (pkg) => extension.commander.texdoc(pkg));
    vscode.commands.registerCommand('latex-workshop.texdocUsepackages', () => extension.commander.texdocUsepackages());
    vscode.commands.registerCommand('latex-workshop.synctexto', (line, filePath) => extension.commander.synctexonref(line, filePath));
    vscode.commands.registerCommand('latex-workshop.clean', () => extension.commander.clean());
    vscode.commands.registerCommand('latex-workshop.actions', () => extension.commander.actions());
    vscode.commands.registerCommand('latex-workshop.citation', () => extension.commander.citation());
    vscode.commands.registerCommand('latex-workshop.addtexroot', () => extension.commander.addTexRoot());
    vscode.commands.registerCommand('latex-workshop.log', (compiler) => extension.commander.log(compiler));
    vscode.commands.registerCommand('latex-workshop.code-action', (d, r, c, m) => extension.codeActions.runCodeAction(d, r, c, m));
    vscode.commands.registerCommand('latex-workshop.goto-section', (filePath, lineNumber) => extension.commander.gotoSection(filePath, lineNumber));
    vscode.commands.registerCommand('latex-workshop.navigate-envpair', () => extension.commander.navigateToEnvPair());
    vscode.commands.registerCommand('latex-workshop.select-envname', () => extension.commander.selectEnvName());
    vscode.commands.registerCommand('latex-workshop.multicursor-envname', () => extension.commander.multiCursorEnvName());
    vscode.commands.registerCommand('latex-workshop.toggle-equation-envname', () => extension.commander.toggleEquationEnv());
    vscode.commands.registerCommand('latex-workshop.close-env', () => extension.commander.closeEnv());
    vscode.commands.registerCommand('latex-workshop.wrap-env', () => extension.commander.insertSnippet('wrapEnv'));
    vscode.commands.registerCommand('latex-workshop.onEnterKey', () => extension.commander.onEnterKey());
    vscode.commands.registerCommand('latex-workshop.onAltEnterKey', () => extension.commander.onEnterKey('alt'));
    vscode.commands.registerCommand('latex-workshop.revealOutputDir', () => extension.commander.revealOutputDir());
    vscode.commands.registerCommand('latex-workshop-dev.parselog', () => extension.commander.devParseLog());
    vscode.commands.registerCommand('latex-workshop-dev.parsetex', () => extension.commander.devParseTeX());
    vscode.commands.registerCommand('latex-workshop-dev.parsebib', () => extension.commander.devParseBib());
    vscode.commands.registerCommand('latex-workshop-dev.getViewerStatus', (pdfFilePath) => extension.commander.getViewerStatus(pdfFilePath));
    vscode.commands.registerCommand('latex-workshop-dev.isBuildFinished', () => extension.commander.isBuildFinished());
    vscode.commands.registerCommand('latex-workshop-dev.currentRootFile', () => extension.commander.currentRootFile());
    vscode.commands.registerCommand('latex-workshop.shortcut.item', () => extension.commander.insertSnippet('item'));
    vscode.commands.registerCommand('latex-workshop.shortcut.emph', () => extension.commander.toggleSelectedKeyword('emph'));
    vscode.commands.registerCommand('latex-workshop.shortcut.textbf', () => extension.commander.toggleSelectedKeyword('textbf'));
    vscode.commands.registerCommand('latex-workshop.shortcut.textit', () => extension.commander.toggleSelectedKeyword('textit'));
    vscode.commands.registerCommand('latex-workshop.shortcut.underline', () => extension.commander.toggleSelectedKeyword('underline'));
    vscode.commands.registerCommand('latex-workshop.shortcut.textrm', () => extension.commander.toggleSelectedKeyword('textrm'));
    vscode.commands.registerCommand('latex-workshop.shortcut.texttt', () => extension.commander.toggleSelectedKeyword('texttt'));
    vscode.commands.registerCommand('latex-workshop.shortcut.textsl', () => extension.commander.toggleSelectedKeyword('textsl'));
    vscode.commands.registerCommand('latex-workshop.shortcut.textsc', () => extension.commander.toggleSelectedKeyword('textsc'));
    vscode.commands.registerCommand('latex-workshop.shortcut.textnormal', () => extension.commander.toggleSelectedKeyword('textnormal'));
    vscode.commands.registerCommand('latex-workshop.shortcut.textsuperscript', () => extension.commander.toggleSelectedKeyword('textsuperscript'));
    vscode.commands.registerCommand('latex-workshop.shortcut.textsubscript', () => extension.commander.toggleSelectedKeyword('textsubscript'));
    vscode.commands.registerCommand('latex-workshop.shortcut.mathbf', () => extension.commander.toggleSelectedKeyword('mathbf'));
    vscode.commands.registerCommand('latex-workshop.shortcut.mathit', () => extension.commander.toggleSelectedKeyword('mathit'));
    vscode.commands.registerCommand('latex-workshop.shortcut.mathrm', () => extension.commander.toggleSelectedKeyword('mathrm'));
    vscode.commands.registerCommand('latex-workshop.shortcut.mathtt', () => extension.commander.toggleSelectedKeyword('mathtt'));
    vscode.commands.registerCommand('latex-workshop.shortcut.mathsf', () => extension.commander.toggleSelectedKeyword('mathsf'));
    vscode.commands.registerCommand('latex-workshop.shortcut.mathbb', () => extension.commander.toggleSelectedKeyword('mathbb'));
    vscode.commands.registerCommand('latex-workshop.shortcut.mathcal', () => extension.commander.toggleSelectedKeyword('mathcal'));
    vscode.commands.registerCommand('latex-workshop.surround', () => extension.completer.command.surround());
    vscode.commands.registerCommand('latex-workshop.promote-sectioning', () => extension.commander.shiftSectioningLevel('promote'));
    vscode.commands.registerCommand('latex-workshop.demote-sectioning', () => extension.commander.shiftSectioningLevel('demote'));
    vscode.commands.registerCommand('latex-workshop.showCompilationPanel', () => extension.buildInfo.showPanel());
    vscode.commands.registerCommand('latex-workshop.showSnippetPanel', () => extension.snippetPanel.showPanel());
    vscode.commands.registerCommand('latex-workshop.bibsort', () => extension.bibtexFormater.bibtexFormat(true, false));
    vscode.commands.registerCommand('latex-workshop.bibalign', () => extension.bibtexFormater.bibtexFormat(false, true));
    vscode.commands.registerCommand('latex-workshop.bibalignsort', () => extension.bibtexFormater.bibtexFormat(true, true));
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((e) => {
        if (extension.manager.hasTexId(e.languageId)) {
            extension.linter.lintRootFileIfEnabled();
            extension.structureProvider.refresh();
            extension.structureProvider.update();
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((e) => {
        // This function will be called when a new text is opened, or an inactive editor is reactivated after vscode reload
        if (extension.manager.hasTexId(e.languageId)) {
            config_1.obsoleteConfigCheck(extension);
            extension.manager.findRoot();
            extension.structureProvider.refresh();
            extension.structureProvider.update();
        }
        if (e.languageId === 'pdf') {
            extension.manager.watchPdfFile(e.uri.fsPath);
            vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
                extension.commander.pdf(e.uri);
            });
        }
    }));
    let updateCompleter;
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
        if (!extension.manager.hasTexId(e.document.languageId)) {
            return;
        }
        extension.linter.lintActiveFileIfEnabledAfterInterval();
        if (extension.manager.cachedContent[e.document.fileName] === undefined) {
            return;
        }
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        const content = e.document.getText();
        extension.manager.cachedContent[e.document.fileName].content = content;
        if (configuration.get('intellisense.update.aggressive.enabled')) {
            if (updateCompleter) {
                clearTimeout(updateCompleter);
            }
            updateCompleter = setTimeout(() => {
                const file = e.document.uri.fsPath;
                extension.manager.updateCompleter(file, content);
            }, configuration.get('intellisense.update.delay', 1000));
        }
    }));
    let isLaTeXActive = false;
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((e) => {
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        if (vscode.window.visibleTextEditors.filter(editor => extension.manager.hasTexId(editor.document.languageId)).length > 0) {
            extension.logger.status.show();
            vscode.commands.executeCommand('setContext', 'latex-workshop:enabled', true).then(() => {
                const gits = vscode.window.visibleTextEditors.filter(editor => editor.document.uri.scheme === 'git');
                if (configuration.get('view.autoFocus.enabled') && !isLaTeXActive && gits.length === 0) {
                    vscode.commands.executeCommand('workbench.view.extension.latex').then(() => vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup'));
                }
                else if (gits.length > 0) {
                    vscode.commands.executeCommand('workbench.view.scm').then(() => vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup'));
                }
                isLaTeXActive = true;
            });
        }
        else if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId.toLowerCase() === 'log') {
            extension.logger.status.show();
            vscode.commands.executeCommand('setContext', 'latex-workshop:enabled', true);
        }
        if (e && extension.manager.hasTexId(e.document.languageId)) {
            extension.linter.lintActiveFileIfEnabled();
            extension.manager.findRoot();
        }
        else {
            isLaTeXActive = false;
        }
    }));
    const latexSelector = selectDocumentsWithId(['latex', 'rsweave']);
    const latexBibtexSelector = selectDocumentsWithId(['latex', 'rsweave', 'bibtex']);
    const latexDoctexSelector = selectDocumentsWithId(['latex', 'rsweave', 'doctex']);
    const formatter = new latexformatter_1.LatexFormatterProvider(extension);
    vscode.languages.registerDocumentFormattingEditProvider(latexBibtexSelector, formatter);
    vscode.languages.registerDocumentRangeFormattingEditProvider(latexBibtexSelector, formatter);
    context.subscriptions.push(vscode.window.registerTreeDataProvider('latex-commands', new commander_2.LaTeXCommander(extension)));
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection((e) => {
        if (!extension.manager.hasTexId(e.textEditor.document.languageId)) {
            return;
        }
        extension.structureViewer.showCursorIteme(e);
    }));
    context.subscriptions.push(vscode.languages.registerHoverProvider(latexSelector, new hover_1.HoverProvider(extension)));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(latexSelector, new definition_1.DefinitionProvider(extension)));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(latexSelector, new docsymbol_1.DocSymbolProvider(extension)));
    context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new projectsymbol_1.ProjectSymbolProvider(extension)));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'tex' }, extension.completer, '\\', '{'));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(latexDoctexSelector, extension.completer, '\\', '{', ',', '(', '['));
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider(latexSelector, extension.codeActions));
    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider(latexSelector, new folding_1.FoldingProvider(extension)));
    extension.manager.findRoot();
    extension.linter.lintRootFileIfEnabled();
    config_1.obsoleteConfigCheck(extension);
    conflictExtensionCheck();
    config_1.checkDeprecatedFeatures(extension);
    config_1.newVersionMessage(context.extensionPath, extension);
    vscode.window.visibleTextEditors.forEach(editor => {
        const e = editor.document;
        if (e.languageId === 'pdf') {
            vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
                extension.commander.pdf(e.uri);
            });
        }
    });
    return {
        getGraphicsPath: () => extension.completer.input.graphicsPath,
        viewer: {
            clients: extension.viewer.clients,
            refreshExistingViewer: (sourceFile, viewer) => extension.viewer.refreshExistingViewer(sourceFile, viewer),
            openTab: (sourceFile, respectOutDir = true, column = 'right') => extension.viewer.openTab(sourceFile, respectOutDir, column)
        },
        manager: {
            findRoot: () => extension.manager.findRoot(),
            rootDir: () => extension.manager.rootDir,
            rootFile: () => extension.manager.rootFile,
            setEnvVar: () => extension.manager.setEnvVar(),
            cachedContent: () => extension.manager.cachedContent
        },
        completer: {
            command: {
                usedPackages: () => {
                    console.warn('`completer.command.usedPackages` is deprecated. Consider use `manager.cachedContent`.');
                    let allPkgs = [];
                    extension.manager.getIncludedTeX().forEach(tex => {
                        const pkgs = extension.manager.cachedContent[tex].element.package;
                        if (pkgs === undefined) {
                            return;
                        }
                        allPkgs = allPkgs.concat(pkgs);
                    });
                    return allPkgs;
                }
            }
        }
    };
}
exports.activate = activate;
class Extension {
    constructor() {
        this.extensionRoot = path.resolve(`${__dirname}/../../`);
        this.logger = new logger_1.Logger(this);
        this.buildInfo = new buildinfo_1.BuildInfo(this);
        this.commander = new commander_1.Commander(this);
        this.manager = new manager_1.Manager(this);
        this.builder = new builder_1.Builder(this);
        this.viewer = new viewer_1.Viewer(this);
        this.server = new server_1.Server(this);
        this.locator = new locator_1.Locator(this);
        this.logParser = new log_1.Parser(this);
        this.completer = new completion_1.Completer(this);
        this.linter = new linter_1.Linter(this);
        this.cleaner = new cleaner_1.Cleaner(this);
        this.codeActions = new codeactions_1.CodeActions(this);
        this.texMagician = new texmagician_1.TeXMagician(this);
        this.envPair = new envpair_1.EnvPair(this);
        this.structureProvider = new structure_1.SectionNodeProvider(this);
        this.structureViewer = new structure_1.StructureTreeView(this);
        this.snippetPanel = new snippetpanel_1.SnippetPanel(this);
        this.pegParser = new syntax_1.UtensilsParser(this);
        this.graphicsPreview = new graphicspreview_1.GraphicsPreview(this);
        this.mathPreview = new mathpreview_1.MathPreview(this);
        this.bibtexFormater = new bibtexformater_1.BibtexFormater(this);
        this.logger.addLogMessage('LaTeX Workshop initialized.');
    }
}
exports.Extension = Extension;
//# sourceMappingURL=main.js.map