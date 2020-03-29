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
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
function mkdirRecursive(p) {
    if (!fs.existsSync(p)) {
        if (path.parse(p).root !== p) {
            let parent = path.join(p, "..");
            mkdirRecursive(parent);
        }
        fs.mkdirSync(p);
    }
}
class Extension {
    constructor(context) {
        this.context = context;
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('customizeUI.')) {
                this.configurationChanged(e);
            }
        }));
    }
    get sourcePath() {
        return path.join(this.context.extensionPath, "modules");
    }
    get modulesPath() {
        return path.join(this.context.globalStoragePath, "modules");
    }
    copyModule(name) {
        fs.copyFileSync(path.join(this.sourcePath, name), path.join(this.modulesPath, name));
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            mkdirRecursive(this.modulesPath);
            // copy the modules to global storage path, which unlike extension path is not versioned
            // and will work after update
            this.copyModule("customize-ui.css");
            this.copyModule("activity-bar.js");
            this.copyModule("customize-ui.js");
            this.copyModule("fonts.js");
            this.copyModule("swizzle.dylib");
            this.copyModule("title-bar-main-process.js");
            this.copyModule("title-bar.js");
            this.copyModule("utils.js");
            let monkeyPatch = vscode.extensions.getExtension("iocave.monkey-patch");
            if (monkeyPatch !== undefined) {
                yield monkeyPatch.activate();
                let exports = monkeyPatch.exports;
                exports.contribute("iocave.customize-ui", {
                    folderMap: {
                        "customize-ui": this.modulesPath,
                    },
                    browserModules: [
                        "customize-ui/customize-ui"
                    ],
                    mainProcessModules: [
                        "customize-ui/title-bar-main-process",
                    ]
                });
            }
            else {
                vscode.window.showWarningMessage("Monkey Patch extension is not installed. CustomizeUI will not work.");
            }
        });
    }
    checkExperimentalLayout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (vscode.workspace.getConfiguration().get("workbench.useExperimentalGridLayout") !== true) {
                let res = yield vscode.window.showWarningMessage("This option needs the 'useExperimentalGridLayout' option enabled", "Enable");
                if (res === "Enable") {
                    yield vscode.workspace.getConfiguration().update("workbench.useExperimentalGridLayout", true, vscode.ConfigurationTarget.Global);
                    return true;
                }
            }
            return false;
        });
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
    configurationChanged(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let monkeyPatch = vscode.extensions.getExtension("iocave.monkey-patch");
            if (monkeyPatch !== undefined) {
                yield monkeyPatch.activate();
                let exports = monkeyPatch.exports;
                if (!exports.active()) {
                    let res = yield vscode.window.showWarningMessage("Monkey Patch extension is not enabled. Please enable Monkey Patch in order to use Customize UI.", "Enable");
                    if (res === "Enable") {
                        vscode.commands.executeCommand("iocave.monkey-patch.enable");
                    }
                }
                else {
                    if (e.affectsConfiguration("customizeUI.activityBar") &&
                        vscode.workspace.getConfiguration().get("customizeUI.activityBar") === "bottom") {
                        let res = yield this.checkExperimentalLayout();
                        if (res) {
                            return;
                        }
                    }
                    if (e.affectsConfiguration("customizeUI.titleBar")) {
                        let enabled = vscode.workspace.getConfiguration().get("customizeUI.titleBar") === "inline";
                        if (enabled) {
                            let res = yield (this.checkExperimentalLayout());
                            if (res) {
                                return;
                            }
                            let titleBarStyle = vscode.workspace.getConfiguration().get("window.titleBarStyle");
                            if (titleBarStyle === "custom") {
                                let res = yield vscode.window.showWarningMessage("Inline title bar requires titleBarStyle = 'native'.", "Enable");
                                if (res === "Enable") {
                                    yield vscode.workspace.getConfiguration().update("window.titleBarStyle", "native", vscode.ConfigurationTarget.Global);
                                    return;
                                }
                            }
                        }
                        this.promptRestart();
                    }
                    let res = yield vscode.window.showInformationMessage("Customizing UI requires window reload", "Reload Window");
                    if (res === "Reload Window") {
                        vscode.commands.executeCommand("workbench.action.reloadWindow");
                    }
                }
            }
        });
    }
}
function activate(context) {
    new Extension(context).start();
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map