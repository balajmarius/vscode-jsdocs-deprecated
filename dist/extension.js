"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const ts = require("typescript");
const vscode = require("vscode");
const JSDOC_DEPRECATED_ANNOTATION = "*@deprecated*";
const DEFAULT_DECORATION_TYPE = { textDecoration: "line-through" };
function getIdentifierPositions(document) {
    const positions = [];
    const file = document.uri.fsPath;
    const program = ts.createProgram([file], { allowJs: true });
    const source = program.getSourceFile(file);
    const visit = (node) => {
        if (ts.isIdentifier(node)) {
            positions.push(document.positionAt(node.end));
        }
        ts.forEachChild(node, visit);
    };
    ts.forEachChild(source, visit);
    return positions;
}
function getHoverAnnotations(document, positions) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.all(positions.map((position) => vscode.commands.executeCommand("vscode.executeHoverProvider", document.uri, position)));
    });
}
function containsDeprecatedAnnotation(hovers) {
    return hovers.some((hover) => hover.contents.some((content) => content.value.includes(JSDOC_DEPRECATED_ANNOTATION)));
}
function getDeprecatedRanges(hovers) {
    return hovers.reduce((ranges, hover) => {
        if (containsDeprecatedAnnotation(hover)) {
            return [...ranges, hover.pop().range];
        }
        return ranges;
    }, []);
}
function paintAnnotations(editor, ranges, decorationType) {
    editor.setDecorations(decorationType, []);
    editor.setDecorations(decorationType, ranges);
}
function onDidUpdateTextDocument(document, editor, decorationType) {
    return __awaiter(this, void 0, void 0, function* () {
        if (editor) {
            const positions = getIdentifierPositions(document);
            const annotations = yield getHoverAnnotations(document, positions);
            const deprecated = getDeprecatedRanges(annotations);
            paintAnnotations(editor, deprecated, decorationType);
        }
    });
}
function activate() {
    const decorationType = vscode.window.createTextEditorDecorationType(DEFAULT_DECORATION_TYPE);
    setImmediate(() => onDidUpdateTextDocument(vscode.window.activeTextEditor.document, vscode.window.activeTextEditor, decorationType));
    vscode.workspace.onDidOpenTextDocument((document) => {
        onDidUpdateTextDocument(document, vscode.window.activeTextEditor, decorationType);
    });
    vscode.workspace.onDidSaveTextDocument((document) => {
        onDidUpdateTextDocument(document, vscode.window.activeTextEditor, decorationType);
    });
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        onDidUpdateTextDocument(editor.document, editor, decorationType);
    });
}
exports.activate = activate;
