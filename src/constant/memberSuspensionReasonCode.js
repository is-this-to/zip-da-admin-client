const memberSuspensionReasonCode = Object.freeze({
  FALSE_PROPERTY_REPEAT: "허위매물 반복 위반",
  SUSPENSION_COUNT_LIMIT: "계정 정지 5회 누적",
});

const memberSuspensionReasonCodes = Object.freeze(Object.keys(memberSuspensionReasonCode));

const getMemberSuspensionReasonCodeName = (code) => (
  memberSuspensionReasonCode[code] || code
);

export default {
  memberSuspensionReasonCode,
  memberSuspensionReasonCodes,
  getMemberSuspensionReasonCodeName,
};
