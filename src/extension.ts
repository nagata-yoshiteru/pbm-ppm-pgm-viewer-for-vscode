import * as vscode from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "ppm-pgm-viewer-for-vscode" is now active!');

	const openedEvent = vscode.workspace.onDidOpenTextDocument(
        (document: vscode.TextDocument) => {
			if (document.fileName.endsWith(".ppm") || document.fileName.endsWith(".pgm")) {
				console.log(`Opened ${document.fileName}`);
				const spPath = document.uri.path.split("/");

				if (document.uri.fsPath) {
					const byteData = fs.readFileSync(document.uri.fsPath);
	
					let i = 0, j = 0, imgType = "P0", width = 1, height = 1, mc = 1, k = 0;
					while (i < byteData.byteLength && k < 3) {
						while (i < byteData.byteLength && byteData[i++] !== 10);
						if (i - 1 - j === 2) {
							imgType = byteData.toString('utf-8', j, i - 1);
							console.log(`Type: ${imgType}`);
							k++;
						} else {
							const texts = byteData.toString('utf-8', j, i - 1).split(" ");
							if (texts.length === 1) {
								mc = Number(texts[0]);
								console.log(`Color: ${mc}`);
								k++;
							} else if (texts.length === 2) {
								width = Number(texts[0]);
								height = Number(texts[1]);
								console.log(`Size: ${width}x${height}`);
								k++;
							}
						}
						j = i;
					}
	
					let colorData: { r: number, g: number, b: number }[] = [];
					switch (imgType) {
						case "P5":
							for (let index = i; index < byteData.byteLength; index++) {
								colorData.push({ r: byteData[index], g: byteData[index], b: byteData[index] });
							}
							break;
						case "P6":
							for (let index = i; index < byteData.byteLength; index = index + 3) {
								colorData.push({ r: byteData[index], g: byteData[index + 1], b: byteData[index + 2] });
							}
							break;
						default:
							return;
					}

					vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
						const data = { width, height, colorData, imgType };
						const panel = vscode.window.createWebviewPanel(
							'.ppm preview',
							spPath[spPath.length - 1],
							vscode.ViewColumn.Active,
							{
								enableScripts: true,
							}
						);
						panel.webview.html = generateHTMLCanvas(JSON.stringify(data), width, height, imgType);
					});
				}
			}
        });
	
    context.subscriptions.push(openedEvent);
}

function generateHTMLCanvas(data: string, width: number, height: number, imgType: string): string {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
	</head>
	<body>
		<script>
			var jsonStr = '${data}';
			var canvas = document.createElement('canvas');
			document.body.appendChild(canvas);
			var ctx = canvas.getContext('2d');
			const message = JSON.parse(jsonStr);
			var colorData = message.colorData;
			canvas.width = ${width};
			canvas.height = ${height};
			for (var x = 0; x < ${width}; x++){
				for (var y = 0; y < ${height}; y++){
					var color = colorData[(y * ${width}) + x];
					ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + "," + 1.0 + ")";
					ctx.fillRect(x, y, 1, 1);
				}
			}
		</script>
		<p>Width: ${width}px, Height: ${height}px, Type: ${imgType}</p>
	</body>
	</html>`;
}

export function deactivate() { }
