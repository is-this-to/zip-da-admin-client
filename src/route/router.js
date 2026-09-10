import { createRouter, createWebHistory } from "vue-router";
import { useAdminAuthStore } from "../store/auth/useAdminAuthStore.js";
import { useMyErrorStore } from "../store/error/useMyErrorStore.js";
import Main from "../page/main/Main.vue";
import ErrorPage from "../page/error/ErrorPage.vue";
import adminMenu from "../constant/adminMenu.js";
import AdminPagePlaceholder from "../page/main/AdminPagePlaceholder.vue";
import AdminSignIn from "../page/auth/AdminSignIn.vue";
import AdminDashboard from "../page/dashboard/AdminDashboard.vue";
import AdminAgencyList from "../page/agency/AdminAgencyList.vue";
import AdminAccountRoleList from "../page/admin/AdminAccountRoleList.vue";
import AdminAgencyOperatingStatusList from "../page/admin/AdminAgencyOperatingStatusList.vue";
import AdminAgentApplicationList from "../page/agent/AdminAgentApplicationList.vue";

const ADMIN_ROLES = ["CS_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"];

// 팀원 각자파트 권한을 나눠서 routes 컴포넌트 경로 적어주세요
const setMeta = (requiresAuth, guestOnly, roles = []) => {
  return {
    requiresAuth, // 로그인이 필요?
    guestOnly, // 게스트만 접근 가능?
    roles, // 해당 role을 가진 유저만 접근 가능, []인 경우 role 필요 없음
  };
};

const adminMenuById = new Map(adminMenu.map((menu) => [menu.id, menu]));

const createAdminMeta = (menuId) => {
  const menu = adminMenuById.get(menuId);

  return {
    ...setMeta(true, false, menu.roles),
    menuId: menu.id,
    pageName: menu.name,
  };
};

const adminChildren = [
  {
    path: "dashboard",
    name: "admin-dashboard",
    component: AdminDashboard,
    meta: createAdminMeta("dashboard"),
  },
  {
    path: "members",
    name: "admin-members",
    component: AdminPagePlaceholder,
    meta: createAdminMeta("members"),
  },
  {
    path: "member-management",
    name: "admin-member-management",
    component: AdminPagePlaceholder,
    meta: createAdminMeta("member-management"),
  },
  {
    path: "agent-applications",
    name: "admin-agent-applications",
    component: AdminAgentApplicationList,
    meta: createAdminMeta("agent-applications"),
  },
  {
    path: "agencies",
    name: "admin-agencies",
    component: AdminAgencyList,
    meta: createAdminMeta("agencies"),
  },
  {
    path: "agency-status",
    name: "admin-agency-status",
    component: AdminAgencyOperatingStatusList,
    meta: createAdminMeta("agency-status"),
  },
  {
    path: "property-reports",
    name: "admin-property-reports",
    component: AdminPagePlaceholder,
    meta: createAdminMeta("property-reports"),
  },
  {
    path: "properties",
    name: "admin-properties",
    component: AdminPagePlaceholder,
    meta: createAdminMeta("properties"),
  },
  {
    path: "property-history",
    name: "admin-property-history",
    component: AdminPagePlaceholder,
    meta: createAdminMeta("property-history"),
  },
  {
    path: "admin-accounts-roles",
    name: "admin-accounts-roles",
    component: AdminAccountRoleList,
    meta: createAdminMeta("admin-accounts-roles"),
  },
  {
    path: "member-login-history",
    name: "admin-member-login-history",
    component: AdminPagePlaceholder,
    meta: createAdminMeta("member-login-history"),
  },
  {
    path: "admin-login-history",
    name: "admin-admin-login-history",
    component: AdminPagePlaceholder,
    meta: createAdminMeta("admin-login-history"),
  },
  {
    path: "admin-audit-log",
    name: "admin-admin-audit-log",
    component: AdminPagePlaceholder,
    meta: createAdminMeta("admin-audit-log"),
  },
  {
    path: "cs-statistics",
    name: "admin-cs-statistics",
    component: AdminPagePlaceholder,
    meta: createAdminMeta("cs-statistics"),
  },
  {
    path: "sales-statistics",
    name: "admin-sales-statistics",
    component: AdminPagePlaceholder,
    meta: createAdminMeta("sales-statistics"),
  },
];

const routes = [
  {
    path: "/",
    redirect: "/admins",
    meta: setMeta(false, false),
  },
  {
    path: "/admins",
    component: Main,
    meta: setMeta(true, false, ADMIN_ROLES),
    redirect: "/admins/dashboard",
    children: adminChildren,
  },
  {
    path: "/admins/sign-in",
    component: AdminSignIn,
    meta: setMeta(false, true),
  },
  {
    path: "/errors",
    component: ErrorPage,
    meta: setMeta(false, false),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// router 이동 전 실행되는 메서드
// to: 이동하는 router, from: 지금 있는 router
router.beforeEach(async (to) => {
  const authStore = useAdminAuthStore();

  if (!authStore.authInitialized) {
    await authStore.reissue();
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return {
      path: "/admins/sign-in",
      query: { redirect: to.fullPath },
    };
  }

  if (to.meta.guestOnly && authStore.isLoggedIn) {
    return "/admins";
  }

  if (
    to.meta.roles?.length > 0 &&
    !authStore.hasAnyRole(to.meta.roles)
  ) {
    const errorStore = useMyErrorStore();
    errorStore.setErrorInfo({
      response: {
        data: {
          code: "FORBIDDEN",
          data: "이 화면에 접근할 권한이 없습니다.",
        },
      },
    });

    return "/errors";
  }

  return true;
});

export default router;
