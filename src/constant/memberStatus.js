const memberStatus = Object.freeze({
  ACTIVE: "활동",
  SUSPENDED: "정지",
  WITHDRAWN: "탈퇴",
});

const getMemberStatusName = (code) => memberStatus[code] || code;

export default {
  memberStatus,
  getMemberStatusName,
};
