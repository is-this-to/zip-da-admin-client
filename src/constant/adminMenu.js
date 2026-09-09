const ALL_ADMIN_ROLES = ["CS_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"];
const CS_ADMIN_ROLES = ["CS_ADMIN", "SUPER_ADMIN"];
const SALES_ADMIN_ROLES = ["SALES_ADMIN", "SUPER_ADMIN"];
const SUPER_ADMIN_ROLES = ["SUPER_ADMIN"];

const adminMenu = Object.freeze([
  {
    id: "dashboard",
    name: "대시보드",
    group: "",
    roles: ALL_ADMIN_ROLES,
  },
  {
    id: "members",
    name: "회원 검색·목록",
    group: "회원 관리",
    roles: CS_ADMIN_ROLES,
  },
  {
    id: "member-management",
    name: "회원 관리",
    group: "회원 관리",
    roles: CS_ADMIN_ROLES,
  },
  {
    id: "agent-applications",
    name: "중개사 신청 검토",
    group: "중개사 심사",
    roles: SALES_ADMIN_ROLES,
  },
  {
    id: "agencies",
    name: "중개소 검색·조회",
    group: "중개소 관리",
    roles: ALL_ADMIN_ROLES,
  },
  {
    id: "agency-status",
    name: "중개소 영업 상태 관리",
    group: "중개소 관리",
    roles: SALES_ADMIN_ROLES,
  },
  {
    id: "property-reports",
    name: "허위매물 신고 관리",
    group: "매물 관리",
    roles: CS_ADMIN_ROLES,
  },
  {
    id: "properties",
    name: "매물 운영 정보 조회",
    group: "매물 관리",
    roles: ALL_ADMIN_ROLES,
  },
  {
    id: "property-history",
    name: "매물 수정 이력 조회",
    group: "매물 관리",
    roles: ALL_ADMIN_ROLES,
  },
  {
    id: "admin-accounts-roles",
    name: "관리자 계정·권한",
    group: "관리자 관리",
    roles: SUPER_ADMIN_ROLES,
  },
  {
    id: "member-login-history",
    name: "회원 로그인 이력",
    group: "접속 이력",
    roles: CS_ADMIN_ROLES,
  },
  {
    id: "admin-login-history",
    name: "관리자 로그인 이력",
    group: "접속 이력",
    roles: SUPER_ADMIN_ROLES,
  },
  {
    id: "admin-audit-log",
    name: "관리자 감사 로그",
    group: "감사",
    roles: SUPER_ADMIN_ROLES,
  },
  {
    id: "cs-statistics",
    name: "CS 운영 통계",
    group: "통계",
    roles: CS_ADMIN_ROLES,
  },
  {
    id: "sales-statistics",
    name: "중개사 영업 통계",
    group: "통계",
    roles: SALES_ADMIN_ROLES,
  },
]);

export default adminMenu;
