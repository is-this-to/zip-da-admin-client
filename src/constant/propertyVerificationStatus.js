const propertyVerificationStatus = Object.freeze({
  UNVERIFIED: "미인증",
  IN_REVIEW: "심사중",
  OWNER_VERIFIED: "소유자 인증",
  TENANT_VERIFIED: "세입자 인증",
  AGENT_VERIFIED: "중개사 인증",
  VERIFICATION_EXEMPT: "검증 제외",
  REJECTED: "반려",
  EXPIRED: "만료",
});

const verifiedPropertyVerificationStatuses = Object.freeze([
  "OWNER_VERIFIED",
  "TENANT_VERIFIED",
  "AGENT_VERIFIED",
  "VERIFICATION_EXEMPT",
]);

const getPropertyVerificationStatusName = (code) => propertyVerificationStatus[code] || code;
const isVerifiedPropertyVerificationStatus = (code) =>
  verifiedPropertyVerificationStatuses.includes(code);

export default {
  propertyVerificationStatus,
  verifiedPropertyVerificationStatuses,
  getPropertyVerificationStatusName,
  isVerifiedPropertyVerificationStatus,
};
