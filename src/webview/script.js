const vscode = acquireVsCodeApi();

// Get handles to webview elements
const canvasNode = document.getElementById('canvas-area');
const infoPanelNode = document.getElementById('info-panel');
const typeNode = document.getElementById('type');
const widthNode = document.getElementById('width');
const heightNode = document.getElementById('height');
const scaleNode = document.getElementById('scale');

const sizingButtonNodes = document.querySelectorAll('.sizing-btn');
const wideButtonNodes = document.querySelectorAll('.wide-btn');

// State
let state = {
  scale: 1.0,
  width: 1,
  height: 1,
  imageData: null,
  imageType: '',
  saveFilename: ''
};

let settings = {
  backgroundColor: '#ec5340',
  buttonColor: '#dd4535',
  defaultScale: 1.0,
  autoScalingMode: false, // TODO (nagata-yoshiteru): Can you confirm this is meant to be false by default?
  uiPosition: 'left',
  hideInfoPanel: false
};

// Render the image data to the canvas
const renderScaledImage = (targetCanvas, scale) => {
  if (state.imageData === null) {
    return;
  }

  // Build image data
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

  targetCanvas.width = state.width * scale;
  targetCanvas.height = state.height * scale;

  const targetCanvasContext = targetCanvas.getContext('2d');
  targetCanvasContext.scale(scale, scale);
  targetCanvasContext.imageSmoothingEnabled = false;
  targetCanvasContext.drawImage(newCanvas, 0, 0);
};

// Update UI
const updateUI = () => {
  typeNode.innerHTML = `Type: ${state.imageType}`;
  widthNode.innerHTML = `Width: ${state.width}px`;
  heightNode.innerHTML = `Height: ${state.height}px`;
  scaleNode.innerHTML = `Scale: ${String(state.scale * 100)}%`;

  infoPanelNode.style.backgroundColor = settings.backgroundColor;
  infoPanelNode.style.setProperty(settings.uiPosition, '20px');

  sizingButtonNodes.forEach(node => {
    node.style.backgroundColor = settings.buttonColor;
  });
  wideButtonNodes.forEach(node => {
    node.style.backgroundColor = settings.buttonColor;
  });
};

// Scale the image
const scaleImage = (factor) => {
  state.scale *= factor;
  if (factor === -1)
  {
    state.scale = 1.0;
  }

  renderScaledImage(canvasNode, state.scale);
  updateUI();
};

// Save the image
const savePNGImage = () => {
  const saveLink = document.createElement('a');
  
  const saveCanvas = canvasNode.cloneNode(true);
  renderScaledImage(saveCanvas, 1.0);

  saveLink.href = saveCanvas.toDataUrl();
  saveLink.download = state.saveFilename;
  saveLink.click();
};

// Copy image to clipboard
const copyImage = () => {
  canvasNode.toBlob((blob) => {
    try {
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    } catch (erro) {
      console.error(error);
    }
  });
};

// Register the message handler(s)
const registerMessageHandlers = () => {
  window.addEventListener('message', (event) => {
    const message = event.data;

    // Account for requested data, as well as data pushed for webview update
    switch (message.type) {
      case 'image-push':
        state.width = message.payload.width;
        state.height = message.payload.height;
        state.imageData = message.payload.colorData;
        state.imageType = message.payload.imageType;
        state.saveFilename = message.payload.saveFilename;
        
        renderScaledImage(canvasNode, state.scale);
        updateUI();
        break;
      case 'extension-settings-push':
        settings = message.payload.settings;
        updateUI();
        break;
    }
  });
};

// Load the extension settings
const loadExtensionSettings = async () => {
  await vscode.postMessage({
    type: 'extension-settings-fetch'
  });
};

// Load the image data
const loadImageData = () => {
  vscode.postMessage({
    type: 'image-fetch'
  });
};

// Webview script initializer
const init = async () => {
  registerMessageHandlers();

  await loadExtensionSettings();
  await loadImageData();
};

// Entry point
const main = () => {
  init();
};

main();