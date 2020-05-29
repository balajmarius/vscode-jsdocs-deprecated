import * as vscode from "vscode";

async function onDidUpdateTextDocument(document: vscode.TextDocument, editor: vscode.TextEditor) {}

export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
    onDidUpdateTextDocument(document, vscode.window.activeTextEditor);
  });
  vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor) => {
    onDidUpdateTextDocument(editor.document, editor);
  });
}

export function deactivate() {}
