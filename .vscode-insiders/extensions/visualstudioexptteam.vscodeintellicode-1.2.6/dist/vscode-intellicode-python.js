"use strict";
/*! Copyright (c) Microsoft Corporation. All rights reserved. */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __importStar(require("vscode"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const semver = __importStar(require("semver"));
const genericErrorMessage = "Cannot start IntelliCode support for Python. See output window for more details.";
const languageServerFolder = "languageServer";
const defaultAnalyzerName = "intellisense-members";
const lstmAnalyzerName = "intellisense-members-lstm";
class PythonSupport {
    getRequestedConfig() {
        return [{
                scopeName: "python",
                settingName: "jediEnabled",
                desiredValue: false,
                required: true,
                scopesToTry: [
                    vscode.ConfigurationTarget.Global,
                    vscode.ConfigurationTarget.Workspace,
                    vscode.ConfigurationTarget.WorkspaceFolder
                ],
                reloadWindowAfterApplying: true,
                notificationMessage: "IntelliCode Python support requires you to use the Microsoft Python Language Server (preview).",
                actionLabel: "Enable it and Reload Window"
            }];
    }
    async activate(api, logger) {
        let useDeepLearning = api.isFeatureEnabled("python.deepLearning");
        let analyzerName = useDeepLearning ? lstmAnalyzerName : defaultAnalyzerName;
        let model = await api.ModelAcquisitionService
            .getModelProvider("python", analyzerName)
            .getModelAsync();
        if (model === undefined && analyzerName === lstmAnalyzerName) {
            logger("No deep learning model available for Python, fall back to the default model.");
            analyzerName = defaultAnalyzerName;
            model = await api.ModelAcquisitionService
                .getModelProvider("python", analyzerName)
                .getModelAsync();
        }
        if (model === undefined) {
            logger("No model available for Python, cannot continue.");
            return Promise.resolve();
        }
        let modelJson = JSON.stringify(model);
        logger(`vs-intellicode-python was passed a model: ${modelJson}.`);
        const pythonExtension = vscode.extensions.getExtension("ms-python.python");
        if (!pythonExtension) {
            const err = "Microsoft Python extension is not installed.";
            logger(err);
            return Promise.reject(err);
        }
        if (!pythonExtension.isActive) {
            await pythonExtension.activate();
        }
        await pythonExtension.exports.ready;
        let intelliCodeAssemblyName = useDeepLearning ? "IntelliCodeForPythonLstm.dll" : "IntellicodeForPython2.dll";
        let assemblyPath = path_1.default.join(__dirname, intelliCodeAssemblyName);
        try {
            fs_1.default.accessSync(assemblyPath, fs_1.default.constants.F_OK);
        }
        catch (err) {
            logger(`Python Language Server extension assembly doesn't exist in ${assemblyPath}. Please reinstall IntelliCode.`);
            return Promise.reject(err);
        }
        let command = vscode.commands.executeCommand("python._loadLanguageServerExtension", {
            assembly: assemblyPath,
            typeName: "Microsoft.PythonTools.Analysis.Pythia.LanguageServerExtensionProvider",
            properties: {
                modelPath: model.modelPath
            }
        });
        if (command == null) {
            logger("Couldn't find language server extension command. Is the installed version of Python 2018.7.0 or later?");
            return Promise.reject(new Error(genericErrorMessage));
        }
        await command;
        logger("Loaded language server extension.");
        return Promise.resolve();
    }
    getSubDirectories(rootDir) {
        return new Promise(resolve => {
            fs_1.default.readdir(rootDir, (error, files) => {
                if (error) {
                    return resolve([]);
                }
                const subDirs = [];
                files.forEach(name => {
                    const fullPath = path_1.default.join(rootDir, name);
                    try {
                        if (fs_1.default.statSync(fullPath).isDirectory()) {
                            subDirs.push(fullPath);
                        }
                    }
                    catch (ex) { }
                });
                resolve(subDirs);
            });
        });
    }
    getFolderVersion(dirName) {
        const suffix = dirName.substring(languageServerFolder.length + 1);
        return suffix.length === 0 ? new semver.SemVer('0.0.0') : (semver.parse(suffix, true) || new semver.SemVer('0.0.0'));
    }
}
exports.PythonSupport = PythonSupport;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnNjb2RlLWludGVsbGljb2RlLXB5dGhvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy92c2NvZGUtaW50ZWxsaWNvZGUtcHl0aG9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxnRUFBZ0U7Ozs7Ozs7Ozs7OztBQUVoRSwrQ0FBaUM7QUFFakMsZ0RBQXdCO0FBQ3hCLDRDQUFvQjtBQUNwQiwrQ0FBaUM7QUFFakMsTUFBTSxtQkFBbUIsR0FBVyxrRkFBa0YsQ0FBQztBQUN2SCxNQUFNLG9CQUFvQixHQUFHLGdCQUFnQixDQUFDO0FBQzlDLE1BQU0sbUJBQW1CLEdBQUcsc0JBQXNCLENBQUM7QUFDbkQsTUFBTSxnQkFBZ0IsR0FBRywyQkFBMkIsQ0FBQztBQUVyRDtJQUVJLGtCQUFrQjtRQUNkLE9BQU8sQ0FBQztnQkFDSixTQUFTLEVBQUUsUUFBUTtnQkFDbkIsV0FBVyxFQUFFLGFBQWE7Z0JBQzFCLFlBQVksRUFBRSxLQUFLO2dCQUNuQixRQUFRLEVBQUUsSUFBSTtnQkFDZCxXQUFXLEVBQUU7b0JBQ1QsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE1BQU07b0JBQ2pDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTO29CQUNwQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsZUFBZTtpQkFDN0M7Z0JBQ0QseUJBQXlCLEVBQUUsSUFBSTtnQkFDL0IsbUJBQW1CLEVBQUUsZ0dBQWdHO2dCQUNySCxXQUFXLEVBQUUsNkJBQTZCO2FBQzdDLENBQUMsQ0FBQztJQUVQLENBQUM7SUFFRCxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQXFCLEVBQUUsTUFBNkI7UUFDL0QsSUFBSSxlQUFlLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDbEUsSUFBSSxZQUFZLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUM7UUFFNUUsSUFBSSxLQUFLLEdBQXFDLE1B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