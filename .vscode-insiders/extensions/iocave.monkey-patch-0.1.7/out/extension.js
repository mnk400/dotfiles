"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const fs_1 = require("./fs");
const script_1 = require("./script");
const path_manager_1 = require("./path-manager");
const configuration_1 = require("./configuration");
class Extension {
    constructor(context) {
        this.configuration = new configuration_1.Configuration();
        this.contributions = {};
        this.context = context;
        this.pathManager = new path_manager_1.PathManager(context);
        this.register();
        this.loadContributions();
        this.configurationChanged();
        if (this.active) {
            this.checkState();
        }
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('monkeyPatch.')) {
                this.configurationChanged();
            }
        }));
        let firstRun = this.context.globalState.get("firstRun");
        if (firstRun === undefined) {
            firstRun = true;
        }
        if (firstRun && !this.active) {
            this.enable();
        }
        this.context.globalState.update("firstRun", false);
    }
    checkState() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!fs.existsSync(this.pathManager.bootstrapBackupPath) ||
                    !fs.existsSync(this.pathManager.workbenchHtmlReplacementPath) ||
                    !this.contains(this.pathManager.bootstrapPath, '"monkey"')) {
                    let r = yield vscode.window.showInformationMessage("Monkey Patch changes seem to have been overwritten.", "Re-apply", "Ignore");
                    if (r === "Re-apply") {
                        this.install();
                    }
                    else {
                        this.context.globalState.update("active", false);
                    }
                }
                else {
                    console.log("Monkey Patch is active.");
                }
            }
            catch (e) {
                console.log("Check state failed", e);
                return false;
            }
        });
    }
    contains(filePath, searchFor) {
        let content = fs.readFileSync(filePath, "utf8");
        return content.indexOf(searchFor) !== -1;
    }
    register() {
        let disposable = vscode.commands.registerCommand('iocave.monkey-patch.enable', () => __awaiter(this, void 0, void 0, function* () {
            this.enable();
        }));
        this.context.subscriptions.push(disposable);
        disposable = vscode.commands.registerCommand('iocave.monkey-patch.disable', () => __awaiter(this, void 0, void 0, function* () {
            this.disable();
        }));
        this.context.subscriptions.push(disposable);
    }
    get active() {
        return this.context.globalState.get("active");
    }
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.active) {
                let res = yield vscode.window.showInformationMessage("Monkey Patch will modify certain files within your VSCode installation. In case something goes wrong, you can use the 'Disable Monkey Patch' command or simply reinstall VSCode.", "Proceed", "Cancel");
                if (res !== "Proceed") {
                    return;
                }
            }
            this.install();
        });
    }
    disable() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.uninstall();
                this.context.globalState.update("active", false);
                let res = yield vscode.window.showInformationMessage("Monkey Patch disabled. Please RESTART (not just reload) your VSCode instance!", "Restart");
                if (res === "Restart") {
                    yield this.promptRestart();
                }
            }
            catch (e) {
                vscode.window.showErrorMessage(`Monkey Patch failed: ${e}`);
            }
        });
    }
    updateConfiguration() {
        let cfg = vscode.workspace.getConfiguration("monkeyPatch");
        let folderMap = {
            "monkey-generated": this.pathManager.generatedScriptsPath,
        };
        let map = cfg.get("folderMap");
        if (map instanceof Object) {
            Object.entries(map).forEach(entry => {
                folderMap[`${entry[0]}`] = `${entry[1]}`;
            });
        }
        Object.entries(this.contributions).forEach(([id, contribution]) => {
            Object.entries(contribution.folderMap).map(([key, value]) => {
                folderMap[key] = value;
            });
        });
        this.configuration.updateFolderMap(folderMap);
        let modules = cfg.get("mainProcessModules");
        let mainProcessModules = ["monkey-generated/entrypoint-main"];
        if (modules instanceof Array) {
            modules.forEach(element => {
                mainProcessModules.push(element);
            });
        }
        Object.entries(this.contributions).forEach(([id, contribution]) => {
            contribution.mainProcessModules.forEach((module) => {
                mainProcessModules.push(module);
            });
        });
        this.configuration.updateMainProcessModules(mainProcessModules);
        //
        modules = cfg.get("browserModules");
        let browserModules = [];
        if (modules instanceof Array) {
            modules.forEach(element => {
                browserModules.push(element);
            });
        }
        Object.entries(this.contributions).forEach(([id, contribution]) => {
            contribution.browserModules.forEach((module) => {
                browserModules.push(module);
            });
        });
        this.configuration.updateBrowserModules(browserModules);
    }
    promptRestart() {
        return __awaiter(this, void 0, void 0, function* () {
            // This is a hacky way to display the restart prompt
            let v = vscode.workspace.getConfiguration().inspect("window.titleBarStyle");
            if (v !== undefined) {
                let value = vscode.workspace.getConfiguration().get("window.titleBarStyle");
                yield vscode.workspace.getConfiguration().update("window.titleBarStyle", value === "native" ? "custom" : "native", vscode.ConfigurationTarget.Global);
                vscode.workspace.getConfiguration().update("window.titleBarStyle", v.globalValue, vscode.ConfigurationTarget.Global);
            }
        });
    }
    configurationChanged() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = this.regenerate();
            if (this.active) {
                if (res.mainProcessModulesChanged) {
                    let last = this.lastMessageTimeMainProcess;
                    if (last !== undefined && (new Date().getTime() - last) < 3000) {
                        return;
                    }
                    this.lastMessageTimeMainProcess = new Date().getTime();
                    let res = yield vscode.window.showInformationMessage("Monkey Patch configuration has changed. Please RESTART (not just reload) your VSCode instance!", "Restart");
                    if (res === "Restart") {
                        yield this.promptRestart();
                    }
                }
                else if (res.browserModulesChanged) {
                    let last = this.lastMessageTimeMainProcess || this.lastMessageTimeBrowser;
                    if (last !== undefined && (new Date().getTime() - last) < 3000) {
                        return;
                    }
                    this.lastMessageTimeBrowser = new Date().getTime();
                    let res = yield vscode.window.showInformationMessage("Monkey Patch configuration has changed. Please RELOAD your VSCode window!", "Reload");
                    if (res === "Reload") {
                        vscode.commands.executeCommand("workbench.action.reloadWindow");
                    }
                }
            }
        });
    }
    static eqSet(s1, s2) {
        return s1.size === s2.size && [...s1].every(value => s2.has(value));
    }
    install() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.regenerate();
                yield this._install();
                this.context.globalState.update("active", true);
                let res = yield vscode.window.showInformationMessage("Monkey Patch enabled. Please RESTART (not just reload) your VSCode instance!", "Restart");
                if (res === "Restart") {
                    yield this.promptRestart();
                }
            }
            catch (e) {
                vscode.window.showErrorMessage(`Monkey Patch failed: ${e}`);
            }
        });
    }
    regenerate() {
        fs_1.mkdirRecursive(this.pathManager.generatedScriptsPath);
        this.updateConfiguration();
        fs.copyFileSync(path.join(this.pathManager.extensionDataPath, "modules", "entrypoint-main.js"), path.join(this.pathManager.generatedScriptsPath, "entrypoint-main.js"));
        let mainProcess = this.configuration.writeMainProcessEntrypoint(this.pathManager.mainProcessEntrypointPath);
        let browserEntrypoint = this.configuration.writeBrowserEntrypoint(this.pathManager.browserEntrypointPath);
        return {
            mainProcessModulesChanged: mainProcess,
            browserModulesChanged: browserEntrypoint,
        };
    }
    _install() {
        return __awaiter(this, void 0, void 0, function* () {
            let script = new script_1.Script();
            script.begin();
            if (!fs.existsSync(this.pathManager.bootstrapBackupPath)) {
                script.copy(this.pathManager.bootstrapPath, this.pathManager.bootstrapBackupPath);
            }
            script.template(path.join(this.pathManager.extensionDataPath, "bootstrap-amd.js"), this.pathManager.bootstrapPath, new Map(Object.entries({
                "[[MONKEY_PATCH_ROOT]]": this.configuration.formatPath(this.pathManager.generatedScriptsPath),
            })));
            const browserEntryPoint = this.toFileUri(this.pathManager.browserEntrypointPath);
            script.template(this.pathManager.workbenchHtmlPath, this.pathManager.workbenchHtmlReplacementPath, new Map(Object.entries({
                "<script src=\"workbench.js\"></script>": `<script src=\"${browserEntryPoint}\"></script>` +
                    "\n\t<script src=\"workbench.js\"></script>",
            })));
            return script.commit(this.needsRoot());
        });
    }
    toFileUri(filePath) {
        const match = filePath.match(/^([a-z])\:(.*)$/i);
        if (match) {
            filePath = '/' + match[1].toUpperCase() + ':' + match[2];
        }
        return 'file://' + filePath.replace(/\\/g, '/');
    }
    uninstall() {
        return __awaiter(this, void 0, void 0, function* () {
            if (fs.existsSync(this.pathManager.bootstrapBackupPath)) {
                let script = new script_1.Script();
                script.begin();
                script.rm(this.pathManager.bootstrapPath);
                script.move(this.pathManager.bootstrapBackupPath, this.pathManager.bootstrapPath);
                script.rm(this.pathManager.workbenchHtmlReplacementPath);
                return script.commit(this.needsRoot());
            }
        });
    }
    needsRoot() {
        let needsRoot = false;
        try {
            const testFile = path.join(this.pathManager.installationPath, ".testFile");
            fs.writeFileSync(testFile, "");
            fs.unlinkSync(testFile);
        }
        catch (e) {
            needsRoot = true;
        }
        return needsRoot;
    }
    contribute(sourceExtensionId, contribution) {
        if (vscode.extensions.getExtension(sourceExtensionId) === undefined) {
            throw new Error(`"${sourceExtensionId}" is not a valid extension id. Make sure you have "publisher" set in your package.json, and pass in "<publisher>.<name>"`);
        }
        this.contributions[sourceExtensionId] = contribution;
        this.saveContributions();
        this.configurationChanged();
    }
    saveContributions() {
        this.context.globalState.update("contributions", this.contributions);
    }
    loadContributions() {
        let contributions = this.context.globalState.get("contributions");
        if (contributions !== undefined) {
            Object.entries(contributions).forEach(([id, contribution]) => {
                if (vscode.extensions.getExtension(id) !== undefined) {
                    this.contributions[id] = contribution;
                }
            });
        }
        vscode.extensions.onDidChange(() => {
            this.configurationChanged();
        }, this.context.subscriptions);
    }
}
let extension;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    extension = new Extension(context);
    let api = {
        contribute(sourceExtensionId, contribution) {
            extension.contribute(sourceExtensionId, contribution);
        },
        active() {
            return extension.active;
        }
    };
    return api;
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map