const PARSE_STATUS = {
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
};

const SPACE = " ".charCodeAt(0);
const CR = 0x0d;
const LF = 0x0a;
const HASH = "#".charCodeAt(0);
const TAB = "\t".charCodeAt(0);

const isWhiteSpace = (byteData: Uint8Array, i: number): boolean => {
  const byte = byteData[i];
  return (
    byte === SPACE ||
    byte === CR ||
    byte === LF ||
    byte === TAB
  );
};

const getNextByte = (data: Uint8Array, index: number, isSingleBit: boolean) => {
  // Once this function returns, its should return:
  // 1) The next interpreted and casted byte
  // 2) The index of the byte immediately following the
  //    parsed byte
  let byteStr = "";

  let i = index;
  while (i < data.length) {
    if (data[i] === SPACE) {
      while (data[i] === SPACE && i < data.length) {
        i++;
      }
    } else if (data[i] === HASH && i < data.length) {
      while ((data[i] !== CR || data[i] !== LF) && i < data.length) {
        i++;
      }
      if (data[i] === LF) {
        i++;
      }
    } else if (data[i] === CR || data[i] === LF) {
      i++;
    } else {
      while (
        !isWhiteSpace(data, i) &&
        data[i] !== HASH &&
        i < data.length
      ) {
        byteStr += String.fromCharCode(data[i]);
        i++;
        
        if (isSingleBit) {
          break;
        }
      }
      break;
    }
  }

  return [parseInt(byteStr, 10), i];
};

const parseByteFormat = (byteData: Uint8Array) => {
  let i = 0,
    j = 0,
    imgType = "P0",
    width = 1,
    height = 1,
    mc = 1,
    k = 0,
    kl = 3;
  while (k < kl) {
    while (
      i < byteData.byteLength &&
      !isWhiteSpace(byteData, i)
    ) {
      i++;
    }
    if (byteData[j] === 35) { // Comment Line
      while (i < byteData.byteLength && byteData[i] !== 10) { // LF
        i++;
      }
    } else {
      switch (k) {
        case 0:
          imgType = byteData.subarray(j, i).toString();
          console.log(`Type: ${imgType}`);
          if (
            imgType === "P2" ||
            imgType === "P3" ||
            imgType === "P5" ||
            imgType === "P6"
          )
            kl++;
          break;
        case 1:
          width = Number(byteData.subarray(j, i).toString());
          break;
        case 2:
          height = Number(byteData.subarray(j, i).toString());
          console.log(`Size: ${width}x${height}`);
          break;
        case 3:
          mc = Number(byteData.subarray(j, i).toString());
          console.log(`Color: ${mc}`);
          break;
      }
      k++;
    }
    i++;
    while (
      i < byteData.byteLength &&
      isWhiteSpace(byteData, i)
    ) {
      i++;
    }
    j = i;
  }

  let pixelIndex = 0;
  const totalPixels = width * height;
  let colorData: { r: number; g: number; b: number }[] = [];
  let index = i;
  switch (imgType) {
    case "P1": {
      while (pixelIndex < totalPixels && index < byteData.length) {
        const pixel: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 };

        let data = getNextByte(byteData, index, true);
        const colorValue = (1 - data[0]) * 255;

        pixel["r"] = Math.floor(colorValue);
        pixel["g"] = Math.floor(colorValue);
        pixel["b"] = Math.floor(colorValue);
        index = data[1];

        colorData.push(pixel);
        pixelIndex += 1;
      }
      break;
    }
    case "P2": {
      // The rest of byteData (starting from byteData[i]) should be the each pixel's data formatted in P2.
      while (pixelIndex < totalPixels && index < byteData.length) {
        const pixel: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 };
        const data = getNextByte(byteData, index, false);
        const value = Math.floor((data[0] / mc) * 255);
        pixel["r"] = value;
        pixel["g"] = value;
        pixel["b"] = value;
        index = data[1];

        colorData.push(pixel);
      }
      break;
    }
    case "P3": {
      // The rest of byteData (starting from byteData[i]) should be the each pixel's data formatted in P3.
      while (pixelIndex < totalPixels && index < byteData.length) {
        const pixel: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 };

        let data = getNextByte(byteData, index, false);
        pixel["r"] = Math.floor((data[0] / mc) * 255);
        index = data[1];

        data = getNextByte(byteData, index, false);
        pixel["g"] = Math.floor((data[0] / mc) * 255);
        index = data[1];

        data = getNextByte(byteData, index, false);
        pixel["b"] = Math.floor((data[0] / mc) * 255);
        index = data[1];

        colorData.push(pixel);
      }
      break;
    }
    case "P4": {
      const bytesPerRow = Math.ceil(width / 8);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const byteOffset = (y * bytesPerRow) + Math.floor(x / 8);
          const bitOffset = x % 8;
          
          const byte = byteData[index + byteOffset];
          const colorValue = (1 - ((byte & (0x1 << (7 - bitOffset))) >> (7 - bitOffset))) * 255;
          colorData.push({
            r: colorValue,
            g: colorValue,
            b: colorValue,
          });
        }
      }
      break;
    }
    case "P5": {
      while (pixelIndex < totalPixels) {
        colorData.push({
          r: byteData[index],
          g: byteData[index],
          b: byteData[index],
        });
        pixelIndex += 1;
        index += 1;
      }
      break;6
    }
    case "P6": {
      while (pixelIndex < totalPixels) {
        colorData.push({
          r: byteData[index],
          g: byteData[index + 1],
          b: byteData[index + 2],
        });
        pixelIndex += 1;
        index += 3;
      }
      break;
    }
    default:
      return { status: PARSE_STATUS.FAILURE };
  }

  return { status: PARSE_STATUS.SUCCESS, colorData, width, height, imgType };
};

export default { PARSE_STATUS, parseByteFormat };
