const adminRoleCode = {
  SUPER_ADMIN: "최고 관리자",
  CS_ADMIN: "CS 관리자",
  SALES_ADMIN: "영업 관리자",
  SYSTEM: "시스템",
};

Object.freeze(adminRoleCode);

const getAdminRoleCodeName = (code) => {
  return adminRoleCode[code] || code;
};

export default {
  adminRoleCode,
  getAdminRoleCodeName,
};
