const memberRolePolicy = Object.freeze({
  USER: "일반 회원",
  AGENT: "공인중개사",
});

const getMemberRolePolicyName = (code) => memberRolePolicy[code] || code;

export default {
  memberRolePolicy,
  getMemberRolePolicyName,
};
