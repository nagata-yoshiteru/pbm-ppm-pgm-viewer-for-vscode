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

const getNextByte = (data: Uint8Array, index: number) => {
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

  let colorData: { r: number; g: number; b: number }[] = [];
  switch (imgType) {
    case "P2": {
      // The rest of byteData (starting from byteData[i]) should be the each pixel's data formatted in P2.
      let index = i;
      while (index < byteData.length - 1) {
        const pixel: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 };
        const data = getNextByte(byteData, index);
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
      let index = i;
      while (index < byteData.length - 1) {
        const pixel: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 };

        let data = getNextByte(byteData, index);
        pixel["r"] = Math.floor((data[0] / mc) * 255);
        index = data[1];

        data = getNextByte(byteData, index);
        pixel["g"] = Math.floor((data[0] / mc) * 255);
        index = data[1];

        data = getNextByte(byteData, index);
        pixel["b"] = Math.floor((data[0] / mc) * 255);
        index = data[1];

        colorData.push(pixel);
      }
      break;
    }
    case "P5":
      for (let index = i; index < byteData.byteLength; index++) {
        colorData.push({
          r: byteData[index],
          g: byteData[index],
          b: byteData[index],
        });
      }
      break;
    case "P6":
      for (let index = i; index < byteData.byteLength; index = index + 3) {
        colorData.push({
          r: byteData[index],
          g: byteData[index + 1],
          b: byteData[index + 2],
        });
      }
      break;
    default:
      return { status: PARSE_STATUS.FAILURE };
  }

  return { status: PARSE_STATUS.SUCCESS, colorData, width, height, imgType };
};

export default { PARSE_STATUS, parseByteFormat };
