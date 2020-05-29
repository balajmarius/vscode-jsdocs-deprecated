import * as ts from "typescript";
import * as vscode from "vscode";

const JSDOC_DEPRECATED_ANNOTATION: string = "*@deprecated*";
const DEFAULT_DECORATION_TYPE: vscode.DecorationRenderOptions = vscode.window.createTextEditorDecorationType({
  textDecoration: "line-through",
});

function getIdentifierPositions(document: vscode.TextDocument): vscode.Position[] {
  const positions: vscode.Position[] = [];
  const file: string = document.uri.fsPath;
  const program: ts.Program = ts.createProgram([file], { allowJs: true });
  const source: ts.SourceFile = program.getSourceFile(file);

  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) {
      positions.push(document.positionAt(node.end));
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(source, visit);

  return positions;
}

async function getHoverAnnotations(
  document: vscode.TextDocument,
  positions: vscode.Position[]
): Promise<unknown> {
  return Promise.all(
    positions.map((position: vscode.Position) =>
      vscode.commands.executeCommand("vscode.executeHoverProvider", document.uri, position)
    )
  );
}

function containsDeprecatedAnnotation(hovers: vscode.Hover[]): boolean {
  return hovers.some((hover: vscode.Hover) =>
    hover.contents.some((content: vscode.MarkdownString) =>
      content.value.includes(JSDOC_DEPRECATED_ANNOTATION)
    )
  );
}

function getDeprecatedPositions(hovers: vscode.Hover[][]): vscode.Position[] {
  return hovers.reduce((positions: vscode.Position[], hover: vscode.Hover[]) => {
    if (containsDeprecatedAnnotation(hover)) {
      return [...positions, hover[0].range];
    }
    return positions;
  }, []);
}

function paintAnnotations(editor: vscode.TextEditor, positions: vscode.Position[]) {
  editor.setDecorations(DEFAULT_DECORATION_TYPE, positions);
}

async function onDidUpdateTextDocument(document: vscode.TextDocument, editor?: vscode.TextEditor) {
  if (editor) {
    const positions: vscode.Position[] = getIdentifierPositions(document);
    const annotations: vscode.Hover[][] = await getHoverAnnotations(document, positions);
    const deprecated: vscode.Position[] = getDeprecatedPositions(annotations);

    paintAnnotations(editor, deprecated);
  }
}

export function activate() {
  vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
    onDidUpdateTextDocument(document, vscode.window.activeTextEditor);
  });
  vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor) => {
    onDidUpdateTextDocument(editor.document, editor);
  });
}

export function deactivate() {}
