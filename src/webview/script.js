const vscode = acquireVsCodeApi();

// Get handles to webview elements
const rootNode = document.documentElement;

const canvasNode = document.getElementById('canvas-area');
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
  autoScalingMode: false,
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

// Precompute sRGB-to-linear lookup table
const srgbToLinear = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const v = i / 255;
  srgbToLinear[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

const linearToSrgb = (linear) => {
  const s = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1.0 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(s * 255)));
};

// Cached source canvas, rebuilt when image data changes
let sourceCanvas = null;

const updateSourceCanvas = () => {
  sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = state.width;
  sourceCanvas.height = state.height;
  const srcData = new Uint8ClampedArray(state.width * state.height * 4);
  for (let i = 0; i < state.imageData.length; i++) {
    const c = state.imageData[i];
    const offset = i * 4;
    srcData[offset] = c.r;
    srcData[offset + 1] = c.g;
    srcData[offset + 2] = c.b;
    srcData[offset + 3] = 255;
  }
  sourceCanvas.getContext('2d').putImageData(
    new ImageData(srcData, state.width, state.height), 0, 0
  );
};

// Render the image data to the canvas
const renderScaledImage = (targetCanvas, scale) => {
  if (!sourceCanvas) return;

  const dpr = window.devicePixelRatio || 1;
  const effectiveScale = scale * dpr;
  const targetW = Math.round(state.width * scale * dpr);
  const targetH = Math.round(state.height * scale * dpr);

  targetCanvas.width = targetW;
  targetCanvas.height = targetH;
  targetCanvas.style.width = (state.width * scale) + 'px';
  targetCanvas.style.height = (state.height * scale) + 'px';

  if (effectiveScale >= 1) {
    const ctx = targetCanvas.getContext('2d');
    ctx.scale(effectiveScale, effectiveScale);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceCanvas, 0, 0);
  } else {
    // Downscaling: gamma-correct box filter in linear light
    const outData = new Uint8ClampedArray(targetW * targetH * 4);
    const invScale = 1.0 / effectiveScale;

    for (let y = 0; y < targetH; y++) {
      const srcY0 = Math.floor(y * invScale);
      const srcY1 = Math.min(Math.ceil((y + 1) * invScale), state.height);
      for (let x = 0; x < targetW; x++) {
        const srcX0 = Math.floor(x * invScale);
        const srcX1 = Math.min(Math.ceil((x + 1) * invScale), state.width);

        let rLin = 0, gLin = 0, bLin = 0, count = 0;
        for (let sy = srcY0; sy < srcY1; sy++) {
          for (let sx = srcX0; sx < srcX1; sx++) {
            const c = state.imageData[sy * state.width + sx];
            rLin += srgbToLinear[c.r];
            gLin += srgbToLinear[c.g];
            bLin += srgbToLinear[c.b];
            count++;
          }
        }

        const offset = (y * targetW + x) * 4;
        outData[offset] = linearToSrgb(rLin / count);
        outData[offset + 1] = linearToSrgb(gLin / count);
        outData[offset + 2] = linearToSrgb(bLin / count);
        outData[offset + 3] = 255;
      }
    }

    targetCanvas.getContext('2d').putImageData(
      new ImageData(outData, targetW, targetH), 0, 0
    );
  }
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

  saveLink.href = saveCanvas.toDataURL();
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

  const dpr = window.devicePixelRatio || 1;
  const canvasNodeContext = canvasNode.getContext('2d');
  const color = canvasNodeContext.getImageData(canvasSpaceX * dpr, canvasSpaceY * dpr, 1, 1);

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

        updateSourceCanvas();
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
  }, 20));

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