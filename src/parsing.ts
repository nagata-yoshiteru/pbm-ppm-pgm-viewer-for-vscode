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
  console.time('Parsing');
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

  let colorData: number[][] = [];
  switch (imgType) {
    case "P2": {
      // The rest of byteData (starting from byteData[i]) should be the each pixel's data formatted in P2.
      let index = i;
      while (index < byteData.length - 1) {
        const data = getNextByte(byteData, index);
        const value = Math.floor((data[0] / mc) * 255);
        const pixel: number[] = [value, value, value];
        index = data[1];

        colorData.push(pixel);
      }
      break;
    }
    case "P3": {
      // The rest of byteData (starting from byteData[i]) should be the each pixel's data formatted in P3.
      let index = i;
      while (index < byteData.length - 1) {
        const pixel: number[] = [];

        for (let j = 0; j < 3; j++) {
          const data = getNextByte(byteData, index);
          pixel[j] = Math.floor((data[0] / mc) * 255);
          index = data[1];
        }

        colorData.push(pixel);
      }
      break;
    }
    case "P5":
      for (let index = i; index < byteData.byteLength; index++) {
        colorData.push([byteData[index], byteData[index],  byteData[index]]);
      }
      break;
    case "P6":
      for (let index = i; index < byteData.byteLength; index = index + 3) {
        colorData.push([byteData[index], byteData[index + 1], byteData[index + 2]]);
      }
      break;
    default:
      return { status: PARSE_STATUS.FAILURE };
  }

  console.timeEnd('Parsing');
  return { status: PARSE_STATUS.SUCCESS, colorData, width, height, imgType };
};

export default { PARSE_STATUS, parseByteFormat };
