import * as vscode from "vscode";
import ImagePreviewProvider  from './preview';

export const activate = (context: vscode.ExtensionContext) => {
	context.subscriptions.push(ImagePreviewProvider.register(context));
};

export const deactivate = () => {};
