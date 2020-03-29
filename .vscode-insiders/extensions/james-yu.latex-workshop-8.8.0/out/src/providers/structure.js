"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const utils = require("../utils/utils");
class SectionNodeProvider {
    constructor(extension) {
        this.extension = extension;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.sectionDepths = {};
        this.root = '';
        // our data source is a set multi-rooted set of trees
        this.ds = [];
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        this.hierarchy = configuration.get('view.outline.sections');
        this.hierarchy.forEach((section, index) => {
            section.split('|').forEach(sec => {
                this.sectionDepths[sec] = index;
            });
        });
    }
    refresh() {
        if (this.extension.manager.rootFile) {
            this.ds = this.buildModel(this.extension.manager.rootFile);
            return this.ds;
        }
        else {
            return [];
        }
    }
    update() {
        this._onDidChangeTreeData.fire();
    }
    buildModel(filePath, fileStack, parentStack, parentChildren, imports = true) {
        let rootStack = [];
        if (parentStack) {
            rootStack = parentStack;
        }
        let children = [];
        if (parentChildren) {
            children = parentChildren;
        }
        let newFileStack = [];
        if (fileStack) {
            newFileStack = fileStack;
        }
        newFileStack.push(filePath);
        let prevSection = undefined;
        const envStack = [];
        const currentRoot = () => {
            return rootStack[rootStack.length - 1];
        };
        const noRoot = () => {
            return rootStack.length === 0;
        };
        let content = fs.readFileSync(filePath, 'utf-8');
        content = content.replace(/([^\\]|^)%.*$/gm, '$1'); // Strip comments
        const endPos = content.search(/\\end{document}/gm);
        if (endPos > -1) {
            content = content.substr(0, endPos);
        }
        let pattern = '(?:((?:\\\\(?:input|InputIfFileExists|include|subfile|(?:(?:sub)?import\\*?{([^}]*)}))(?:\\[[^\\[\\]\\{\\}]*\\])?){([^}]*)})|((?:\\\\(';
        this.hierarchy.forEach((section, index) => {
            pattern += section;
            if (index < this.hierarchy.length - 1) {
                pattern += '|';
            }
        });
        pattern += ')(?:\\*)?(?:\\[[^\\[\\]\\{\\}]*\\])?){(.*)}))';
        // const inputReg = /^((?:\\(?:input|include|subfile)(?:\[[^\[\]\{\}]*\])?){([^}]*)})|^((?:\\((sub)?section)(?:\[[^\[\]\{\}]*\])?){([^}]*)})/gm
        const inputReg = RegExp(pattern, 'm');
        const envReg = /(?:\\(begin|end)(?:\[[^[\]]*\])?){(?:(figure|frame|table)\*?)}/m;
        const lines = content.split('\n');
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
            const line = lines[lineNumber];
            envReg.lastIndex = 0;
            inputReg.lastIndex = 0;
            let result = envReg.exec(line);
            if (result && result[1] === 'begin') {
                envStack.push({ name: result[2], start: lineNumber, end: lineNumber });
                continue;
            }
            else if (result && result[2] === envStack[envStack.length - 1].name) {
                const env = envStack.pop();
                if (!env) {
                    continue;
                }
                env.end = lineNumber;
                const caption = this.getCaptionOrTitle(lines, env);
                if (!caption) {
                    continue;
                }
                const depth = noRoot() ? 0 : currentRoot().depth + 1;
                const newEnv = new Section(`${env.name.charAt(0).toUpperCase() + env.name.slice(1)}: ${caption}`, vscode.TreeItemCollapsibleState.Expanded, depth, env.start, env.end, filePath);
                if (noRoot()) {
                    children.push(newEnv);
                }
                else {
                    currentRoot().children.push(newEnv);
                }
                continue;
            }
            result = inputReg.exec(line);
            // if it's a section elements 5 = section
            // element 6 = title.
            // if it's a subsection:
            // element X = title
            // if it's an input, include, or subfile:
            // element 3 is the file (need to resolve the path)
            // element 1 starts with \input, include, or subfile
            // if it's a subimport or an import
            // element 1 starts with \subimport or \import
            // element 2 is the directory part
            // element 3 is the file
            if (result && result[5] in this.sectionDepths) {
                // is it a section, a subsection, etc?
                const heading = result[5];
                const depth = this.sectionDepths[heading];
                const title = utils.getLongestBalancedString(result[6]);
                const newSection = new Section(title, vscode.TreeItemCollapsibleState.Expanded, depth, lineNumber, lines.length - 1, filePath);
                if (prevSection) {
                    prevSection.toLine = lineNumber - 1;
                }
                prevSection = newSection;
                if (noRoot()) {
                    children.push(newSection);
                    rootStack.push(newSection);
                    continue;
                }
                // Find the proper root section
                while (!noRoot() && currentRoot().depth >= depth) {
                    rootStack.pop();
                }
                if (noRoot()) {
                    newSection.parent = undefined;
                    children.push(newSection);
                }
                else {
                    newSection.parent = currentRoot();
                    currentRoot().children.push(newSection);
                }
                rootStack.push(newSection);
            }
            else if (imports && result && (result[1].startsWith('\\input') || result[1].startsWith('\\InputIfFileExists') || result[1].startsWith('\\include') || result[1].startsWith('\\subfile') || result[1].startsWith('\\subimport') || result[1].startsWith('\\import'))) {
                // zoom into this file
                // resolve the path
                let inputFilePath;
                if (result[1].startsWith('\\subimport')) {
                    inputFilePath = utils.resolveFile([path.dirname(filePath)], path.join(result[2], result[3]));
                }
                else if (result[1].startsWith('\\import')) {
                    inputFilePath = utils.resolveFile([result[2]], result[3]);
                }
                else {
                    const configuration = vscode.workspace.getConfiguration('latex-workshop');
                    const texDirs = configuration.get('latex.texDirs');
                    inputFilePath = utils.resolveFile([...texDirs, path.dirname(filePath),
                        this.extension.manager.rootDir ? this.extension.manager.rootDir : '.'], result[3]);
                }
                if (!inputFilePath) {
                    this.extension.logger.addLogMessage(`Could not resolve included file ${inputFilePath}`);
                    continue;
                }
                if (path.extname(inputFilePath) === '') {
                    inputFilePath += '.tex';
                }
                if (!fs.existsSync(inputFilePath) && fs.existsSync(inputFilePath + '.tex')) {
                    inputFilePath += '.tex';
                }
                if (fs.existsSync(inputFilePath) === false) {
                    this.extension.logger.addLogMessage(`Could not resolve included file ${inputFilePath}`);
                    continue;
                }
                // Avoid circular inclusion
                if (inputFilePath === filePath || newFileStack.includes(inputFilePath)) {
                    continue;
                }
                if (prevSection) {
                    prevSection.subfiles.push(inputFilePath);
                }
                this.buildModel(inputFilePath, newFileStack, rootStack, children);
            }
        }
        return children;
    }
    getTreeItem(element) {
        const hasChildren = element.children.length > 0;
        const treeItem = new vscode.TreeItem(element.label, hasChildren ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
        treeItem.command = {
            command: 'latex-workshop.goto-section',
            title: '',
            arguments: [element.fileName, element.lineNumber]
        };
        treeItem.tooltip = `Line ${element.lineNumber + 1} at ${element.fileName}`;
        return treeItem;
    }
    getChildren(element) {
        if (this.extension.manager.rootFile === undefined) {
            return Promise.resolve([]);
        }
        // if the root doesn't exist, we need
        // to explicitly build the model from disk
        if (!element) {
            return Promise.resolve(this.refresh());
        }
        return Promise.resolve(element.children);
    }
    getParent(element) {
        if (this.extension.manager.rootFile === undefined || !element) {
            return Promise.resolve(undefined);
        }
        return Promise.resolve(element.parent);
    }
    getCaptionOrTitle(lines, env) {
        const content = lines.slice(env.start, env.end).join('\n');
        let result = null;
        if (env.name === 'frame') {
            // Frame titles can be specified as either \begin{frame}{Frame Title}
            // or \begin{frame} \frametitle{Frame Title}
            const frametitleRegex = /\\frametitle(?:<[^<>]*>)?(?:\[[^[\]]*\])?{((?:(?:[^{}])|(?:\{[^{}]*\}))+)}/gsm;
            // \begin{frame}(whitespace){Title} will set the title as long as the whitespace contains no more than 1 newline
            const beginframeRegex = /\\begin{frame}(?:<[^<>]*>?)?(?:\[[^[\]]*\]){0,2}[\t ]*(?:(?:\r\n|\r|\n)[\t ]*)?{([^{}]*)}/gsm;
            // \frametitle can override title set in \begin{frame}{<title>} so we check that first
            result = frametitleRegex.exec(content);
            if (!result) {
                result = beginframeRegex.exec(content);
            }
        }
        else {
            const captionRegex = /(?:\\caption(?:\[[^[\]]*\])?){((?:(?:[^{}])|(?:\{[^{}]*\}))+)}/gsm;
            let captionResult;
            // Take the last caption entry to deal with subfigures.
            // This works most of the time but not always. A definitive solution should use AST
            while ((captionResult = captionRegex.exec(content))) {
                result = captionResult;
            }
        }
        if (result) {
            // Remove indentation, newlines and the final '.'
            return result[1].replace(/^ */gm, ' ').replace(/\r|\n/g, '').replace(/\.$/, '');
        }
        return undefined;
    }
}
exports.SectionNodeProvider = SectionNodeProvider;
class Section extends vscode.TreeItem {
    constructor(label, collapsibleState, depth, lineNumber, toLine, fileName, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.depth = depth;
        this.lineNumber = lineNumber;
        this.toLine = toLine;
        this.fileName = fileName;
        this.command = command;
        this.children = [];
        this.parent = undefined; // The parent of a top level section must be undefined
        this.subfiles = [];
    }
}
exports.Section = Section;
class StructureTreeView {
    constructor(extension) {
        this.extension = extension;
        this._followCursor = true;
        this._treeDataProvider = this.extension.structureProvider;
        this._viewer = vscode.window.createTreeView('latex-structure', { treeDataProvider: this._treeDataProvider });
        vscode.commands.registerCommand('latex-structure.toggle-follow-cursor', () => {
            this._followCursor = !this._followCursor;
        });
    }
    traverseSectionTree(sections, fileName, lineNumber) {
        for (const node of sections) {
            if (node.fileName !== fileName) {
                continue;
            }
            if (node.lineNumber <= lineNumber && node.toLine >= lineNumber) {
                return node;
            }
            if (node.subfiles.length > 0 && node.subfiles.includes(fileName)) {
                return node;
            }
            const res = this.traverseSectionTree(node.children, fileName, lineNumber);
            if (res) {
                return res;
            }
        }
        return undefined;
    }
    showCursorIteme(e) {
        if (!this._followCursor || !this._viewer.visible) {
            return;
        }
        const line = e.selections[0].active.line;
        const f = e.textEditor.document.fileName;
        const currentNode = this.traverseSectionTree(this._treeDataProvider.ds, f, line);
        if (currentNode) {
            this._viewer.reveal(currentNode, { select: true });
        }
    }
}
exports.StructureTreeView = StructureTreeView;
//# sourceMappingURL=structure.js.map