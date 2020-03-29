"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const latex_utensils_1 = require("latex-utensils");
class Reference {
    constructor(extension) {
        // Here we use an object instead of an array for de-duplication
        this.suggestions = {};
        this.prevIndexObj = {};
        this.extension = extension;
    }
    provide(args) {
        // Compile the suggestion object to array
        this.updateAll(args);
        let keys = Object.keys(this.suggestions);
        keys = keys.concat(Object.keys(this.prevIndexObj));
        keys = Array.from(new Set(keys));
        const items = [];
        for (const key of keys) {
            const sug = this.suggestions[key];
            if (sug) {
                items.push(sug);
            }
            else {
                items.push({ label: key });
            }
        }
        return items;
    }
    update(file, nodes, lines, content) {
        if (nodes !== undefined && lines !== undefined) {
            this.extension.manager.cachedContent[file].element.reference = this.getRefFromNodeArray(nodes, lines);
        }
        else if (content !== undefined) {
            this.extension.manager.cachedContent[file].element.reference = this.getRefFromContent(content);
        }
    }
    getRefDict() {
        if (this.suggestions) {
            this.updateAll();
        }
        return this.suggestions;
    }
    updateAll(args) {
        // Extract cached references
        const refList = [];
        this.extension.manager.getIncludedTeX().forEach(cachedFile => {
            const cachedRefs = this.extension.manager.cachedContent[cachedFile].element.reference;
            if (cachedRefs === undefined) {
                return;
            }
            cachedRefs.forEach(ref => {
                if (ref.range === undefined) {
                    return;
                }
                this.suggestions[ref.label] = Object.assign(Object.assign({}, ref), { file: cachedFile, position: ref.range.start, range: args ? args.document.getWordRangeAtPosition(args.position, /[-a-zA-Z0-9_:.]+/) : undefined, prevIndex: this.prevIndexObj[ref.label] });
                refList.push(ref.label);
            });
        });
        // Remove references that has been deleted
        Object.keys(this.suggestions).forEach(key => {
            if (!refList.includes(key)) {
                delete this.suggestions[key];
            }
        });
    }
    // This function will return all references in a node array, including sub-nodes
    getRefFromNodeArray(nodes, lines) {
        let refs = [];
        for (let index = 0; index < nodes.length; ++index) {
            if (index < nodes.length - 1) {
                // Also pass the next node to handle cases like `label={some-text}`
                refs = refs.concat(this.getRefFromNode(nodes[index], lines, nodes[index + 1]));
            }
            else {
                refs = refs.concat(this.getRefFromNode(nodes[index], lines));
            }
        }
        return refs;
    }
    // This function will return the reference defined by the node, or all references in `content`
    getRefFromNode(node, lines, nextNode) {
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        const useLabelKeyVal = configuration.get('intellisense.label.keyval');
        const refs = [];
        let label = '';
        if (latex_utensils_1.latexParser.isCommand(node) && node.name === 'label') {
            // \label{some-text}
            label = node.args.filter(latex_utensils_1.latexParser.isGroup)[0].content[0].content;
        }
        else if (latex_utensils_1.latexParser.isTextString(node) && node.content === 'label=' && useLabelKeyVal && nextNode !== undefined) {
            // label={some=text}
            label = nextNode.content[0].content;
        }
        if (label !== '' && (latex_utensils_1.latexParser.isCommand(node) || latex_utensils_1.latexParser.isTextString(node))) {
            refs.push({
                label,
                kind: vscode.CompletionItemKind.Reference,
                // One row before, four rows after
                documentation: lines.slice(node.location.start.line - 2, node.location.end.line + 4).join('\n'),
                // Here we abuse the definition of range to store the location of the reference definition
                range: new vscode.Range(node.location.start.line - 1, node.location.start.column, node.location.end.line - 1, node.location.end.column)
            });
            return refs;
        }
        if (latex_utensils_1.latexParser.hasContentArray(node)) {
            return this.getRefFromNodeArray(node.content, lines);
        }
        if (latex_utensils_1.latexParser.hasArgsArray(node)) {
            return this.getRefFromNodeArray(node.args, lines);
        }
        return refs;
    }
    getRefFromContent(content) {
        const refReg = /(?:\\label(?:\[[^[\]{}]*\])?|(?:^|[,\s])label=){([^}]*)}/gm;
        const refs = [];
        const refList = [];
        const contentNoEmpty = content.split('\n').filter(para => para !== '').join('\n');
        while (true) {
            const result = refReg.exec(content);
            if (result === null) {
                break;
            }
            if (refList.includes(result[1])) {
                continue;
            }
            const prevContent = contentNoEmpty.substring(0, contentNoEmpty.substring(0, result.index).lastIndexOf('\n') - 1);
            const followLength = contentNoEmpty.substring(result.index, contentNoEmpty.length).split('\n', 4).join('\n').length;
            const positionContent = content.substring(0, result.index).split('\n');
            refs.push({
                label: result[1],
                kind: vscode.CompletionItemKind.Reference,
                // One row before, four rows after
                documentation: contentNoEmpty.substring(prevContent.lastIndexOf('\n') + 1, result.index + followLength),
                // Here we abuse the definition of range to store the location of the reference definition
                range: new vscode.Range(positionContent.length - 1, positionContent[positionContent.length - 1].length, positionContent.length - 1, positionContent[positionContent.length - 1].length)
            });
            refList.push(result[1]);
        }
        return refs;
    }
    setNumbersFromAuxFile(rootFile) {
        const outDir = this.extension.manager.getOutDir(rootFile);
        const rootDir = path.dirname(rootFile);
        const auxFile = path.resolve(rootDir, path.join(outDir, path.basename(rootFile, '.tex') + '.aux'));
        Object.keys(this.suggestions).forEach(key => {
            this.suggestions[key].prevIndex = undefined;
        });
        this.prevIndexObj = {};
        if (!fs.existsSync(auxFile)) {
            return;
        }
        const newLabelReg = /^\\newlabel\{(.*?)\}\{\{(.*?)\}\{(.*?)\}/gm;
        const auxContent = fs.readFileSync(auxFile, { encoding: 'utf8' });
        while (true) {
            const result = newLabelReg.exec(auxContent);
            if (result === null) {
                break;
            }
            this.prevIndexObj[result[1]] = { refNumber: result[2], pageNumber: result[3] };
            if (result[1] in this.suggestions) {
                this.suggestions[result[1]].prevIndex = { refNumber: result[2], pageNumber: result[3] };
            }
        }
    }
}
exports.Reference = Reference;
//# sourceMappingURL=reference.js.map