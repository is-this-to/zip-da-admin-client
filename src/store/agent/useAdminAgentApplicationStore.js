import { defineStore } from "pinia";
import { ref } from "vue";
import adminAxios from "../../api/adminAxios.js";

export const useAdminAgentApplicationStore = defineStore(
  "adminAgentApplicationStore",
  () => {
    const applications = ref([]);
    const page = ref(0);
    const totalElements = ref(0);
    const totalPages = ref(0);
    const applicationDetail = ref(null);
    const fetchApplications = async (params) => {
      const response = await adminAxios.get(
        "/api/member/admin/agent-applications",
        { params },
      );
      const result = response.data.data;

      applications.value = result.content ?? [];
      page.value = result.page ?? 0;
      totalElements.value = result.totalElements ?? 0;
      totalPages.value = result.totalPages ?? 0;

      return result;
    };

    const clearApplications = () => {
      applications.value = [];
      page.value = 0;
      totalElements.value = 0;
      totalPages.value = 0;
    };

    const fetchApplicationDetail = async (applicationId) => {
      applicationDetail.value = null;

      const response = await adminAxios.get(
        `/api/member/admin/agent-applications/${applicationId}`,
      );
      applicationDetail.value = response.data.data;

      return applicationDetail.value;
    };

    const clearApplicationDetail = () => {
      applicationDetail.value = null;
    };

    const getDocumentDownloadUrl = async (applicationId, documentId) => {
      const response = await adminAxios.get(
        `/api/member/admin/agent-applications/${applicationId}/documents/${documentId}/download-url`,
      );
      const result = response.data.data;
      const expiresInSeconds = Number(result.expiresInSeconds) || 300;

      return {
        url: result.url,
        expiresInSeconds,
        expiresAt: Date.now() + expiresInSeconds * 1_000,
      };
    };

    const requestSupplement = (applicationId, payload) =>
      adminAxios.patch(
        `/api/member/admin/agent-applications/${applicationId}/supplement-request`,
        payload,
      );

    const approveApplication = (applicationId, payload) =>
      adminAxios.patch(
        `/api/member/admin/agent-applications/${applicationId}/approval`,
        payload,
      );

    return {
      applications,
      page,
      totalElements,
      totalPages,
      applicationDetail,
      fetchApplications,
      clearApplications,
      fetchApplicationDetail,
      clearApplicationDetail,
      getDocumentDownloadUrl,
      requestSupplement,
      approveApplication,
    };
  },
);
