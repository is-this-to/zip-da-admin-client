const agentApplicationStatus = Object.freeze({
  PENDING: "대기",
  UNDER_REVIEW: "검토중",
  APPROVED: "승인",
  REJECTED: "보완 요청",
  INCORRECT_DATA: "잘못된 자료",
});

const verificationResultStatus = Object.freeze({
  MATCHED: "일치",
  MISMATCHED: "불일치",
  ERROR: "오류",
});

const agentApplicationStatusCodes = Object.freeze(
  Object.keys(agentApplicationStatus),
);

const getAgentApplicationStatusName = (code) => {
  return agentApplicationStatus[code] || code;
};

const getVerificationResultStatusName = (code) => {
  if (!code) return "검증 대기";
  return verificationResultStatus[code] || code;
};

export default {
  agentApplicationStatus,
  verificationResultStatus,
  agentApplicationStatusCodes,
  getAgentApplicationStatusName,
  getVerificationResultStatusName,
};
