import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { jwtDecode } from "jwt-decode";
import adminAxios from "../../api/adminAxios";

export const useAdminAuthStore = defineStore("adminAuthStore", () => {
  const isLoggedIn = ref(false);
  const accessToken = ref("");
  const adminInfo = ref(null);
  const authInitialized = ref(false);

  let reissuePromise = null;

  const role = computed(() => {
    if (!accessToken.value) return null;

    try {
      return jwtDecode(accessToken.value).role;
    } catch {
      return null;
    }
  });

  const clearAuthStore = () => {
    isLoggedIn.value = false;
    accessToken.value = "";
    adminInfo.value = null;
  };

  const setAuthentication = (data) => {
    accessToken.value = data.accessToken;
    adminInfo.value = data.principal;
    isLoggedIn.value = true;
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
    authInitialized,
    role,
    login,
    reissue,
    logout,
  };
});
