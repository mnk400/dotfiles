'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const
  clockService = require('./clockservice'),
  ClockStatusBarItem = require('./clockstatusbaritem'),
  vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(new ClockStatusBarItem());

  context.subscriptions.push(vscode.commands.registerTextEditorCommand('clock.insertDateTime', (textEditor, edit) => {
    textEditor.selections.forEach(selection => {
      const
        start = selection.start,
        end = selection.end;

      if (start.line === end.line && start.character === end.character) {
        edit.insert(start, clockService());
      } else {
        edit.replace(selection, clockService());
      }
    });
  }));
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

exports.deactivate = deactivate;