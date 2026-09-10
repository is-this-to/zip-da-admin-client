const agentOperatingStatus = {
  ACTIVE: "영업중",
  SUSPENDED: "휴업",
  CLOSED: "폐업",
};

Object.freeze(agentOperatingStatus);

const getAgentOperatingStatusName = (code) => {
  return agentOperatingStatus[code] || code;
};

export default {
  agentOperatingStatus,
  getAgentOperatingStatusName,
};
