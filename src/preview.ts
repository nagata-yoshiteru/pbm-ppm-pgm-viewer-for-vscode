import * as vscode from "vscode";
import * as path from "path";
import * as fs from 'fs';

import generateHTMLCanvas from "./webview";
import parse from "./parsing";
import { imagePreviewProviderViewType } from "./const";

class ImagePreviewDocument
  extends vscode.Disposable
  implements vscode.CustomDocument {
  readonly uri: vscode.Uri;
  private documentData: Uint8Array;

  private static async readFile(uri: vscode.Uri) {
    return vscode.workspace.fs.readFile(uri);
  }

  static async create(uri: vscode.Uri) {
    const fileData = await ImagePreviewDocument.readFile(uri);
    return new ImagePreviewDocument(uri, fileData);
  }

  private constructor(uri: vscode.Uri, initialData: Uint8Array) {
    super(() => { });
    this.uri = uri;
    this.documentData = initialData;
  }

  public get getDocumentData() {
    return this.documentData;
  }

  public get imageData() {
    return parse.parseByteFormat(this.getDocumentData);
  }

  dispose() {
    super.dispose();
  }
}

export default class ImagePreviewProvider
  implements vscode.CustomReadonlyEditorProvider<ImagePreviewDocument> {
  private static viewType = imagePreviewProviderViewType;

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      ImagePreviewProvider.viewType,
      new ImagePreviewProvider(context),
      {
        supportsMultipleEditorsPerDocument: false,
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    );
  }

  constructor(private readonly context: vscode.ExtensionContext) { }

  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: {},
    _token: vscode.CancellationToken
  ): Promise<ImagePreviewDocument> {
    const document = await ImagePreviewDocument.create(uri);
    return document;
  }

  private createWebview(
    imagePreviewDocument: ImagePreviewDocument,
    webviewPanel: vscode.WebviewPanel
  ) {
      // Load the webview html	
      const webviewHtmlPath = path.join(this.context.extensionPath, 'src', 'webview', 'webview.html');
      let webviewHtmlData = fs.readFileSync(webviewHtmlPath, 'utf8');

      // Link the stylesheet and script paths
      const webviewMediaPath = vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'webview'));
      const webviewMediaUri = webviewPanel.webview.asWebviewUri(webviewMediaPath);
      webviewHtmlData = webviewHtmlData.replace(/{{webview}}/g, webviewMediaUri.toString());

      // Set the webiew html
      webviewPanel.webview.html = webviewHtmlData;

      // Register webview request handler
      webviewPanel.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case 'image-fetch':
            this.updateWebview(imagePreviewDocument, webviewPanel);
            break;
        }
      });


    // const data = imagePreviewDocument.imageData;
    // const { status, width, height, imgType } = data;
    // if (status === parse.PARSE_STATUS.SUCCESS) {
      // webviewPanel.webview.html = generateHTMLCanvas(
      //   JSON.stringify(data),
      //   width || 0,
      //   height || 0,
      //   imgType || "",
      //   webviewPanel.title
      // );
    // }
  }

  private updateWebview(
    imagePreviewDocument: ImagePreviewDocument,
    webviewPanel: vscode.WebviewPanel
  ) {
    const imageData = imagePreviewDocument.imageData;

    if (imageData.status === parse.PARSE_STATUS.SUCCESS) {
      webviewPanel.webview.postMessage({
        type: 'image-push',
        payload: imageData
      });
    }
    else {
      console.warn("Failed to parse image data!");
    }
  }

  async resolveCustomEditor(
    document: ImagePreviewDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    this.createWebview(document, webviewPanel);

    const watcherAction = async (e: vscode.Uri) => {
      const docUriPath = document.uri.path.replace(/(\/[A-Z]:\/)/, (match) => match.toLowerCase());
      if (docUriPath === e.path) {
        // filter an event
        const newDocument = await ImagePreviewDocument.create(
          vscode.Uri.parse(e.path)
        );
        this.updateWebview(newDocument, webviewPanel);
      }
    };

    const absolutePath = document.uri.path;
    const fileName = path.parse(absolutePath).base;
    const dirName = path.parse(absolutePath).dir;
    const fileUri = vscode.Uri.file(dirName);

    // This watcher is for files both inside and outside the workspace
    const globalWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(fileUri, fileName)
    ); // possible to match another image
    const globalChangeFileSubscription =
      globalWatcher.onDidChange(watcherAction);

    webviewPanel.onDidDispose(() => {
      globalChangeFileSubscription.dispose();
    });
  }
}
