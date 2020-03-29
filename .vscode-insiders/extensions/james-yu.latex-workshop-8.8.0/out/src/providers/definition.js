"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const tokenizer_1 = require("./tokenizer");
const utils = require("../utils/utils");
class DefinitionProvider {
    constructor(extension) {
        this.extension = extension;
    }
    onAFilename(document, position, token) {
        const line = document.lineAt(position.line).text;
        const escapedToken = utils.escapeRegExp(token);
        const regexInput = new RegExp(`\\\\(?:include|input|subfile)\\{${escapedToken}\\}`);
        const regexImport = new RegExp(`\\\\(?:sub)?(?:import|includefrom|inputfrom)\\*?\\{([^\\}]*)\\}\\{${escapedToken}\\}`);
        const regexDocumentclass = new RegExp(`\\\\(?:documentclass)(?:\\[[^[]]*\\])?\\{${escapedToken}\\}`);
        if (!vscode.window.activeTextEditor) {
            return undefined;
        }
        if (line.match(regexDocumentclass)) {
            return utils.resolveFile([path.dirname(vscode.window.activeTextEditor.document.fileName)], token, '.cls');
        }
        let dirs = [];
        if (line.match(regexInput)) {
            dirs = [path.dirname(vscode.window.activeTextEditor.document.fileName)];
            if (this.extension.manager.rootDir !== undefined) {
                dirs.push(this.extension.manager.rootDir);
            }
        }
        const result = line.match(regexImport);
        if (result) {
            dirs = [path.resolve(path.dirname(vscode.window.activeTextEditor.document.fileName), result[1])];
        }
        if (dirs.length > 0) {
            return utils.resolveFile(dirs, token, '.tex');
        }
        return undefined;
    }
    provideDefinition(document, position, _token) {
        return new Promise((resolve, _reject) => {
            const token = tokenizer_1.tokenizer(document, position);
            if (token === undefined) {
                resolve();
                return;
            }
            const refs = this.extension.completer.reference.getRefDict();
            if (token in refs) {
                const ref = refs[token];
                resolve(new vscode.Location(vscode.Uri.file(ref.file), ref.position));
                return;
            }
            const cites = this.extension.completer.citation.getEntryDict();
            if (token in cites) {
                const cite = cites[token];
                resolve(new vscode.Location(vscode.Uri.file(cite.file), cite.position));
                return;
            }
            if (token in this.extension.completer.command.definedCmds) {
                const command = this.extension.completer.command.definedCmds[token];
                resolve(command.location);
                return;
            }
            if (vscode.window.activeTextEditor && token.includes('.')) {
                // We skip graphics files
                const graphicsExtensions = ['.pdf', '.eps', '.jpg', '.jpeg', '.JPG', '.JPEG', '.gif', '.png'];
                const ext = path.extname(token);
                if (graphicsExtensions.includes(ext)) {
                    resolve();
                }
                const absolutePath = path.resolve(path.dirname(vscode.window.activeTextEditor.document.fileName), token);
                if (fs.existsSync(absolutePath)) {
                    resolve(new vscode.Location(vscode.Uri.file(absolutePath), new vscode.Position(0, 0)));
                    return;
                }
            }
            const filename = this.onAFilename(document, position, token);
            if (filename) {
                resolve(new vscode.Location(vscode.Uri.file(filename), new vscode.Position(0, 0)));
            }
            resolve();
        });
    }
}
exports.DefinitionProvider = DefinitionProvider;
//# sourceMappingURL=definition.js.map