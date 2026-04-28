// Mock VS Code API for testing
const vscode = {
    window: {
        showErrorMessage: () => { },
        showInformationMessage: () => { }
    },
    workspace: {
        onDidChangeTextDocument: () => ({ dispose: () => { } }),
        onDidSaveTextDocument: () => ({ dispose: () => { } })
    },
    uri: {
        file: (path: string) => ({ fsPath: path, scheme: 'file' })
    },
    webviewPanel: {},
    viewColumn: { one: 1 },
    commands: {
        registerCommand: () => ({ dispose: () => { } })
    },
    languages: {
        registerDocumentFormattingEditProvider: () => ({ dispose: () => { } })
    }
};

export default vscode;
