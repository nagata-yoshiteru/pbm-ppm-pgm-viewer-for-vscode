import * as vscode from "vscode";
import validateColor from "validate-color";
import { imagePreviewProviderViewType } from "./const";
import * as path from "path";

const generateHTMLCanvas = (
  data: string,
  width: number,
  height: number,
  imgType: string,
  webviewTitle: string
): string => {
  const saveFilename = `${path.basename(webviewTitle, path.extname(webviewTitle))}.png`;
  const bgColor = String(vscode.workspace.getConfiguration(imagePreviewProviderViewType).get('panelBackgroundColor'));
  const btnColor = String(vscode.workspace.getConfiguration(imagePreviewProviderViewType).get('panelButtonColor'));
  const defaultScale = String(vscode.workspace.getConfiguration(imagePreviewProviderViewType).get('defaultPreviewScale'));
  const autoScalingMode = String(vscode.workspace.getConfiguration(imagePreviewProviderViewType).get('autoScalingMode'));
  const uiPosition = String(vscode.workspace.getConfiguration(imagePreviewProviderViewType).get('uiPosition'));
  const hidePanel = Boolean(vscode.workspace.getConfiguration(imagePreviewProviderViewType).get('hidePanel'));
  const styles = {
    canvas: `padding: 0;
            margin: auto;
            display: block;`,
    info: `position: fixed;
          background-color: ${validateColor(bgColor) ? bgColor : "#ec5340"};
          padding: 0px 15px;
          margin: 15px 15px;
          width: 120px;
          ${uiPosition}: 20px;
          ${hidePanel ? "display: none;" : ""}
          -webkit-touch-callout: none;
          -webkit-user-select: none;`,
    sizingButton: `width: 48%;
                  background-color: ${validateColor(btnColor) ? btnColor : "#dd4535"};
                  display: inline-block;
                  text-align: center;
                  cursor: pointer;
                  user-select: none;`,
    wideButton: `background-color: ${validateColor(btnColor) ? btnColor : "#dd4535"};
                  text-align: center;
                  margin-bottom: 15px;
                  cursor: pointer;
                  user-select: none;`,
    separator: `border: 0;
                height: 1px;
                background-color: white;
                margin: 0.5rem 0;`
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <div style="${styles.info}">
          <p id="type-display">Type: ${imgType}</p>
          <p id="width-display">Width: ${width}px</p>
          <p id="height-display">Height: ${height}px</p>
          <p id="scale-display">Zoom: 100%</p>
          <div style="margin-bottom: 15px">
            <p style="margin: 0; padding: 0">Mouse Pixel:</p>
            <p style="margin: 0; padding: 0" id="pixel-loc-x">X: 0</p>
            <p style="margin: 0; padding: 0" id="pixel-loc-y">Y: 0</p>
            <hr style="${styles.separator}">
            <p style="margin: 0; padding: 0" id="pixel-color-r">R: 0 (0.0)</p>
            <p style="margin: 0; padding: 0" id="pixel-color-g">G: 0 (0.0)</p>
            <p style="margin: 0; padding: 0" id="pixel-color-b">B: 0 (0.0)</p>
          </div>
          <div style="margin-bottom: 5px">
            <div onclick="scale = scale * 2; showImg(scale);" style="${styles.sizingButton}">+</div>
            <div onclick="scale = scale / 2; showImg(scale);" style="${styles.sizingButton}">-</div>
          </div>
          <div onclick="scale = 1; showImg(scale);" style="${styles.wideButton}">Reset</div>
          <div onclick="copyImg();" style="${styles.wideButton}">Copy to Clipboard</div>
          <div onclick="saveImg();" style="${styles.wideButton}">Save as PNG</div>
        </div>
        <div id="canvas-container" style="overflow: auto">
          <canvas width="${width}" height="${height}" id="canvas-area" style="${styles.canvas}"></canvas>
        </div>
        <script>
          let scale = ${defaultScale};
          const jsonStr = '${data}';
          let message = JSON.parse(jsonStr);
          const canvas = document.getElementById('canvas-area');
          const typeDisplay = document.getElementById('type-display');
          const widthDisplay = document.getElementById('width-display');
          const heightDisplay = document.getElementById('height-display');
          const scaleDisplay = document.getElementById('scale-display');

          const pixelLocXDisplay = document.getElementById('pixel-loc-x');
          const pixelLocYDisplay = document.getElementById('pixel-loc-y');
          const pixelColorRDisplay = document.getElementById('pixel-color-r');
          const pixelColorGDisplay = document.getElementById('pixel-color-g');
          const pixelColorBDisplay = document.getElementById('pixel-color-b');

          if(${autoScalingMode}){
            const html = document.getElementsByTagName("html")[0];
            const alpha = 0.05;
            const scaleAuto = Math.min(html.clientWidth/${width}, html.clientHeight/${height}) * (1 - alpha);
            scale = 2 ** Math.floor(Math.log2(scaleAuto));
          }

          function scaleCanvas(targetCanvas, scale) {
            const { colorData, width, height } = message;

            // Write the colorData to an ImageData object
            const data = new Uint8ClampedArray(width * height * 4);
            for (let row = 0; row < height; row++) {
              for (let col = 0; col < width; col++) {
                let color = colorData[row * width + col];
                let i = row * 4 * width + col * 4;
                data[i + 0] = color.r;
                data[i + 1] = color.g;
                data[i + 2] = color.b;
                data[i + 3] = 255;
              }
            }
            const id = new ImageData(data, width, height);

            // Write the ImageData to a background canvas
            const backCanvas = document.createElement('canvas');
            backCanvas.width = id.width;
            backCanvas.height = id.height;
            backCanvas.getContext('2d').putImageData(id, 0, 0);

            // Scale the target canvas and write the background canvas to it
            const ctx = targetCanvas.getContext('2d');
            targetCanvas.width = width * scale;
            targetCanvas.height = height * scale;
            ctx.scale(scale, scale);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(backCanvas, 0, 0);
          }

          function showImg(scale) {
            const { width, height, imgType } = message;
            scaleCanvas(canvas, scale);
            typeDisplay.innerHTML = "Type: " + imgType;
            widthDisplay.innerHTML = "Width: " + String(width) + "px";
            heightDisplay.innerHTML = "Height: " + String(height) + "px";
            scaleDisplay.innerHTML = "Zoom: " + String(scale * 100) + "%";
          }
          showImg(scale);

          function zoom(e) {
            e.preventDefault();
            if(!e.ctrlKey) return;
            if(${hidePanel}) return;
            if(e.deltaY < 0) {
              scale = scale * 2;
            } else {
              scale = scale / 2;
            }
            showImg(scale);
          }

          window.addEventListener('wheel', zoom);

          function saveImg() {
            const saveLink = document.createElement("a");
            const saveCanvas = canvas.cloneNode(true);
            scaleCanvas(saveCanvas, 1);
            saveLink.href = saveCanvas.toDataURL();
            saveLink.download = '${saveFilename}';
            saveLink.click();
          }

          function copyImg() {
            canvas.toBlob((blob) => {
              try {
                navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                  ]);
              } catch (error) {
                console.error(error);
              }
            });
          }

          function clamp(val, min, max)
          {
            return Math.min(Math.max(val, min), max);
          }

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

            const boundingRect = canvas.getBoundingClientRect();
            const canvasSpaceX = clamp(e.clientX - boundingRect.left, 0, boundingRect.width - 1);
            const canvasSpaceY = clamp(e.clientY - boundingRect.top, 0, boundingRect.height - 1);

            const imageSpaceX = Math.floor(canvasSpaceX / scale);
            const imageSpaceY = Math.floor(canvasSpaceY / scale);
            pixelLocXDisplay.innerHTML = "X: " + String(imageSpaceX);
            pixelLocYDisplay.innerHTML = "Y: " + String(imageSpaceY);

            const ctx = canvas.getContext('2d');
            const col = ctx.getImageData(canvasSpaceX, canvasSpaceY, boundingRect.width, boundingRect.height);

            const colRF32 = (col.data[0] / 255.0).toFixed(4);
            pixelColorRDisplay.innerHTML = "R: " + String(colRF32) + " (" + String(col.data[0]) + ")";

            const colGF32 = (col.data[1] / 255.0).toFixed(4);
            pixelColorGDisplay.innerHTML = "G: " + String(colGF32) + " (" + String(col.data[1]) + ")";

            const colBF32 = (col.data[2] / 255.0).toFixed(4);
            pixelColorBDisplay.innerHTML = "B: " + String(colBF32) + " (" + String(col.data[2]) + ")";
          };

          function onMouseUp(e) {
            canvasContainer.style.cursor = 'grab';
            isDragging = false;
          };

          canvasContainer.onmousedown = onMouseDown;
          canvasContainer.onmousemove = onMouseMove;
          canvasContainer.onmouseup = onMouseUp;

          window.addEventListener('message', event => {
            message = event.data;
            showImg(scale);
          });
        </script>
      </body>
    </html>`;
};

export default generateHTMLCanvas;
