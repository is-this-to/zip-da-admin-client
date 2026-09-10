<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import adminAxios from "../../api/adminAxios.js";
import agentApplicationStatus from "../../constant/agentApplicationStatus.js";

// 목록 페이지 크기
const PAGE_SIZE = 20;

// 검색 조건 상태
const searchForm = reactive({
  applicant: "",
  agencyName: "",
  businessRegistrationNo: "",
  status: "",
});
const appliedSearch = reactive({ ...searchForm });

// 목록 응답 상태
const applications = ref([]);
const page = ref(0);
const totalElements = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);
const errorMessage = ref("");
const selectedApplication = ref(null);
const applicationDetail = ref(null);
const isDetailLoading = ref(false);
const isSubmitting = ref(false);
const modalErrorMessage = ref("");
const reviewMode = ref("detail");

// 보완 요청 입력값
const supplementForm = reactive({
  supplementReason: "",
  supplementDeadline: "",
});

// 승인 입력값
const approveForm = reactive({ reviewNote: "" });

const statusOptions = computed(() => (
  agentApplicationStatus.agentApplicationStatusCodes.map((code) => ({
    code,
    name: agentApplicationStatus.getAgentApplicationStatusName(code),
  }))
));

const visiblePages = computed(() => {
  if (totalPages.value === 0) return [];

  const pageGroupSize = 5;
  const start = Math.floor(page.value / pageGroupSize) * pageGroupSize;
  const end = Math.min(start + pageGroupSize, totalPages.value);
  return Array.from({ length: end - start }, (_, index) => start + index);
});

// 목록 조회 파라미터
const requestParams = (requestedPage) => {
  const params = { page: requestedPage, size: PAGE_SIZE };

  Object.entries(appliedSearch).forEach(([key, value]) => {
    const normalizedValue = value.trim();
    if (normalizedValue) params[key] = normalizedValue;
  });

  return params;
};

// 중개사 신청 목록 조회
const fetchApplications = async (requestedPage = 0) => {
  if (isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await adminAxios.get(
      "/api/member/admin/agent-applications",
      { params: requestParams(requestedPage) },
    );
    const result = response.data.data;

    applications.value = result.content;
    page.value = result.page;
    totalElements.value = result.totalElements;
    totalPages.value = result.totalPages;
  } catch {
    applications.value = [];
    page.value = 0;
    totalElements.value = 0;
    totalPages.value = 0;
    errorMessage.value = "중개사 신청 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isLoading.value = false;
  }
};

const search = () => {
  Object.assign(appliedSearch, searchForm);
  fetchApplications(0);
};

const resetSearch = () => {
  Object.keys(searchForm).forEach((key) => {
    searchForm[key] = "";
  });
  Object.assign(appliedSearch, searchForm);
  fetchApplications(0);
};

const movePage = (requestedPage) => {
  if (
    isLoading.value
    || requestedPage < 0
    || requestedPage >= totalPages.value
    || requestedPage === page.value
  ) return;

  fetchApplications(requestedPage);
};

const openReviewModal = async (application) => {
  selectedApplication.value = application;
  applicationDetail.value = null;
  reviewMode.value = "detail";
  modalErrorMessage.value = "";
  supplementForm.supplementReason = "";
  supplementForm.supplementDeadline = "";
  approveForm.reviewNote = "";
  isDetailLoading.value = true;

  try {
    const response = await adminAxios.get(
      `/api/member/admin/agent-applications/${application.applicationId}`,
    );
    applicationDetail.value = response.data.data;
  } catch {
    modalErrorMessage.value = "신청 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isDetailLoading.value = false;
  }
};

const closeReviewModal = (force = false) => {
  if (isSubmitting.value && !force) return;

  selectedApplication.value = null;
  applicationDetail.value = null;
  reviewMode.value = "detail";
  modalErrorMessage.value = "";
};

const canProcessReview = computed(() => (
  applicationDetail.value?.status === "UNDER_REVIEW"
));

const requestSupplement = async () => {
  if (!applicationDetail.value || isSubmitting.value) return;

  const supplementReason = supplementForm.supplementReason.trim();
  if (!supplementReason || !supplementForm.supplementDeadline) {
    modalErrorMessage.value = "보완 사유와 보완 마감일시를 입력해 주세요.";
    return;
  }

  isSubmitting.value = true;
  modalErrorMessage.value = "";

  try {
    await adminAxios.patch(
      `/api/member/admin/agent-applications/${applicationDetail.value.applicationId}/supplement-request`,
      { supplementReason, supplementDeadline: supplementForm.supplementDeadline },
    );
    closeReviewModal(true);
    await fetchApplications(page.value);
  } catch (error) {
    modalErrorMessage.value = error.response?.data?.message
      || "보완 요청을 처리하지 못했습니다. 입력값을 확인해 주세요.";
  } finally {
    isSubmitting.value = false;
  }
};

const approveApplication = async () => {
  if (!applicationDetail.value || isSubmitting.value) return;

  isSubmitting.value = true;
  modalErrorMessage.value = "";

  try {
    await adminAxios.patch(
      `/api/member/admin/agent-applications/${applicationDetail.value.applicationId}/approval`,
      { reviewNote: approveForm.reviewNote.trim() || null },
    );
    closeReviewModal(true);
    await fetchApplications(page.value);
  } catch (error) {
    modalErrorMessage.value = error.response?.data?.message
      || "중개사 신청을 승인하지 못했습니다. 검증 결과와 서류를 확인해 주세요.";
  } finally {
    isSubmitting.value = false;
  }
};

const formatStatus = (status) => agentApplicationStatus.getAgentApplicationStatusName(status);
const formatVerificationStatus = (status) => agentApplicationStatus.getVerificationResultStatusName(status);
const formatSubmittedAt = (submittedAt) => submittedAt ? dayjs(submittedAt).format("YYYY-MM-DD HH:mm") : "-";
const formatDate = (date) => date ? dayjs(date).format("YYYY-MM-DD") : "-";
const formatDocumentType = (documentType) => ({
  BUSINESS_LICENSE: "사업자등록증",
  BROKER_OFFICE_LICENSE: "공인중개사무소 등록증",
}[documentType] || documentType);

const applicationStatusClass = (status) => ({
  PENDING: "is-pending",
  UNDER_REVIEW: "is-under-review",
  APPROVED: "is-approved",
  REJECTED: "is-rejected",
  INCORRECT_DATA: "is-incorrect-data",
}[status]);

const verificationStatusClass = (status) => ({
  MATCHED: "is-matched",
  MISMATCHED: "is-mismatched",
  ERROR: "is-error",
}[status]);

onMounted(() => {
  fetchApplications();
});
</script>

<template>
  <div class="agent-application-list-page">
    <header class="page-heading">
      <p>관리자 화면 &gt; 중개사 심사 &gt; 중개사 신청 검토</p>
      <h1>중개사 신청 검토</h1>
      <span>신청 정보와 사업자번호·등록번호 외부 검증 결과를 확인합니다.</span>
    </header>

    <form class="search-panel" @submit.prevent="search">
      <div class="search-field">
        <label for="applicant">신청자</label>
        <input id="applicant" v-model="searchForm.applicant" type="text" maxlength="50" placeholder="신청자를 입력하세요." />
      </div>
      <div class="search-field">
        <label for="agency-name">중개소명</label>
        <input id="agency-name" v-model="searchForm.agencyName" type="text" maxlength="150" placeholder="중개소명을 입력하세요." />
      </div>
      <div class="search-field">
        <label for="business-registration-no">사업자번호</label>
        <input id="business-registration-no" v-model="searchForm.businessRegistrationNo" type="text" maxlength="50" placeholder="사업자번호를 입력하세요." />
      </div>
      <div class="search-field">
        <label for="application-status">신청 상태</label>
        <select id="application-status" v-model="searchForm.status">
          <option value="">전체</option>
          <option v-for="status in statusOptions" :key="status.code" :value="status.code">{{ status.name }}</option>
        </select>
      </div>
      <div class="search-actions">
        <button type="button" class="button button--outline" :disabled="isLoading" @click="resetSearch">초기화</button>
        <button type="submit" class="button button--primary" :disabled="isLoading">{{ isLoading ? "검색 중..." : "검색" }}</button>
      </div>
    </form>

    <section class="result-section" aria-live="polite">
      <div class="result-heading">
        <h2>중개사 신청 목록</h2>
        <p>총 <strong>{{ totalElements.toLocaleString() }}</strong>건</p>
      </div>

      <p v-if="errorMessage" class="result-message">{{ errorMessage }}</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>신청 ID</th>
              <th>신청자</th>
              <th>중개소명</th>
              <th>사업자번호</th>
              <th>등록번호</th>
              <th>상태</th>
              <th>사업자번호/등록번호 검증</th>
              <th>신청일</th>
              <th>검토</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="9" class="table-message">중개사 신청 목록을 불러오는 중입니다.</td>
            </tr>
            <tr v-else-if="applications.length === 0">
              <td colspan="9" class="table-message">검색 결과가 없습니다.</td>
            </tr>
            <tr v-for="application in applications" v-else :key="application.applicationId">
              <td class="id-cell">{{ application.applicationId }}</td>
              <td>{{ application.applicantName || "-" }}</td>
              <td class="agency-name-cell">{{ application.agencyName || "-" }}</td>
              <td>{{ application.businessRegistrationNo || "-" }}</td>
              <td>{{ application.agencyRegistrationNo || "-" }}</td>
              <td>
                <span class="status-badge" :class="applicationStatusClass(application.status)">
                  {{ formatStatus(application.status) }}
                </span>
              </td>
              <td>
                <div class="verification-badges">
                  <span class="status-badge" :class="verificationStatusClass(application.businessVerificationResult)">
                    사업자 {{ formatVerificationStatus(application.businessVerificationResult) }}
                  </span>
                  <span class="status-badge" :class="verificationStatusClass(application.agencyRegistrationVerificationResult)">
                    등록번호 {{ formatVerificationStatus(application.agencyRegistrationVerificationResult) }}
                  </span>
                </div>
              </td>
              <td>{{ formatSubmittedAt(application.submittedAt) }}</td>
              <td><button type="button" class="table-action" @click="openReviewModal(application)">검토</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="totalPages > 1" class="pagination" aria-label="중개사 신청 목록 페이지">
        <button type="button" :disabled="page === 0 || isLoading" @click="movePage(page - 1)">이전</button>
        <button
          v-for="pageNumber in visiblePages"
          :key="pageNumber"
          type="button"
          :class="{ 'is-current': pageNumber === page }"
          :aria-current="pageNumber === page ? 'page' : undefined"
          :disabled="isLoading"
          @click="movePage(pageNumber)"
        >
          {{ pageNumber + 1 }}
        </button>
        <button type="button" :disabled="page >= totalPages - 1 || isLoading" @click="movePage(page + 1)">다음</button>
      </nav>
    </section>

    <div v-if="selectedApplication" class="modal-backdrop" @click.self="closeReviewModal">
      <section class="review-modal" role="dialog" aria-modal="true" aria-labelledby="agent-application-modal-title">
        <header class="modal-heading">
          <h2 id="agent-application-modal-title">
            {{ reviewMode === "supplement" ? "보완 요청" : reviewMode === "approve" ? "중개사 신청 승인" : "중개사 신청 검토" }}
          </h2>
          <p>신청 정보와 외부 검증 결과를 확인합니다.</p>
        </header>

        <p v-if="isDetailLoading" class="modal-message">신청 상세 정보를 불러오는 중입니다.</p>
        <p v-else-if="modalErrorMessage && !applicationDetail" class="modal-message modal-message--error">{{ modalErrorMessage }}</p>

        <template v-else-if="applicationDetail">
          <div class="detail-grid">
            <div><span>신청 ID</span><strong>{{ applicationDetail.applicationId }}</strong></div>
            <div><span>신청일</span><strong>{{ formatSubmittedAt(applicationDetail.submittedAt) }}</strong></div>
            <div><span>신청자</span><strong>{{ applicationDetail.applicantName || "-" }}</strong></div>
            <div><span>신청 상태</span><strong>{{ formatStatus(applicationDetail.status) }}</strong></div>
            <div><span>중개소명</span><strong>{{ applicationDetail.agencyName || "-" }}</strong></div>
            <div><span>대표자명</span><strong>{{ applicationDetail.representativeName || "-" }}</strong></div>
            <div><span>사업자번호</span><strong>{{ applicationDetail.businessRegistrationNo || "-" }}</strong></div>
            <div><span>개업일자</span><strong>{{ formatDate(applicationDetail.startDate) }}</strong></div>
            <div><span>등록번호</span><strong>{{ applicationDetail.agencyRegistrationNo || "-" }}</strong></div>
            <div><span>보완 마감일시</span><strong>{{ formatSubmittedAt(applicationDetail.supplementDeadline) }}</strong></div>
          </div>

          <section class="detail-section">
            <h3>외부 검증 결과</h3>
            <div class="verification-detail-grid">
              <div>
                <span>사업자번호 검증</span>
                <strong>{{ formatVerificationStatus(applicationDetail.businessVerification?.resultStatus) }}</strong>
                <small>{{ applicationDetail.businessVerification?.businessStatus || "-" }} · {{ applicationDetail.businessVerification?.taxType || "-" }}</small>
              </div>
              <div>
                <span>등록번호 검증</span>
                <strong>{{ formatVerificationStatus(applicationDetail.agencyRegistrationVerification?.resultStatus) }}</strong>
                <small>{{ applicationDetail.agencyRegistrationVerification?.businessStatus || "-" }}</small>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h3>제출 서류</h3>
            <p v-if="applicationDetail.documents.length === 0" class="empty-document-message">제출된 서류가 없습니다.</p>
            <ul v-else class="document-list">
              <li v-for="document in applicationDetail.documents" :key="document.documentId">
                <strong>{{ formatDocumentType(document.documentType) }}</strong>
                <span>제출 {{ formatSubmittedAt(document.uploadedAt) }}</span>
                <span>{{ document.verifiedAt ? "확인 완료" : "확인 대기" }}</span>
              </li>
            </ul>
            <p class="modal-note">서류 원문 열람은 차순위 기능으로, 현재는 제출 여부와 확인 상태만 표시합니다.</p>
          </section>

          <form v-if="reviewMode === 'supplement'" class="review-form" @submit.prevent="requestSupplement">
            <label for="supplement-reason">보완 사유</label>
            <textarea id="supplement-reason" v-model="supplementForm.supplementReason" maxlength="500" required placeholder="보완이 필요한 내용을 입력하세요." />
            <label for="supplement-deadline">보완 마감일시</label>
            <input id="supplement-deadline" v-model="supplementForm.supplementDeadline" type="datetime-local" required />
            <p v-if="modalErrorMessage" class="modal-message modal-message--error">{{ modalErrorMessage }}</p>
            <div class="modal-actions"><button type="button" class="button button--outline" :disabled="isSubmitting" @click="reviewMode = 'detail'">이전</button><button type="submit" class="button button--primary" :disabled="isSubmitting">{{ isSubmitting ? "처리 중..." : "보완 요청" }}</button></div>
          </form>

          <form v-else-if="reviewMode === 'approve'" class="review-form" @submit.prevent="approveApplication">
            <label for="review-note">검토 메모 <small>선택</small></label>
            <textarea id="review-note" v-model="approveForm.reviewNote" maxlength="500" placeholder="승인 검토 메모를 입력하세요." />
            <p class="modal-note">승인하면 신청 상태가 승인으로 변경되고 회원의 공인중개사 역할이 활성화됩니다.</p>
            <p v-if="modalErrorMessage" class="modal-message modal-message--error">{{ modalErrorMessage }}</p>
            <div class="modal-actions"><button type="button" class="button button--outline" :disabled="isSubmitting" @click="reviewMode = 'detail'">이전</button><button type="submit" class="button button--primary" :disabled="isSubmitting">{{ isSubmitting ? "처리 중..." : "승인" }}</button></div>
          </form>

          <div v-else class="modal-actions">
            <button type="button" class="button button--outline" :disabled="isSubmitting" @click="closeReviewModal">닫기</button>
            <template v-if="canProcessReview">
              <button type="button" class="button button--outline" @click="reviewMode = 'supplement'">보완 요청</button>
              <button type="button" class="button button--primary" @click="reviewMode = 'approve'">승인</button>
            </template>
          </div>
        </template>

        <div v-else class="modal-actions"><button type="button" class="button button--outline" @click="closeReviewModal">닫기</button></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.agent-application-list-page { width: min(100%, 1440px); margin: 0 auto; }
.page-heading p { color: #5f6875; font-size: 13px; }
.page-heading h1 { margin-top: 38px; color: #0b1220; font-size: 36px; font-weight: 900; letter-spacing: -0.04em; }
.page-heading span { display: block; margin-top: 10px; color: #667085; font-size: 14px; }
.search-panel { display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)) auto; gap: 18px; align-items: end; margin-top: 46px; padding: 28px 30px; border-radius: 12px; background: #f2f5f9; }
.search-field { min-width: 0; }
.search-field label { display: block; margin-bottom: 9px; color: #1f2937; font-size: 13px; font-weight: 800; }
.search-field input, .search-field select { box-sizing: border-box; width: 100%; height: 46px; padding: 0 14px; border: 1px solid #aeb7c4; border-radius: 6px; color: #111827; background: #fff; font-size: 14px; }
.search-field input:focus, .search-field select:focus { border-color: #2f6bff; outline: 2px solid rgba(47, 107, 255, .16); }
.search-actions { display: flex; gap: 8px; }
.button { min-width: 76px; height: 46px; padding: 0 17px; border: 1px solid #111827; border-radius: 5px; font-size: 13px; font-weight: 800; cursor: pointer; }
.button:disabled, .table-action:disabled { opacity: .6; cursor: wait; }
.button--outline { color: #111827; background: #fff; }
.button--primary { color: #fff; background: #111827; }
.result-section { margin-top: 36px; }
.result-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
.result-heading h2 { color: #111827; font-size: 20px; font-weight: 900; }
.result-heading p { color: #667085; font-size: 13px; }
.result-heading strong { color: #174ea6; }
.result-message { margin-bottom: 14px; padding: 12px 14px; border: 1px solid #efc6c2; color: #b42318; background: #fff4f2; font-size: 13px; }
.table-wrap { overflow-x: auto; border-top: 2px solid #111827; border-bottom: 1px solid #cfd5dd; }
table { width: 100%; min-width: 1280px; border-collapse: collapse; table-layout: fixed; }
th, td { padding: 15px 13px; border-bottom: 1px solid #e1e5ea; color: #313946; font-size: 13px; text-align: center; vertical-align: middle; }
th { color: #111827; background: #f7f8fa; font-weight: 800; }
tbody tr:last-child td { border-bottom: 0; }
.id-cell { color: #526071; font-variant-numeric: tabular-nums; }
.agency-name-cell { color: #111827; font-weight: 800; }
.status-badge { display: inline-flex; justify-content: center; padding: 5px 8px; border: 1px solid #cfd5dd; border-radius: 3px; color: #3d4652; background: #f4f6f8; font-size: 11px; font-weight: 800; white-space: nowrap; }
.verification-badges { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
.is-pending, .is-under-review { border-color: #ead7a9; color: #8a6411; background: #fff8e8; }
.is-approved, .is-matched { border-color: #b9dfc1; color: #237a34; background: #eef8f0; }
.is-rejected, .is-incorrect-data, .is-mismatched, .is-error { border-color: #efc6c2; color: #b42318; background: #fff2ef; }
.table-action { padding: 7px 10px; border: 1px solid #8394ad; border-radius: 4px; color: #344054; background: #fff; font-size: 12px; font-weight: 800; }
.table-message { height: 160px; color: #7a8492; }
.pagination { display: flex; justify-content: center; gap: 5px; margin-top: 26px; }
.pagination button { min-width: 38px; height: 38px; padding: 0 10px; border: 1px solid #cfd5dd; color: #374151; background: #fff; cursor: pointer; }
.pagination button.is-current { border-color: #2f6bff; color: #fff; background: #2f6bff; font-weight: 800; }
.pagination button:disabled { color: #a2a9b3; background: #f5f6f7; cursor: not-allowed; }
.modal-backdrop { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; padding: 24px; background: rgba(15, 23, 42, .48); }
.review-modal { box-sizing: border-box; width: min(820px, 100%); max-height: calc(100vh - 48px); overflow-y: auto; padding: 30px; border-radius: 12px; background: #fff; box-shadow: 0 24px 54px rgba(15, 23, 42, .28); }
.modal-heading h2 { color: #111827; font-size: 22px; font-weight: 900; }
.modal-heading p { margin: 8px 0 24px; color: #667085; font-size: 14px; line-height: 1.5; }
.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid #e1e5ea; background: #e1e5ea; }
.detail-grid div, .verification-detail-grid > div { min-width: 0; padding: 13px 14px; background: #fff; }
.detail-grid span, .verification-detail-grid span { display: block; margin-bottom: 6px; color: #667085; font-size: 12px; }
.detail-grid strong, .verification-detail-grid strong { display: block; overflow: hidden; color: #1f2937; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.detail-section { margin-top: 22px; }
.detail-section h3 { margin-bottom: 10px; color: #1f2937; font-size: 15px; font-weight: 900; }
.verification-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.verification-detail-grid > div { border: 1px solid #e1e5ea; }
.verification-detail-grid small { display: block; margin-top: 6px; color: #667085; font-size: 12px; }
.document-list { margin: 0; padding: 0; list-style: none; border-top: 1px solid #e1e5ea; }
.document-list li { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 16px; padding: 12px 4px; border-bottom: 1px solid #e1e5ea; color: #667085; font-size: 12px; }
.document-list strong { color: #1f2937; font-size: 13px; }
.empty-document-message, .modal-message { margin: 0; padding: 14px; color: #667085; background: #f4f6f8; font-size: 13px; }
.modal-message--error { border: 1px solid #efc6c2; color: #b42318; background: #fff4f2; }
.modal-note { margin: 12px 0 0; padding: 11px 12px; color: #4b5563; background: #f4f6f8; font-size: 12px; line-height: 1.55; }
.review-form { margin-top: 22px; }
.review-form label { display: block; margin-bottom: 8px; color: #1f2937; font-size: 13px; font-weight: 800; }
.review-form label small { color: #667085; font-weight: 400; }
.review-form textarea, .review-form input { box-sizing: border-box; width: 100%; margin-bottom: 18px; padding: 12px 14px; border: 1px solid #aeb7c4; border-radius: 6px; color: #111827; font: inherit; font-size: 14px; }
.review-form textarea { min-height: 108px; resize: vertical; }
.review-form input { height: 46px; }
.review-form textarea:focus, .review-form input:focus { border-color: #2f6bff; outline: 2px solid rgba(47, 107, 255, .16); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
@media (max-width: 1280px) { .search-panel { grid-template-columns: repeat(2, minmax(200px, 1fr)); } }
@media (max-width: 860px) { .page-heading h1 { margin-top: 28px; font-size: 30px; } .search-panel, .detail-grid, .verification-detail-grid { grid-template-columns: 1fr; } .search-actions { justify-content: flex-end; } .document-list li { grid-template-columns: 1fr; gap: 5px; } }
</style>
