import axios from "axios";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import { useAdminAuthStore } from "../store/auth/useAdminAuthStore.js";

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
  const publicAuthUrls = [
    "/api/member/admin/auth/admin-sessions", // 로그인 요청에 기존 Access Token 첨부 방지
    "/api/member/admin/auth/admin-token-refreshes", // 토큰 재발급 요청의 재귀 호출 방지
  ];
  const isPublicAuthRequest = publicAuthUrls.includes(config.url);

  if (
    !isPublicAuthRequest &&
    authStore.isLoggedIn &&
    shouldReissue(authStore.accessToken)
  ) {
    await authStore.reissue();
  }

  if (authStore.accessToken && !isPublicAuthRequest) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`;
  }

  return config;
});

export default adminAxios;
