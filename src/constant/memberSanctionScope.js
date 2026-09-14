const memberSanctionScope = Object.freeze({
  ACCOUNT: "계정",
  PROPERTY: "매물",
});

const memberSanctionScopeCodes = Object.freeze(Object.keys(memberSanctionScope));

const getMemberSanctionScopeName = (code) => memberSanctionScope[code] || code;

export default {
  memberSanctionScope,
  memberSanctionScopeCodes,
  getMemberSanctionScopeName,
};
