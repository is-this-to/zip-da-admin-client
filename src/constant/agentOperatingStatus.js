const agentOperatingStatus = Object.freeze({
  ACTIVE: "영업중",
  SUSPENDED: "휴업",
  CLOSED: "폐업",
});

const agentOperatingStatusCodes = Object.freeze(Object.keys(agentOperatingStatus));

const getAgentOperatingStatusName = (code) => {
  return agentOperatingStatus[code] || code;
};

export default {
  agentOperatingStatus,
  agentOperatingStatusCodes,
  getAgentOperatingStatusName,
};
