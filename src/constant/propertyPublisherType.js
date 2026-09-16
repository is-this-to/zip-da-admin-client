const propertyPublisherType = Object.freeze({
  DIRECT_OWNER: "집주인 직접",
  DIRECT_TENANT: "세입자 직접",
  AGENT_BROKERAGE: "중개사",
});

const getPropertyPublisherTypeName = (code) => propertyPublisherType[code] || code;

export default {
  propertyPublisherType,
  getPropertyPublisherTypeName,
};
