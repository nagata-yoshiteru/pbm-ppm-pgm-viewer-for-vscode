import * as vscode from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "ppm-pgm-viewer-for-vscode" is now active!');

	const openedEvent = vscode.workspace.onDidOpenTextDocument(
        (document: vscode.TextDocument) => {
			if (document.fileName.endsWith(".ppm") || document.fileName.endsWith(".pgm")) {
				console.log(`Opened ${document.fileName}`);
				
				vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
					const spPath = document.uri.path.split("/");
					if (document.uri.fsPath) {
						const byteData = fs.readFileSync(document.uri.fsPath);
		
						let i = 0, j = 0, imgType = "P5", width = 1, height = 1, mc = 1, k = 0;
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
		
						let colorData: { red: number, green: number, blue: number }[] = [];
						switch (imgType) {
							case "P5":
								for (let index = i; index < byteData.byteLength; index++) {
									colorData.push({ red: byteData[index], green: byteData[index], blue: byteData[index] });
								}
								break;
							case "P6":
								for (let index = i; index < byteData.byteLength; index = index + 3) {
									colorData.push({ red: byteData[index], green: byteData[index + 1], blue: byteData[index + 2] });
								}
								break;
						}
		
						const data = { width, height, colorData };

						const panel = vscode.window.createWebviewPanel(
							'.ppm preview',
							spPath[spPath.length - 1],
							vscode.ViewColumn.Active,
							{
								enableScripts: true,
							}
						);
						panel.webview.html = generateHTMLCanvas(JSON.stringify(data));
					}
				});
			}
        });
	
    context.subscriptions.push(openedEvent);
}

/**
 * recursively searches a directory structure for all files.
 * @param dir 
 */
var walk = function (dir: string): string[] {
	var results: string[] = [];
	var list = fs.readdirSync(dir);
	list.forEach(function (file) {
		file = dir + '/' + file;
		var stat = fs.statSync(file);
		if (stat && stat.isDirectory()) {
			/* Recurse into a subdirectory */
			results = results.concat(walk(file));
		} else {
			/* Is a file */
			results.push(file);
		}
	});
	return results;
};

function generateHTMLCanvas(data: string): string {
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
			var width = message.width;
			var height = message.height;
			var colorData = message.colorData;
			canvas.width = width;
			canvas.height = height;
			for (var x = 0; x < width; x++){
				for (var y = 0; y < height; y++){
					//depending on max value
					var color = colorData[(y * width) + x];
					var r = color.red;
					var g = color.green;
					var b = color.blue;
					ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + 1.0 + ")";
					ctx.fillRect(x, y, 1, 1);
				}
			}
		</script>
	</body>
	</html>`;
}

export function deactivate() { }
