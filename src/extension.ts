import * as ts from "typescript";
import * as vscode from "vscode";

const JSDOC_DEPRECATED_ANNOTATION: string = "*@deprecated*";
const DEFAULT_DECORATION_TYPE: vscode.DecorationRenderOptions = { textDecoration: "line-through" };

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
): Promise<vscode.Hover[][]> {
  return Promise.all(
    positions.map(
      (position: vscode.Position): Thenable<vscode.Hover[]> =>
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

function getDeprecatedRanges(hovers: vscode.Hover[][]): vscode.Range[] {
  return hovers.reduce((ranges: vscode.Range[], hover: vscode.Hover[]) => {
    if (containsDeprecatedAnnotation(hover)) {
      return [...ranges, hover.pop().range as vscode.Range];
    }
    return ranges;
  }, []);
}

function paintAnnotations(
  editor: vscode.TextEditor,
  ranges: vscode.Range[],
  decorationType: vscode.TextEditorDecorationType
) {
  editor.setDecorations(decorationType, []);
  editor.setDecorations(decorationType, ranges);
}

async function onDidUpdateTextDocument(
  document: vscode.TextDocument,
  editor: vscode.TextEditor,
  decorationType: vscode.TextEditorDecorationType
) {
  if (editor) {
    const positions: vscode.Position[] = getIdentifierPositions(document);
    const annotations: vscode.Hover[][] = await getHoverAnnotations(document, positions);
    const deprecated: vscode.Range[] = getDeprecatedRanges(annotations);

    paintAnnotations(editor, deprecated, decorationType);
  }
}

export function activate(): void {
  const decorationType: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType(
    DEFAULT_DECORATION_TYPE
  );

  vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
    onDidUpdateTextDocument(document, vscode.window.activeTextEditor, decorationType);
  });
  vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
    onDidUpdateTextDocument(document, vscode.window.activeTextEditor, decorationType);
  });
  vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor) => {
    onDidUpdateTextDocument(editor.document, editor, decorationType);
  });
}
