'use strict';
const vscode = require("vscode");
const formatter_1 = require("./formatter");
function activate(context) {
    var formatter = new formatter_1.default();
    context.subscriptions.push(vscode.commands.registerTextEditorCommand("wwm.aligncode", (editor) => {
        formatter.process(editor);
    }));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map