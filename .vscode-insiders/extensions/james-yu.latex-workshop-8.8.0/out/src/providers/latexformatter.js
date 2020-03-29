"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const cs = require("cross-spawn");
const path = require("path");
const fs = require("fs");
const os = require("os");
const await_semaphore_1 = require("../lib/await-semaphore");
const fullRange = (doc) => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
class OperatingSystem {
    constructor(name, fileExt, checker) {
        this.name = name;
        this.fileExt = fileExt;
        this.checker = checker;
    }
}
exports.OperatingSystem = OperatingSystem;
const windows = new OperatingSystem('win32', '.exe', 'where');
const linux = new OperatingSystem('linux', '.pl', 'which');
const mac = new OperatingSystem('darwin', '.pl', 'which');
class LaTexFormatter {
    constructor(extension) {
        this.formatter = '';
        this.formatterArgs = [];
        this.formatMutex = new await_semaphore_1.Mutex();
        this.extension = extension;
        this.machineOs = os.platform();
        if (this.machineOs === windows.name) {
            this.currentOs = windows;
        }
        else if (this.machineOs === linux.name) {
            this.currentOs = linux;
        }
        else if (this.machineOs === mac.name) {
            this.currentOs = mac;
        }
        else {
            this.extension.logger.addLogMessage('LaTexFormatter: Unsupported OS');
        }
    }
    async formatDocument(document, range) {
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        const useDocker = configuration.get('docker.enabled');
        const pathMeta = configuration.get('latexindent.path');
        this.formatterArgs = configuration.get('latexindent.args');
        const releaseMutex = await this.formatMutex.acquire();
        try {
            if (!this.currentOs) {
                return [];
            }
            if (pathMeta !== this.formatter) {
                this.formatter = pathMeta;
                const latexindentPresent = await this.checkPath(this.currentOs.checker, useDocker);
                if (!latexindentPresent) {
                    this.extension.logger.addLogMessage('Can not find latexindent in PATH!');
                    this.extension.logger.showErrorMessage('Can not find latexindent in PATH!');
                    return [];
                }
            }
            const edit = await this.format(document, range);
            return edit;
        }
        finally {
            releaseMutex();
        }
    }
    checkPath(checker, useDocker) {
        if (useDocker) {
            if (process.platform === 'win32') {
                this.formatter = path.resolve(this.extension.extensionRoot, './scripts/latexindent.bat');
            }
            else {
                this.formatter = path.resolve(this.extension.extensionRoot, './scripts/latexindent');
                fs.chmodSync(this.formatter, 0o755);
            }
            return Promise.resolve(true);
        }
        return new Promise((resolve, _reject) => {
            cp.exec(checker + ' ' + this.formatter, (err, _stdout, _stderr) => {
                if (err) {
                    if (!this.currentOs) {
                        return;
                    }
                    this.formatter += this.currentOs.fileExt;
                    cp.exec(checker + ' ' + this.formatter, (err1, _stdout1, _stderr1) => {
                        if (err1) {
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    format(document, range) {
        return new Promise((resolve, _reject) => {
            const configuration = vscode.workspace.getConfiguration('latex-workshop');
            const useDocker = configuration.get('docker.enabled');
            if (!vscode.window.activeTextEditor) {
                return;
            }
            const options = vscode.window.activeTextEditor.options;
            const tabSize = options.tabSize ? +options.tabSize : 4;
            const useSpaces = options.insertSpaces;
            const indent = useSpaces ? ' '.repeat(tabSize) : '\\t';
            const documentDirectory = path.dirname(document.fileName);
            // The version of latexindent shipped with current latex distributions doesn't support piping in the data using stdin, support was
            // only added on 2018-01-13 with version 3.4 so we have to create a temporary file
            const textToFormat = document.getText(range);
            const temporaryFile = documentDirectory + path.sep + '__latexindent_temp.tex';
            fs.writeFileSync(temporaryFile, textToFormat);
            const doc = document.fileName.replace(/\.tex$/, '').split(path.sep).join('/');
            const docfile = path.basename(document.fileName, '.tex').split(path.sep).join('/');
            // generate command line arguments
            const args = this.formatterArgs.map(arg => arg
                // taken from ../components/builder.ts
                .replace(/%DOC%/g, useDocker ? docfile : doc)
                .replace(/%DOCFILE%/g, docfile)
                .replace(/%DIR%/g, useDocker ? '.' : path.dirname(document.fileName).split(path.sep).join('/'))
                // latexformatter.ts specific tokens
                .replace(/%TMPFILE%/g, useDocker ? path.basename(temporaryFile) : temporaryFile.split(path.sep).join('/'))
                .replace(/%INDENT%/g, indent));
            this.extension.logger.addLogMessage(`Formatting with command ${this.formatter} ${args}`);
            this.extension.manager.setEnvVar();
            const worker = cs.spawn(this.formatter, args, { stdio: 'pipe', cwd: path.dirname(document.fileName) });
            // handle stdout/stderr
            const stdoutBuffer = [];
            const stderrBuffer = [];
            worker.stdout.on('data', chunk => stdoutBuffer.push(chunk.toString()));
            worker.stderr.on('data', chunk => stderrBuffer.push(chunk.toString()));
            worker.on('error', err => {
                this.extension.logger.showErrorMessage('Formatting failed. Please refer to LaTeX Workshop Output for details.');
                this.extension.logger.addLogMessage(`Formatting failed: ${err.message}`);
                this.extension.logger.addLogMessage(`stderr: ${stderrBuffer.join('')}`);
                resolve();
            });
            worker.on('close', code => {
                if (code !== 0) {
                    this.extension.logger.showErrorMessage('Formatting failed. Please refer to LaTeX Workshop Output for details.');
                    this.extension.logger.addLogMessage(`Formatting failed with exit code ${code}`);
                    this.extension.logger.addLogMessage(`stderr: ${stderrBuffer.join('')}`);
                    return resolve();
                }
                const stdout = stdoutBuffer.join('');
                if (stdout !== '') {
                    const edit = [vscode.TextEdit.replace(range ? range : fullRange(document), stdout)];
                    try {
                        fs.unlinkSync(temporaryFile);
                        fs.unlinkSync(documentDirectory + path.sep + 'indent.log');
                    }
                    catch (ignored) {
                    }
                    this.extension.logger.addLogMessage('Formatted ' + document.fileName);
                    return resolve(edit);
                }
                return resolve();
            });
        });
    }
}
exports.LaTexFormatter = LaTexFormatter;
class LatexFormatterProvider {
    constructor(extension) {
        this.formatter = new LaTexFormatter(extension);
    }
    provideDocumentFormattingEdits(document, _options, _token) {
        return this.formatter.formatDocument(document);
    }
    provideDocumentRangeFormattingEdits(document, range, _options, _token) {
        return this.formatter.formatDocument(document, range);
    }
}
exports.LatexFormatterProvider = LatexFormatterProvider;
//# sourceMappingURL=latexformatter.js.map