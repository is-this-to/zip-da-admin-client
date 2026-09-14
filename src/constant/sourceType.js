const sourceType = {
  DIRECT: "직거래",
  AGENT: "공인중개사",
};

Object.freeze(sourceType);

const getSourceTypeName = (code) => {
  return sourceType[code] || code;
};

export default {
  sourceType,
  getSourceTypeName,
};
