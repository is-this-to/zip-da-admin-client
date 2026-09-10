import { createRouter, createWebHistory } from "vue-router";
import Main from "../page/main/Main.vue";
import ErrorPage from "../page/error/ErrorPage.vue";
import AdminSignIn from "../page/auth/AdminSignIn.vue";
import AdminDashboard from "../page/dashboard/AdminDashboard.vue";
import AdminAgencyList from "../page/agency/AdminAgencyList.vue";
import AdminPagePlaceholder from "../page/main/AdminPagePlaceholder.vue";
import adminMenu from "../constant/adminMenu.js";
import { useAdminAuthStore } from "../store/auth/useAdminAuthStore.js";
import { useMyErrorStore } from "../store/error/useMyErrorStore.js";

const ADMIN_ROLES = ["CS_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"];

// 팀원 각자파트 권한을 나눠서 routes 컴포넌트 경로 적어주세요
const setMeta = (requiresAuth, guestOnly, roles = []) => {
  return {
    requiresAuth, // 로그인이 필요?
    guestOnly, // 게스트만 접근 가능?
    roles, // 해당 role을 가진 유저만 접근 가능, []인 경우 role 필요 없음
  };
};

const adminChildren = adminMenu.map((menu) => ({
  path: menu.id,
  component:
    {
      dashboard: AdminDashboard,
      agencies: AdminAgencyList,
    }[menu.id] || AdminPagePlaceholder,
  meta: {
    ...setMeta(true, false, menu.roles),
    menuId: menu.id,
    pageName: menu.name,
  },
}));

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
