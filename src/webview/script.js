const vscode = acquireVsCodeApi();

// Get handles to webview elements
const rootNode = document.documentElement;

const canvasNode = document.getElementById('canvas-area');
let canvasNodeContext = canvasNode.getContext('2d', { willReadFrequently: true });
const canvasContainerNode = canvasNode.parentElement;

const infoPanelNode = document.getElementById('info-panel');
const typeNode = document.getElementById('type');
const widthNode = document.getElementById('width');
const heightNode = document.getElementById('height');
const scaleNode = document.getElementById('scale');

const colorXNode = document.getElementById('color-x');
const colorYNode = document.getElementById('color-y');
const colorRNode = document.getElementById('color-r');
const colorGNode = document.getElementById('color-g');
const colorBNode = document.getElementById('color-b');
const colorBoxNode = document.getElementById('color-box');

const sizingButtonNodes = document.querySelectorAll('.sizing-btn');
const wideButtonNodes = document.querySelectorAll('.wide-btn');

// State
let state = {
  scale: 1.0,
  width: 1,
  height: 1,
  imageData: null,
  imageType: '',
  saveFilename: '',
  isDraggingMouse: false,
  lastMousePos: {
    x: 0,
    y: 0
  }
};

let settings = {
  backgroundColor: '#ec5340',
  buttonColor: '#dd4535',
  defaultScale: 1.0,
  autoScalingMode: false, // TODO (nagata-yoshiteru): Can you confirm this is meant to be false by default?
  uiPosition: 'left',
  hideInfoPanel: false
};

// Utility functions
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const clamp = (v, min, max) => {
  return Math.min(Math.max(v, min), max);
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

// Apply extension settings
const applyExtensionSettings = () => {
  infoPanelNode.style.backgroundColor = settings.backgroundColor;
  infoPanelNode.style.setProperty(settings.uiPosition, '20px');

  state.scale = settings.defaultScale;
  if (settings.autoScalingMode) {
    const html = document.getElementsByTagName('html')[0];
    const alpha = 0.05;
    const autoScale = Math.min(html.clientWidth / state.width, html.clientHeight / state.height) * (1 - alpha);
    state.scale = 2 ** Math.floor(Math.log2(autoScale));
  }

  sizingButtonNodes.forEach(node => {
    node.style.backgroundColor = settings.buttonColor;
  });
  wideButtonNodes.forEach(node => {
    node.style.backgroundColor = settings.buttonColor;
  });

  if (settings.hideInfoPanel) {
    infoPanelNode.style.setProperty('display', 'none');
  }
  else {
    infoPanelNode.style.removeProperty('display');
  }
};

// Update UI
const updateUI = () => {
  typeNode.innerHTML = `Type: ${state.imageType}`;
  widthNode.innerHTML = `Width: ${state.width}px`;
  heightNode.innerHTML = `Height: ${state.height}px`;
  scaleNode.innerHTML = `Scale: ${String(state.scale * 100)}%`;
};

// Scale the image
const scaleImage = (factor) => {
  state.scale *= factor;
  if (factor === -1) {
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
// TODO (nagata-yoshiteru): Please test in release build as I'm having trouble getting this functionality to work.

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

// Mouse event handlers
const onMouseDown = (e) => {
  state.lastMousePos.x = e.clientX;
  state.lastMousePos.y = e.clientY;
  state.isDraggingMouse = true;
  canvasContainerNode.style.cursor = 'grabbing';
};

const onMouseMove = (e) => {
  if (state.isDraggingMouse) {
    canvasContainerNode.style.cursor = 'grabbing';

    const dx = state.lastMousePos.x - e.clientX;
    const dy = state.lastMousePos.y - e.clientY;

    canvasContainerNode.scrollLeft += dx;
    rootNode.scrollTop += dy;

    state.lastMousePos.x = e.clientX;
    state.lastMousePos.y = e.clientY;
  }

  // Update hover pixel data
  const boundingRect = canvasNode.getBoundingClientRect();
  
  const canvasSpaceX = clamp(e.clientX - boundingRect.left, 0, boundingRect.width);
  const canvasSpaceY = clamp(e.clientY - boundingRect.top, 0, boundingRect.height);
  
  const imageSpaceX = Math.floor(canvasSpaceX / state.scale);
  const imageSpaceY = Math.floor(canvasSpaceY / state.scale);
  colorXNode.innerHTML = `X: ${imageSpaceX}`;
  colorYNode.innerHTML = `Y: ${imageSpaceY}`;

  const color = canvasNodeContext.getImageData(canvasSpaceX, canvasSpaceY, boundingRect.width, boundingRect.height);

  // TODO (nagata-yoshiteru): Please compile the extension, open boy.ppm, zoom in as far as you can, try moving your mouse over the pixels.
  // The pixel data in the info panel seems to update much slower than in the released version of the extension, so I want to confirm that this
  // is slow because I'm testing in debug mode. Thank you!
  colorRNode.innerHTML = `R: ${(color.data[0] / 255.0).toFixed(4)} (${color.data[0]})`;
  colorGNode.innerHTML = `G: ${(color.data[1] / 255.0).toFixed(4)} (${color.data[1]})`;
  colorBNode.innerHTML = `B: ${(color.data[2] / 255.0).toFixed(4)} (${color.data[2]})`;
  colorBoxNode.style.backgroundColor = `rgb(${color.data[0]}, ${color.data[1]}, ${color.data[2]})`;
};

const onMouseUp = (e) => {
  canvasContainerNode.style.cursor = 'grab';
  state.isDraggingMouse = false;
};

// Register the message handler(s)
const registerMessageHandlers = () => {
  // Extension communication
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

        // Apply before updating UI because we change the scale here
        applyExtensionSettings();
        renderScaledImage(canvasNode, state.scale);

        updateUI();
        break;
    }
  });

  // Scroll wheel event
  window.addEventListener('wheel', debounce((e) => {
    e.preventDefault();
    if (!e.ctrlKey) {
      return;
    }
    else if (settings.hideInfoPanel) {
      return;
    }

    if (e.deltaY < 0) {
      scaleImage(2.0);
    }
    else {
      scaleImage(0.5);
    }
  }, 20)); // TODO (nagata-yoshiteru): How does this debounce feel to you in the UI? Does it feel unnatural?
           //                          I added this because on macos it was scrolling really fast.

  // Register mouse handlers
  canvasContainerNode.onmousedown = onMouseDown;
  canvasContainerNode.onmousemove = onMouseMove;
  canvasContainerNode.onmouseup = onMouseUp;
  canvasContainerNode.onmouseout = onMouseUp;
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

  await loadImageData();
  await loadExtensionSettings();
};

// Entry point
const main = () => {
  init();
};

main();