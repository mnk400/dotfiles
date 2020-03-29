"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const fs_1 = require("fs");
class BuildInfo {
    constructor(extension) {
        this.extension = extension;
        this.status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -10001);
        this.status.command = 'latex-workshop.showCompilationPanel';
        this.status.tooltip = 'Show LaTeX Compilation Info Panel';
        this.isProgressBarEnabled = undefined;
        this.status.show();
        this.resolve = () => { };
    }
    buildStarted(progress) {
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        this.isProgressBarEnabled = configuration.get('progress.enabled');
        if (!this.isProgressBarEnabled) {
            return;
        }
        this.progress = progress;
        this.currentBuild = {
            buildStart: +new Date(),
            pageTotal: undefined,
            lastStepTime: +new Date(),
            stepTimes: {},
            stdout: '\n'.repeat(50),
            ruleNumber: 0,
            ruleName: '',
            ruleProducesPages: undefined
        };
        this.status.text = '';
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'init',
                startTime: this.currentBuild.buildStart,
                pageTotal: this.currentBuild.pageTotal
            });
        }
    }
    buildEnded() {
        if (!this.isProgressBarEnabled) {
            return;
        }
        if (this.currentBuild) {
            this.status.text = `( ${((+new Date() - this.currentBuild.buildStart) / 1000).toFixed(1)} s )`;
            this.currentBuild = undefined;
            setTimeout(() => {
                if (!this.currentBuild) {
                    this.status.text = '';
                }
            }, 5000);
            if (this.panel) {
                this.panel.webview.postMessage({ type: 'finished' });
            }
        }
        this.resolve();
    }
    setPageTotal(count) {
        if (!this.isProgressBarEnabled) {
            return;
        }
        if (this.currentBuild) {
            this.currentBuild.pageTotal = count;
        }
    }
    setResolveToken(resolve) {
        if (!this.isProgressBarEnabled) {
            return;
        }
        this.resolve = resolve;
    }
    newStdoutLine(lines) {
        if (!this.isProgressBarEnabled) {
            return;
        }
        if (!this.currentBuild) {
            throw Error('Can\'t Display Progress for non-Started build - see BuildInfo.buildStarted()');
        }
        for (const line of lines.split('\n')) {
            this.currentBuild.stdout =
                this.currentBuild.stdout.substring(this.currentBuild.stdout.indexOf('\n') + 1) + '\n' + line;
            this.checkStdoutForInfo();
        }
    }
    checkStdoutForInfo() {
        const pageNumberRegex = /\[(\d+)[^[\]]*\]$/;
        const latexmkRuleStartedRegex = /Latexmk: applying rule '([A-Za-z\s/]+)'\.\.\.\n$/;
        // const auxOutfileReference = /\(\.[\/\w ]+\.aux\)[\w\s\/\(\)\-\.]*$/
        const hardcodedRulesPageProducing = ['pdflatex', 'pdftex', 'lualatex', 'xelatex'];
        const hardcodedRulesOther = ['sage'];
        // A rule consists of a regex to catch the program starting and a boolean of whether
        // or not the program produces pages in the PDF
        // TODO: Add more rules
        const rules = {
            pdfTeX: [/This is pdfTeX, Version [\d.-]+[^\n]*$/, true],
            BibTeX: [/This is BibTeX[\w.\- ",()]+$/, false],
            Biber: [/This is Biber[\w.\- ",()]+$/, false],
            Sage: [/Processing Sage code for [\w.\- "]+\.\.\.$/, false],
            LuaTeX: [/This is LuaTeX, Version [\d.]+[^\n]*$/, true],
            XeTex: [/This is XeTeX, Version [\d.-]+[^\n]*$/, true]
        };
        if (!this.currentBuild) {
            return;
        }
        if (this.currentBuild.ruleProducesPages && this.currentBuild.stdout.match(pageNumberRegex)) {
            const pageNoRes = this.currentBuild.stdout.match(pageNumberRegex);
            const pageNo = pageNoRes ? parseInt(pageNoRes[1]) : NaN;
            if (!isNaN(pageNo)) {
                this.displayProgress(pageNo);
            }
        }
        else if (this.currentBuild.stdout.match(latexmkRuleStartedRegex)) {
            const ruleNameRes = this.currentBuild.stdout.match(latexmkRuleStartedRegex);
            const ruleName = ruleNameRes ? ruleNameRes[1] : '';
            // if rule name does not have own entry
            if (![...hardcodedRulesPageProducing, ...hardcodedRulesOther].includes(ruleName)) {
                this.currentBuild.ruleName = ruleName;
                this.currentBuild.ruleProducesPages = undefined;
                this.currentBuild.stepTimes[`${++this.currentBuild.ruleNumber}-${this.currentBuild.ruleName}`] = {};
                this.displayProgress(0, true);
                this.currentBuild.lastStepTime = +new Date();
            }
        }
        else {
            for (const [ruleName, ruleData] of Object.entries(rules)) {
                if (this.currentBuild.stdout.match(ruleData[0])) {
                    this.currentBuild.ruleName = ruleName;
                    this.currentBuild.ruleProducesPages = ruleData[1];
                    this.currentBuild.stepTimes[`${++this.currentBuild.ruleNumber}-${this.currentBuild.ruleName}`] = {};
                    this.displayProgress(0, true);
                    this.currentBuild.lastStepTime = +new Date();
                    break;
                }
            }
        }
    }
    showPanel() {
        if (this.panel) {
            return;
        }
        this.panel = vscode.window.createWebviewPanel('compilationInfo', 'LaTeX Compilation Live Info', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.extension.extensionRoot, 'resources', 'buildinfo'))]
        });
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
        const webviewSourcePath = path.join(this.extension.extensionRoot, 'resources', 'buildinfo', 'buildinfo.html');
        let webviewHtml = fs_1.readFileSync(webviewSourcePath, { encoding: 'utf8' });
        webviewHtml = webviewHtml.replace(/vscode-resource:\.\//, 'vscode-resource:' +
            vscode.Uri.file(path.join(this.extension.extensionRoot, 'resources', 'buildinfo')).with({
                scheme: 'vscode-resource'
            }).path +
            '/');
        this.panel.webview.html = webviewHtml;
        if (this.currentBuild) {
            this.panel.reveal(vscode.ViewColumn.Beside);
            this.panel.webview.postMessage({
                type: 'init',
                startTime: this.currentBuild.buildStart,
                stepTimes: this.currentBuild.stepTimes,
                pageTotal: this.currentBuild.pageTotal
            });
        }
    }
    generateProgressBar(proportion, length) {
        const wholeCharacters = Math.min(length, Math.trunc(length * proportion));
        const characterSets = {
            none: {
                wholeCharacter: '',
                partialCharacters: [''],
                blankCharacter: ''
            },
            'Block Width': {
                wholeCharacter: '█',
                partialCharacters: ['', '▏', '▎', '▍', '▌ ', '▋', '▊', '▉', '█ '],
                blankCharacter: '░'
            },
            'Block Shading': {
                wholeCharacter: '█',
                partialCharacters: ['', '░', '▒', '▓'],
                blankCharacter: '░'
            },
            'Block Quadrants': {
                wholeCharacter: '█',
                partialCharacters: ['', '▖', '▚', '▙'],
                blankCharacter: '░'
            }
        };
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        const selectedCharacterSet = configuration.get('progress.barStyle');
        const wholeCharacter = characterSets[selectedCharacterSet].wholeCharacter;
        const partialCharacter = characterSets[selectedCharacterSet].partialCharacters[Math.round((length * proportion - wholeCharacters) *
            (characterSets[selectedCharacterSet].partialCharacters.length - 1))];
        const blankCharacter = characterSets[selectedCharacterSet].blankCharacter;
        return (wholeCharacter.repeat(wholeCharacters) +
            partialCharacter +
            blankCharacter.repeat(Math.max(0, length - wholeCharacters - partialCharacter.length)));
    }
    displayProgress(current, reset = false) {
        if (!this.currentBuild) {
            throw Error('Can\'t Display Progress for non-Started build - see BuildInfo.buildStarted()');
        }
        if (current === 0) {
            this.currentBuild.stepTimes[`${this.currentBuild.ruleNumber}-${this.currentBuild.ruleName}`][`T${+new Date()}-Wait Time`] = +new Date() - this.currentBuild.lastStepTime;
        }
        else {
            if (this.currentBuild.ruleProducesPages) {
                // if page already exists, add times and remove old entry
                const pageAlreadyExistsRegex = new RegExp(`^T\\d+-PAGE:${current}`);
                const pageMatchArray = Object.keys(this.currentBuild.stepTimes[`${this.currentBuild.ruleNumber}-${this.currentBuild.ruleName}`]).map(pageLabel => Boolean(pageLabel.match(pageAlreadyExistsRegex)));
                let extraTime = 0;
                if (pageMatchArray.includes(true)) {
                    extraTime = this.currentBuild.stepTimes[`${this.currentBuild.ruleNumber}-${this.currentBuild.ruleName}`][Object.keys(this.currentBuild.stepTimes[`${this.currentBuild.ruleNumber}-${this.currentBuild.ruleName}`])[pageMatchArray.indexOf(true)]];
                    delete this.currentBuild.stepTimes[`${this.currentBuild.ruleNumber}-${this.currentBuild.ruleName}`][Object.keys(this.currentBuild.stepTimes[`${this.currentBuild.ruleNumber}-${this.currentBuild.ruleName}`])[pageMatchArray.indexOf(true)]];
                }
                else {
                    const pagesProducedByCurrentRule = Object.keys(this.currentBuild.stepTimes[`${this.currentBuild.ruleNumber}-${this.currentBuild.ruleName}`]).length - 1;
                    if (typeof this.currentBuild.pageTotal !== 'number' ||
                        pagesProducedByCurrentRule > this.currentBuild.pageTotal) {
                        this.currentBuild.pageTotal = pagesProducedByCurrentRule;
                    }
                }
                this.currentBuild.stepTimes[`${this.currentBuild.ruleNumber}-${this.currentBuild.ruleName}`][`T${+new Date()}-PAGE:${current}`] = +new Date() - this.currentBuild.lastStepTime + extraTime;
            }
            else {
                this.currentBuild.stepTimes[`${this.currentBuild.ruleNumber}-${this.currentBuild.ruleName}`][`T${+new Date()}-${current}`] = +new Date() - this.currentBuild.lastStepTime;
            }
        }
        this.currentBuild.lastStepTime = +new Date();
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'update',
                stepTimes: this.currentBuild.stepTimes,
                pageTotal: this.currentBuild.pageTotal
            });
        }
        const enclosedNumbers = {
            Parenthesised: {
                0: '⒪',
                1: '⑴',
                2: '⑵',
                3: '⑶',
                4: '⑷',
                5: '⑸',
                6: '⑹',
                7: '⑺',
                8: '⑻',
                9: '⑼',
                10: '⑽',
                11: '⑾',
                12: '⑿',
                13: '⒀',
                14: '⒁',
                15: '⒂',
                16: '⒃',
                17: '⒄',
                18: '⒅',
                19: '⒆',
                20: '⒇'
            },
            Circled: {
                0: '⓪',
                1: '①',
                2: '②',
                3: '③',
                4: '④',
                5: '⑤',
                6: '⑥',
                7: '⑦',
                8: '⑧',
                9: '⑨',
                10: '⑩',
                11: '⑪',
                12: '⑫',
                13: '⑬',
                14: '⑭',
                15: '⑮',
                16: '⑯',
                17: '⑰',
                18: '⑱',
                19: '⑲',
                20: '⑳'
            },
            'Solid Circled': {
                0: '⓿',
                1: '❶',
                2: '❷',
                3: '❸',
                4: '❹',
                5: '❺',
                6: '❻',
                7: '❼',
                8: '❽',
                9: '❾',
                10: '❿',
                11: '⓫',
                12: '⓬',
                13: '⓭',
                14: '⓮',
                15: '⓯',
                16: '⓰',
                17: '⓱',
                18: '⓲',
                19: '⓳',
                20: '⓴'
            },
            'Full Stop': {
                0: '0.',
                1: '⒈',
                2: '⒉',
                3: '⒊',
                4: '⒋',
                5: '⒌',
                6: '⒍',
                7: '⒎',
                8: '⒏',
                9: '⒐',
                10: '⒑',
                11: '⒒',
                12: '⒓',
                13: '⒔',
                14: '⒕',
                15: '⒖',
                16: '⒗',
                17: '⒘',
                18: '⒙',
                19: '⒚',
                20: '⒛'
            }
        };
        const padRight = (str, desiredMinLength) => {
            if (str.length < desiredMinLength) {
                str = str + ' '.repeat(desiredMinLength - str.length);
            }
            return str;
        };
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        const runIconType = configuration.get('progress.runIconType');
        const index = this.currentBuild.ruleNumber;
        const runIcon = enclosedNumbers[runIconType][index];
        // Reset progress bar on each run
        if (this.progress && reset) {
            this.progress.report({ increment: -100 });
        }
        if (this.currentBuild.ruleProducesPages === false) {
            // set generic status text
            if (this.progress) {
                this.progress.report({ message: `Run ${this.currentBuild.ruleNumber}, ${this.currentBuild.ruleName}` });
            }
            else {
                this.status.text = `${runIcon} ${this.currentBuild.ruleName}`;
            }
        }
        else {
            // if we have a page no. we can do better
            if (typeof current === 'string') {
                current = parseInt(current);
            }
            const currentAsString = current.toString();
            const endpointAsString = this.currentBuild.pageTotal ? '/' + this.currentBuild.pageTotal.toString() : '';
            if (this.progress) {
                this.progress.report({
                    message: `Run ${this.currentBuild.ruleNumber}, processing page ${currentAsString + endpointAsString}`,
                    increment: current === 0 ? 0 :
                        this.currentBuild.pageTotal ? 1 / this.currentBuild.pageTotal * 100 : undefined
                });
            }
            else {
                const barAsString = this.currentBuild.pageTotal
                    ? this.generateProgressBar(current / this.currentBuild.pageTotal, configuration.get('progress.barLength'))
                    : '';
                this.status.text = `${runIcon}, Page ${padRight(currentAsString + endpointAsString, this.currentBuild.pageTotal ? this.currentBuild.pageTotal.toString().length * 2 + 2 : 6)} ${barAsString}`;
            }
        }
    }
}
exports.BuildInfo = BuildInfo;
//# sourceMappingURL=buildinfo.js.map