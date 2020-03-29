"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs-extra");
const latex_utensils_1 = require("latex-utensils");
class Environment {
    constructor(extension) {
        this.defaultEnvs = [];
        this.packageEnvs = {};
        this.extension = extension;
    }
    initialize(envs) {
        this.defaultEnvs = envs.map(env => new vscode.CompletionItem(env, vscode.CompletionItemKind.Module));
    }
    provide() {
        // Extract cached envs and add to default ones
        const suggestions = Array.from(this.defaultEnvs);
        const envList = this.defaultEnvs.map(env => env.label);
        this.extension.manager.getIncludedTeX().forEach(cachedFile => {
            const cachedEnvs = this.extension.manager.cachedContent[cachedFile].element.environment;
            if (cachedEnvs === undefined) {
                return;
            }
            cachedEnvs.forEach(env => {
                if (envList.includes(env.label)) {
                    return;
                }
                suggestions.push(env);
                envList.push(env.label);
            });
        });
        // If no insert package-defined environments
        if (!(vscode.workspace.getConfiguration('latex-workshop').get('intellisense.package.enabled'))) {
            return suggestions;
        }
        // Insert package environments
        this.extension.manager.getIncludedTeX().forEach(tex => {
            const pkgs = this.extension.manager.cachedContent[tex].element.package;
            if (pkgs === undefined) {
                return;
            }
            pkgs.forEach(pkg => {
                this.getEnvFromPkg(pkg).forEach(env => {
                    if (envList.includes(env.label)) {
                        return;
                    }
                    suggestions.push(env);
                    envList.push(env.label);
                });
            });
        });
        return suggestions;
    }
    update(file, nodes, lines, content) {
        if (nodes !== undefined && lines !== undefined) {
            this.extension.manager.cachedContent[file].element.environment = this.getEnvFromNodeArray(nodes, lines);
        }
        else if (content !== undefined) {
            this.extension.manager.cachedContent[file].element.environment = this.getEnvFromContent(content);
        }
    }
    // This function will return all environments in a node array, including sub-nodes
    getEnvFromNodeArray(nodes, lines) {
        let envs = [];
        for (let index = 0; index < nodes.length; ++index) {
            envs = envs.concat(this.getEnvFromNode(nodes[index], lines));
        }
        return envs;
    }
    getEnvFromNode(node, lines) {
        let envs = [];
        let label = '';
        // Here we only check `isEnvironment`which excludes `align*` and `verbatim`.
        // Nonetheless, they have already been included in `defaultEnvs`.
        if (latex_utensils_1.latexParser.isEnvironment(node)) {
            label = node.name;
            envs.push(new vscode.CompletionItem(label, vscode.CompletionItemKind.Module));
        }
        if (latex_utensils_1.latexParser.hasContentArray(node)) {
            envs = envs.concat(this.getEnvFromNodeArray(node.content, lines));
        }
        return envs;
    }
    getEnvFromPkg(pkg) {
        if (pkg in this.packageEnvs) {
            return this.packageEnvs[pkg];
        }
        const filePath = `${this.extension.extensionRoot}/data/packages/${pkg}_env.json`;
        if (!fs.existsSync(filePath)) {
            return [];
        }
        this.packageEnvs[pkg] = JSON.parse(fs.readFileSync(filePath).toString())
            .map(env => new vscode.CompletionItem(env, vscode.CompletionItemKind.Module));
        return this.packageEnvs[pkg];
    }
    getEnvFromContent(content) {
        const envReg = /\\begin\s?{([^{}]*)}/g;
        const envs = [];
        const envList = [];
        while (true) {
            const result = envReg.exec(content);
            if (result === null) {
                break;
            }
            if (envList.includes(result[1])) {
                continue;
            }
            envs.push(new vscode.CompletionItem(result[1], vscode.CompletionItemKind.Module));
            envList.push(result[1]);
        }
        return envs;
    }
}
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map