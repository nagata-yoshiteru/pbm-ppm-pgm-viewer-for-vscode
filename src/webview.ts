const styles = {
  canvas: `padding: 0;
           margin: auto;
           display: block;`,
  info: `position: fixed;
         background-color: #ec5340;
         padding: 0px 15px;
         margin: 15px 15px;
         width: 100px;`,
  sizingButton: `width: 48%;
                 background-color: #dd4535;
                 display: inline-block;
                 text-align: center;`,
  resetButton: `background-color: #dd4535;
                text-align: center;
                margin-bottom: 15px`,
};

const generateHTMLCanvas = (
  data: string,
  width: number,
  height: number,
  imgType: string
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <div style="${styles.info}">
          <p>Type: ${imgType}</p>
          <p>Width: ${width}px</p>
          <p>Height: ${height}px</p>
          <div style="margin-bottom: 5px">
            <div onclick="scale = scale * 2; showImg(scale);" style="${styles.sizingButton}">+</div>
            <div onclick="scale = scale / 2; showImg(scale);" style="${styles.sizingButton}">-</div>
          </div>
          <div onclick="scale = 1; showImg(scale);" style="${styles.resetButton}">Reset</div>
        </div>
        <div id="canvas-container" style="overflow: auto">
          <canvas width="${width}" height="${height}" id="canvas-area" style="${styles.canvas}"></canvas>
        </div>
        <script>
          let scale = 1;
          let jsonStr = '${data}';
          const message = JSON.parse(jsonStr);
          let colorData = message.colorData;
          let canvas = document.getElementById('canvas-area');
          function showImg(scale) {
            let ctx = canvas.getContext('2d');
            canvas.width = ${width} * scale;
            canvas.height = ${height} * scale;
            for (let x = 0; x < ${width}; x++){
              for (let y = 0; y < ${height}; y++){
                let color = colorData[(y * ${width}) + x];
                ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + "," + 1.0 + ")";
                ctx.fillRect(x * scale, y * scale, scale, scale);
              }
            }
          }
          showImg(scale);

          const lastPos = { x: 0, y: 0 };
          let isDragging = false;
          const canvasContainer = document.getElementById('canvas-container');
          const root = document.documentElement;

          function onMouseDown(e) {
            lastPos.x = e.clientX;
            lastPos.y = e.clientY;
            canvasContainer.style.cursor = 'grabbing';
            isDragging = true;
          };

          function onMouseMove(e) {
            if (isDragging) {
              canvasContainer.style.cursor = 'grabbing';

              const dx = lastPos.x - e.clientX;
              const dy = lastPos.y - e.clientY;

              canvasContainer.scrollLeft += dx;
              root.scrollTop += dy;

              lastPos.x = e.clientX;
              lastPos.y = e.clientY;
            }
          };

          function onMouseUp(e) {
            canvasContainer.style.cursor = 'grab';
            isDragging = false;
          };

          canvasContainer.onmousedown = onMouseDown;
          canvasContainer.onmousemove = onMouseMove;
          canvasContainer.onmouseup = onMouseUp;
        </script>
      </body>
    </html>`;
};

export default generateHTMLCanvas;
