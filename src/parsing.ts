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
    k = 0;
  while (i < byteData.byteLength && k < 3) {
    while (i < byteData.byteLength && byteData[i++] !== 10);
    if (i - 1 - j === 2) {
      imgType = byteData.subarray(j, i - 1).toString();
      console.log(`Type: ${imgType}`);
      k++;
    } else {
      const texts = byteData.subarray(j, i - 1).toString().split(" ");
      if (texts.length === 1) {
        mc = Number(texts[0]);
        console.log(`Color: ${mc}`);
        k++;
      } else if (texts.length === 2) {
        width = Number(texts[0]);
        height = Number(texts[1]);
        console.log(`Size: ${width}x${height}`);
        k++;
      }
    }
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
