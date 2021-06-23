const PARSE_STATUS = {
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
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
    while (i < byteData.byteLength
      && byteData[i] !== 9  // HT
      && byteData[i] !== 10  // LF
      && byteData[i] !== 13  // CR
      && byteData[i] !== 32) {  // SPACE
      i++;
    };
    if (byteData[j] === 35) {  // Comment Line
      while (i < byteData.byteLength && byteData[i] !== 10) {  // LF
        i++;
      };
    } else {
      switch (k) {
        case 0:
          imgType = byteData.subarray(j, i).toString();
          console.log(`Type: ${imgType}`);
          if (imgType === "P5" || imgType === "P6") kl++;
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
    j = i;
  }

  let colorData: { r: number; g: number; b: number }[] = [];
  switch (imgType) {
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
