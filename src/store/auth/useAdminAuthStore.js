import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { jwtDecode } from "jwt-decode";
import adminAxios from "../../api/adminAxios";

export const useAdminAuthStore = defineStore("adminAuthStore", () => {
  const isLoggedIn = ref(false);
  const accessToken = ref("");
  const adminInfo = ref(null);
  const roles = ref([]);
  const authInitialized = ref(false);

  let reissuePromise = null;

  const role = computed(() => roles.value[0] || null);

  const tokenRoles = computed(() => {
    if (!accessToken.value) return [];

    try {
      const claims = jwtDecode(accessToken.value);
      return Array.isArray(claims.roles) ? claims.roles : [];
    } catch {
      return [];
    }
  });

  const clearAuthStore = () => {
    isLoggedIn.value = false;
    accessToken.value = "";
    adminInfo.value = null;
    roles.value = [];
  };

  const setAuthentication = (data) => {
    accessToken.value = data.accessToken;
    roles.value = Array.isArray(data.roles) ? data.roles : tokenRoles.value;
    adminInfo.value = {
      adminId: data.adminId,
      passwordChangeRequired: Boolean(data.passwordChangeRequired),
    };
    isLoggedIn.value = Boolean(data.accessToken);
    authInitialized.value = true;
  };

  const hasRole = (roleCode) => roles.value.includes(roleCode);

  const hasAnyRole = (roleCodes) => {
    return roleCodes.some(hasRole);
  };

  const login = async (loginForm) => {
    const res = await adminAxios.post("/api/member/admin/auth/admin-sessions", loginForm);
    setAuthentication(res.data.data);
  };

  const performReissue = async () => {
    try {
      const res = await adminAxios.post("/api/member/admin/auth/admin-token-refreshes");
      setAuthentication(res.data.data);
      return true;
    } catch {
      clearAuthStore();
      return false;
    } finally {
      authInitialized.value = true;
    }
  };

  const reissue = () => {
    if (!reissuePromise) {
      reissuePromise = performReissue().finally(() => {
        reissuePromise = null;
      });
    }

    return reissuePromise;
  };

  const logout = async () => {
    try {
      await adminAxios.delete("/api/member/admin/auth/admin-sessions/current");
    } finally {
      clearAuthStore();
    }
  };

  return {
    isLoggedIn,
    accessToken,
    adminInfo,
    roles,
    authInitialized,
    role,
    hasRole,
    hasAnyRole,
    login,
    reissue,
    logout,
  };
});
