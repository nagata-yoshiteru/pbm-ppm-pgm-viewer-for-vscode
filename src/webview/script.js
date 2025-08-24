const vscode = acquireVsCodeApi();

// Get handles to webview elements
const canvas = document.getElementById('canvas-area');
const canvasContext = canvas.getContext('2d');

// State
let state = {
  scale: 1.0,
  width: 1,
  height: 1,
  imageData: null
};

// Render the image data to the canvas
const renderScaledImage = () => {
  if (state.imageData === null) {
    return;
  }

  const canvasImageData = new Uint8ClampedArray(state.width * state.height * 4);
  for (let row = 0; row < state.height; row++) {
    for (let col = 0; col < state.width; col++) {
      const color = state.imageData[row * state.width + col];
      const offset = row * 4 * state.width + col * 4;

      canvasImageData[offset + 0] = color.r;
      canvasImageData[offset + 1] = color.g;
      canvasImageData[offset + 2] = color.b;
      canvasImageData[offset + 3] = 255;
    }
  }

  const canvasImage = new ImageData(canvasImageData, state.width, state.height);
  const newCanvas = document.createElement('canvas');
  newCanvas.width = canvasImage.width;
  newCanvas.height = canvasImage.height;
  newCanvas.getContext('2d').putImageData(canvasImage, 0, 0);

  canvas.width = state.width * state.scale;
  canvas.height = state.height * state.scale;
  canvasContext.scale(state.scale, state.scale);
  canvasContext.imageSmoothingEnabled = false;
  canvasContext.drawImage(newCanvas, 0, 0);
};

// Scale the image
const scaleImage = (factor) => {
  state.scale *= factor;
  if (factor === -1)
  {
    state.scale = 1.0;
  }

  renderScaledImage();
};

// Register the message handler(s)
const registerMessageHandlers = () => {
  window.addEventListener('message', (event) => {
    const message = event.data;

    // Account for requested data, as well as data pushed for webview update
    if (message.type === 'image-push') {
      state.width = message.payload.width;
      state.height = message.payload.height;
      state.imageData = message.payload.colorData;
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