const adminRoleCode = {
  SUPER_ADMIN: "최고 관리자",
  CS_ADMIN: "CS 관리자",
  SALES_ADMIN: "영업 관리자",
  SYSTEM: "시스템",
};

Object.freeze(adminRoleCode);

// 수동 부여 가능 역할
const assignableAdminRoleCodes = Object.freeze([
  "CS_ADMIN",
  "SALES_ADMIN",
  "SUPER_ADMIN",
]);

const getAdminRoleCodeName = (code) => {
  return adminRoleCode[code] || code;
};

export default {
  adminRoleCode,
  assignableAdminRoleCodes,
  getAdminRoleCodeName,
};
