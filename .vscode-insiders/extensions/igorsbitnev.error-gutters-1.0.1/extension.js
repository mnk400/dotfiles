const vscode = require('vscode');

const BASE_PATH = `${vscode.extensions.getExtension('IgorSbitnev.error-gutters').extensionPath}/img/`;
const MIN_SEVERITY = 3;
const ICON_SIZE = '80%';
const ICON_PATHS = [
  'error-inverse.svg',
  'warning-inverse.svg',
  'info-inverse.svg',
  'info-inverse.svg',
];

const createIcon = iconPath => vscode
  .window
  .createTextEditorDecorationType({
    gutterIconPath: `${BASE_PATH}${iconPath}`,
    gutterIconSize: ICON_SIZE,
  });

const icons = ICON_PATHS.map(createIcon);

const withDefault = (fallback, value = fallback) => value;
const withPath = path => ([file]) => file.path === path;
const withSeverity = severity => ([, target]) => target === severity;
const toRange = ([line]) => ({ range: new vscode.Range(line, 0, line, 0) });

const getIssues = diagnostics => diagnostics
  .reduce((map, { severity, range: { start: { line } } }) => map
    .set(
      line, Math.min(severity, withDefault(MIN_SEVERITY, map.get(line))),
    ), new Map());

const checkFile = () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const [, diagnostics] = vscode
    .languages
    .getDiagnostics()
    .find(withPath(editor.document.uri.path)) || [];
  if (!diagnostics) return;
  const issues = [...getIssues(diagnostics)];
  icons.map((icon, iconSeverity) => editor
    .setDecorations(icon, issues
      .filter(withSeverity(iconSeverity))
      .map(toRange)));
};

const activate = context => context
  .subscriptions
  .push(vscode
    .languages
    .onDidChangeDiagnostics(checkFile));

const deactivate = () => {};

exports.activate = activate;
exports.deactivate = deactivate;
