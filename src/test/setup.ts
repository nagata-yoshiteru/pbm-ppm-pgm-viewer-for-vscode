// Test setup file to mock VS Code globally
import * as sinon from 'sinon';

// Mock VS Code API
const mockVscode = {
    window: {
        showErrorMessage: sinon.stub(),
        showInformationMessage: sinon.stub()
    },
    workspace: {
        onDidChangeTextDocument: sinon.stub().returns({ dispose: sinon.stub() }),
        onDidSaveTextDocument: sinon.stub().returns({ dispose: sinon.stub() })
    },
    uri: {
        file: (path: string) => ({ fsPath: path, scheme: 'file' })
    },
    webviewPanel: {},
    viewColumn: { one: 1 },
    commands: {
        registerCommand: sinon.stub().returns({ dispose: sinon.stub() })
    },
    languages: {
        registerDocumentFormattingEditProvider: sinon.stub().returns({ dispose: sinon.stub() })
    }
};

// Global mock for vscode module
(global as any).vscode = mockVscode;
