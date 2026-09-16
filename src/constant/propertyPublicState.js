const propertyPublicState = Object.freeze({
  VISIBLE: "공개 중",
  WAITING_PUBLICATION: "공개 심사 대기",
  WAITING_VERIFICATION: "증빙 승인 대기",
  WAITING_BOTH: "공개·증빙 심사 대기",
  NOT_VISIBLE: "미공개",
});

const getPropertyPublicStateName = (code) => propertyPublicState[code] || code;

export default {
  propertyPublicState,
  getPropertyPublicStateName,
};
