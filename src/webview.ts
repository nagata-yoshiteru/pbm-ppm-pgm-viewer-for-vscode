const generateHTMLCanvas = (
  data: string,
  width: number,
  height: number,
  imgType: string
): string => {
  return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
	</head>
	<body>
		<canvas width="${width}" height="${height}" id="canvas-area"></canvas>
		<p>Width: ${width}px, Height: ${height}px, Type: ${imgType}</p>
		<script>
			var scale = 1;
			var jsonStr = '${data}';
			const message = JSON.parse(jsonStr);
			var colorData = message.colorData;
			function showImg(scale) {
				var canvas = document.getElementById('canvas-area');
				var ctx = canvas.getContext('2d');
				canvas.width = ${width} * scale;
				canvas.height = ${height} * scale;
				for (var x = 0; x < ${width}; x++){
					for (var y = 0; y < ${height}; y++){
						var color = colorData[(y * ${width}) + x];
						ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + "," + 1.0 + ")";
						ctx.fillRect(x * scale, y * scale, scale, scale);
					}
				}				
			}
			showImg(scale);
		</script>
		<p>
			Zoom:
			<button onclick="scale = scale * 2; showImg(scale);">+</button>
			<button onclick="scale = scale / 2; showImg(scale);">-</button>
			<button onclick="scale = 1; showImg(scale);">x1</button>
		</p>
	</body>
	</html>`;
};

export default generateHTMLCanvas;
