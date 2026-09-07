import axios from "axios";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import { useAdminAuthStore } from "../store/auth/useAdminAuthStore";

const adminAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const shouldReissue = (accessToken) => {
  try {
    const claims = jwtDecode(accessToken);
    const reissueAt = dayjs.unix(claims.exp).subtract(2, "minute").unix();
    return dayjs().unix() >= reissueAt;
  } catch {
    return true;
  }
};

adminAxios.interceptors.request.use(async (config) => {
  const authStore = useAdminAuthStore();
  const isReissueRequest = config.url === "/api/member/admin/auth/admin-token-refreshes";

  if (
    !isReissueRequest &&
    authStore.isLoggedIn &&
    shouldReissue(authStore.accessToken)
  ) {
    await authStore.reissue();
  }

  if (authStore.accessToken && !isReissueRequest) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`;
  }

  return config;
});

export default adminAxios;
