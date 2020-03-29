"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
class TeXDoc {
    constructor(e) {
        this.extension = e;
    }
    runTexdoc(pkg) {
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        const texdocPath = configuration.get('texdoc.path');
        const texdocArgs = Object.assign([], configuration.get('texdoc.args'));
        texdocArgs.push(pkg);
        const proc = cp.spawn(texdocPath, texdocArgs);
        let stdout = '';
        proc.stdout.on('data', newStdout => {
            stdout += newStdout;
        });
        let stderr = '';
        proc.stderr.on('data', newStderr => {
            stderr += newStderr;
        });
        proc.on('error', err => {
            this.extension.logger.addLogMessage(`Cannot run texdoc: ${err.message}, ${stderr}`);
            this.extension.logger.showErrorMessage('Texdoc failed. Please refer to LaTeX Workshop Output for details.');
        });
        proc.on('exit', exitCode => {
            if (exitCode !== 0) {
                this.extension.logger.addLogMessage(`Cannot find documentation for ${pkg}.`);
                this.extension.logger.showErrorMessage('Texdoc failed. Please refer to LaTeX Workshop Output for details.');
            }
            else {
                const regex = new RegExp(`(no documentation found)|(Documentation for ${pkg} could not be found)`);
                if (stdout.match(regex) || stderr.match(regex)) {
                    this.extension.logger.addLogMessage(`Cannot find documentation for ${pkg}.`);
                    this.extension.logger.showErrorMessage(`Cannot find documentation for ${pkg}.`);
                }
                else {
                    this.extension.logger.addLogMessage(`Opening documentation for ${pkg}.`);
                }
            }
        });
    }
    texdoc(pkg) {
        if (pkg) {
            this.runTexdoc(pkg);
            return;
        }
        vscode.window.showInputBox({ value: '', prompt: 'Package name' }).then(selectedPkg => {
            if (!selectedPkg) {
                return;
            }
            this.runTexdoc(selectedPkg);
        });
    }
    texdocUsepackages() {
        let names = [];
        for (const tex of this.extension.manager.getIncludedTeX()) {
            const content = this.extension.manager.cachedContent[tex];
            const pkgs = content && content.element.package;
            if (!pkgs) {
                continue;
            }
            names = names.concat(pkgs);
        }
        const packagenames = Array.from(new Set(names));
        const items = packagenames.map(name => {
            return { label: name };
        });
        vscode.window.showQuickPick(items).then(selectedPkg => {
            if (!selectedPkg) {
                return;
            }
            this.runTexdoc(selectedPkg.label);
        });
    }
}
exports.TeXDoc = TeXDoc;
//# sourceMappingURL=texdoc.js.map