const vscode = acquireVsCodeApi();

// Get handles to webview elements
const canvas = document.getElementById('canvas-area');
const canvasContext = canvas.getContext('2d');

// State
let scale = 1.0;
let width = 1;
let height = 1;
let imageData = null;

// Render the image data to the canvas
const renderScaledImage = () => {
  if (imageData === null) {
    return;
  }

  const canvasImageData = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const color = imageData[row * width + col];
      const offset = row * 4 * width + col * 4;

      canvasImageData[offset + 0] = color.r;
      canvasImageData[offset + 1] = color.g;
      canvasImageData[offset + 2] = color.b;
      canvasImageData[offset + 3] = 255;
    }
  }

  const canvasImage = new ImageData(canvasImageData, width, height);
  const newCanvas = document.createElement('canvas');
  newCanvas.width = canvasImage.width;
  newCanvas.height = canvasImage.height;
  newCanvas.getContext('2d').putImageData(canvasImage, 0, 0);

  canvas.width = width * scale;
  canvas.height = height * scale;
  canvasContext.scale(scale, scale);
  canvasContext.imageSmoothingEnabled = false;
  canvasContext.drawImage(newCanvas, 0, 0);
};

// Scale the image
const scaleImage = (factor) => {
  scale *= factor;
  if (factor === -1)
  {
    scale = 1.0;
  }

  renderScaledImage();
};

// Register the message handler(s)
const registerMessageHandlers = () => {
  window.addEventListener('message', (event) => {
    const message = event.data;

    // Account for requested data, as well as data pushed for webview update
    if (message.type === 'image-push') {
      width = message.payload.width;
      height = message.payload.height;
      imageData = message.payload.colorData;
      renderScaledImage();
    }
  });
};

// Load the image data
const loadData = () => {
  vscode.postMessage({
    type: 'image-fetch'
  });
};

// Webview script initializer
const init = () => {
  registerMessageHandlers();
  loadData();
};

// Entry point
const main = () => {
  init();
};

main();