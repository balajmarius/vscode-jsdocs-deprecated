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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.activate = void 0;
var ts = require("typescript");
var vscode = require("vscode");
var JSDOC_DEPRECATED_ANNOTATION = "*@deprecated*";
var DEFAULT_DECORATION_TYPE = { textDecoration: "line-through" };
function getIdentifierPositions(document) {
    var positions = [];
    var file = document.uri.fsPath;
    var program = ts.createProgram([file], { allowJs: true });
    var source = program.getSourceFile(file);
    var visit = function (node) {
        if (ts.isIdentifier(node)) {
            positions.push(document.positionAt(node.end));
        }
        ts.forEachChild(node, visit);
    };
    ts.forEachChild(source, visit);
    return positions;
}
function getHoverAnnotations(document, positions) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Promise.all(positions.map(function (position) {
                    return vscode.commands.executeCommand("vscode.executeHoverProvider", document.uri, position);
                }))];
        });
    });
}
function containsDeprecatedAnnotation(hovers) {
    return hovers.some(function (hover) {
        return hover.contents.some(function (content) { return content.value.includes(JSDOC_DEPRECATED_ANNOTATION); });
    });
}
function getDeprecatedRanges(hovers) {
    return hovers.reduce(function (ranges, hover) {
        if (containsDeprecatedAnnotation(hover)) {
            return __spreadArrays(ranges, [hover.pop().range]);
        }
        return ranges;
    }, []);
}
function paintAnnotations(editor, ranges, decorationType) {
    editor.setDecorations(decorationType, []);
    editor.setDecorations(decorationType, ranges);
}
function onDidUpdateTextDocument(document, editor, decorationType) {
    return __awaiter(this, void 0, void 0, function () {
        var positions, annotations, deprecated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!editor) return [3 /*break*/, 2];
                    positions = getIdentifierPositions(document);
                    return [4 /*yield*/, getHoverAnnotations(document, positions)];
                case 1:
                    annotations = _a.sent();
                    deprecated = getDeprecatedRanges(annotations);
                    paintAnnotations(editor, deprecated, decorationType);
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
function activate() {
    var decorationType = vscode.window.createTextEditorDecorationType(DEFAULT_DECORATION_TYPE);
    setImmediate(function () {
        return onDidUpdateTextDocument(vscode.window.activeTextEditor.document, vscode.window.activeTextEditor, decorationType);
    });
    vscode.workspace.onDidOpenTextDocument(function (document) {
        onDidUpdateTextDocument(document, vscode.window.activeTextEditor, decorationType);
    });
    vscode.workspace.onDidSaveTextDocument(function (document) {
        onDidUpdateTextDocument(document, vscode.window.activeTextEditor, decorationType);
    });
    vscode.window.onDidChangeActiveTextEditor(function (editor) {
        onDidUpdateTextDocument(editor.document, editor, decorationType);
    });
}
exports.activate = activate;
