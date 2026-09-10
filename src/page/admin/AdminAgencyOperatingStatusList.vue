<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import adminAxios from "../../api/adminAxios.js";
import agentOperatingStatus from "../../constant/agentOperatingStatus.js";

// 목록 페이지 크기
const PAGE_SIZE = 20;

// 영업 상태 선택 항목
const OPERATING_STATUS_CODES = agentOperatingStatus.agentOperatingStatusCodes;

// 검색 조건 상태
const searchForm = reactive({ agencyName: "" });
const appliedSearch = reactive({ ...searchForm });

// 영업 상태 변경 입력값
const changeForm = reactive({ operatingStatus: "ACTIVE", reason: "" });

// 목록 응답 상태
const agencies = ref([]);
const page = ref(0);
const totalElements = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);
const isChanging = ref(false);
const errorMessage = ref("");
const modalErrorMessage = ref("");
const selectedAgency = ref(null);

const visiblePages = computed(() => {
  if (totalPages.value === 0) return [];

  const groupSize = 5;
  const start = Math.floor(page.value / groupSize) * groupSize;
  const end = Math.min(start + groupSize, totalPages.value);
  return Array.from({ length: end - start }, (_, index) => start + index);
});

// 목록 조회 파라미터
const requestParams = (requestedPage) => {
  const params = { page: requestedPage, size: PAGE_SIZE };
  const agencyName = appliedSearch.agencyName.trim();

  if (agencyName) params.agencyName = agencyName;
  return params;
};

// 영업 상태 목록 조회
const fetchAgencies = async (requestedPage = 0) => {
  if (isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await adminAxios.get(
      "/api/member/admin/agencies/operating-statuses",
      { params: requestParams(requestedPage) },
    );
    const result = response.data.data;

    agencies.value = result.content;
    page.value = result.page;
    totalElements.value = result.totalElements;
    totalPages.value = result.totalPages;
  } catch {
    agencies.value = [];
    page.value = 0;
    totalElements.value = 0;
    totalPages.value = 0;
    errorMessage.value = "중개소 영업 상태 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isLoading.value = false;
  }
};

const search = () => {
  Object.assign(appliedSearch, searchForm);
  fetchAgencies(0);
};

const resetSearch = () => {
  searchForm.agencyName = "";
  appliedSearch.agencyName = "";
  fetchAgencies(0);
};

const movePage = (requestedPage) => {
  if (
    isLoading.value
    || requestedPage < 0
    || requestedPage >= totalPages.value
    || requestedPage === page.value
  ) return;

  fetchAgencies(requestedPage);
};

const openChangeModal = (agency, operatingStatus) => {
  selectedAgency.value = agency;
  changeForm.operatingStatus = operatingStatus;
  changeForm.reason = "";
  modalErrorMessage.value = "";
};

const closeChangeModal = () => {
  if (!isChanging.value) selectedAgency.value = null;
};

// 영업 상태 변경
const changeOperatingStatus = async () => {
  if (!selectedAgency.value || isChanging.value) return;

  const reason = changeForm.reason.trim();
  if (!reason) {
    modalErrorMessage.value = "영업 상태 변경 사유를 입력해 주세요.";
    return;
  }

  isChanging.value = true;
  modalErrorMessage.value = "";

  try {
    await adminAxios.patch(
      `/api/member/admin/agencies/${selectedAgency.value.agentId}/operating-status`,
      { operatingStatus: changeForm.operatingStatus, reason },
    );
    selectedAgency.value = null;
    await fetchAgencies(page.value);
  } catch (error) {
    modalErrorMessage.value = error.response?.data?.message
      || "영업 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isChanging.value = false;
  }
};

const formatStatus = (value) => agentOperatingStatus.getAgentOperatingStatusName(value);
const formatDate = (value) => value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "-";

onMounted(() => {
  fetchAgencies();
});
</script>

<template>
  <section class="agency-status-page" aria-live="polite">
    <form class="search-panel" @submit.prevent="search">
      <div class="search-field">
        <label for="agency-name">중개소명</label>
        <input
          id="agency-name"
          v-model="searchForm.agencyName"
          type="text"
          maxlength="150"
          placeholder="중개소명을 입력하세요."
        />
      </div>
      <div class="search-actions">
        <button type="button" class="button button--outline" :disabled="isLoading" @click="resetSearch">초기화</button>
        <button type="submit" class="button button--primary" :disabled="isLoading">{{ isLoading ? "검색 중..." : "검색" }}</button>
      </div>
    </form>

    <div class="result-heading">
      <div>
        <h2>중개소 영업 상태 목록</h2>
        <p>총 <strong>{{ totalElements.toLocaleString() }}</strong>건</p>
      </div>
    </div>

    <p v-if="errorMessage" class="message message--error">{{ errorMessage }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>중개사 ID</th>
            <th>중개소명</th>
            <th>영업 상태</th>
            <th>상태 변경일</th>
            <th>변경자</th>
            <th>등록 매물</th>
            <th>상태변경</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!isLoading && agencies.length === 0">
            <td colspan="7" class="table-message">조회된 중개소가 없습니다.</td>
          </tr>
          <tr v-for="agency in agencies" :key="agency.agentId">
            <td class="id-cell">{{ agency.agentId }}</td>
            <td class="agency-name-cell">{{ agency.agencyName || "-" }}</td>
            <td>
              <span class="status-badge" :class="`status-badge--${agency.operatingStatus?.toLowerCase()}`">
                {{ formatStatus(agency.operatingStatus) }}
              </span>
            </td>
            <td>{{ formatDate(agency.statusChangedAt) }}</td>
            <td>{{ agency.statusChangedBy || "-" }}</td>
            <td>{{ agency.registeredPropertyCount ?? "-" }}</td>
            <td>
              <div class="status-actions">
                <button
                  v-for="operatingStatus in OPERATING_STATUS_CODES"
                  :key="operatingStatus"
                  type="button"
                  class="table-action"
                  :class="{ 'is-current': agency.operatingStatus === operatingStatus }"
                  :disabled="agency.operatingStatus === operatingStatus"
                  @click="openChangeModal(agency, operatingStatus)"
                >
                  {{ formatStatus(operatingStatus) }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="isLoading">
            <td colspan="7" class="table-message">목록을 불러오는 중입니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="visiblePages.length > 0" class="pagination" aria-label="중개소 영업 상태 목록 페이지">
      <button type="button" :disabled="page === 0 || isLoading" @click="movePage(page - 1)">이전</button>
      <button
        v-for="visiblePage in visiblePages"
        :key="visiblePage"
        type="button"
        :class="{ 'is-current': page === visiblePage }"
        :disabled="isLoading"
        @click="movePage(visiblePage)"
      >
        {{ visiblePage + 1 }}
      </button>
      <button type="button" :disabled="page >= totalPages - 1 || isLoading" @click="movePage(page + 1)">다음</button>
    </nav>

    <div v-if="selectedAgency" class="modal-backdrop" @click.self="closeChangeModal">
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="operating-status-modal-title" @submit.prevent="changeOperatingStatus">
        <div class="modal-heading">
          <h2 id="operating-status-modal-title">영업상태 변경</h2>
          <p>{{ selectedAgency.agencyName || `중개사 ID ${selectedAgency.agentId}` }}의 영업 상태를 변경합니다.</p>
        </div>

        <label for="operating-status">영업 상태</label>
        <select id="operating-status" v-model="changeForm.operatingStatus" disabled>
          <option v-for="operatingStatus in OPERATING_STATUS_CODES" :key="operatingStatus" :value="operatingStatus">
            {{ formatStatus(operatingStatus) }}
          </option>
        </select>

        <label for="operating-status-reason">변경 사유</label>
        <textarea
          id="operating-status-reason"
          v-model="changeForm.reason"
          maxlength="500"
          required
          placeholder="영업 상태 변경 사유를 입력하세요."
        />

        <p v-if="modalErrorMessage" class="message message--error">{{ modalErrorMessage }}</p>

        <div class="modal-actions">
          <button type="button" class="button button--outline" :disabled="isChanging" @click="closeChangeModal">취소</button>
          <button type="submit" class="button button--primary" :disabled="isChanging">{{ isChanging ? "변경 중..." : "변경" }}</button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.agency-status-page { margin-top: 46px; }
.search-panel { display: flex; align-items: end; gap: 18px; padding: 28px 30px; border-radius: 12px; background: #f2f5f9; }
.search-field { width: min(360px, 100%); }
.search-field label, .modal label { display: block; color: #1f2937; font-size: 13px; font-weight: 800; }
.search-field input, .modal select, .modal textarea { box-sizing: border-box; width: 100%; margin-top: 9px; padding: 0 14px; border: 1px solid #aeb7c4; border-radius: 6px; color: #111827; background: #fff; font: inherit; font-size: 14px; }
.search-field input, .modal select { height: 46px; }
.modal textarea { min-height: 118px; padding-top: 12px; resize: vertical; }
.search-field input:focus, .modal select:focus, .modal textarea:focus { border-color: #2f6bff; outline: 2px solid rgba(47, 107, 255, .16); }
.search-actions, .modal-actions, .status-actions { display: flex; gap: 8px; }
.button { min-width: 76px; height: 46px; padding: 0 17px; border: 1px solid #111827; border-radius: 5px; font-size: 13px; font-weight: 800; cursor: pointer; }
.button:disabled { opacity: .6; cursor: wait; }
.button--outline { color: #111827; background: #fff; }
.button--primary { color: #fff; background: #111827; }
.result-heading { margin: 36px 0 15px; }
.result-heading h2 { color: #111827; font-size: 20px; font-weight: 900; }
.result-heading p { margin-top: 6px; color: #667085; font-size: 13px; }
.result-heading strong { color: #174ea6; }
.message { margin: 0 0 14px; padding: 12px 14px; font-size: 13px; }
.message--error { border: 1px solid #efc6c2; color: #b42318; background: #fff4f2; }
.table-wrap { overflow-x: auto; border-top: 2px solid #111827; border-bottom: 1px solid #cfd5dd; }
table { width: 100%; min-width: 1080px; border-collapse: collapse; table-layout: fixed; }
th, td { padding: 15px 13px; border-bottom: 1px solid #e1e5ea; color: #313946; font-size: 13px; text-align: center; vertical-align: middle; }
th { color: #111827; background: #f7f8fa; font-weight: 800; }
tbody tr:last-child td { border-bottom: 0; }
.id-cell { color: #526071; font-variant-numeric: tabular-nums; }
.agency-name-cell { color: #111827; font-weight: 800; }
.status-badge { display: inline-flex; padding: 5px 8px; border: 1px solid; border-radius: 3px; font-size: 11px; font-weight: 800; }
.status-badge--active { border-color: #b7dfc2; color: #166534; background: #effbf2; }
.status-badge--suspended { border-color: #f3d496; color: #9a6700; background: #fff7e8; }
.status-badge--closed { border-color: #efc6c2; color: #b42318; background: #fff4f2; }
.status-actions { justify-content: center; flex-wrap: wrap; }
.table-action { min-width: 54px; padding: 7px 9px; border: 1px solid #8394ad; border-radius: 4px; color: #344054; background: #fff; font-size: 12px; font-weight: 800; cursor: pointer; }
.table-action.is-current { border-color: #111827; color: #fff; background: #111827; cursor: default; }
.table-action:disabled { opacity: 1; }
.table-message { height: 160px; color: #7a8492; }
.pagination { display: flex; justify-content: center; gap: 5px; margin-top: 26px; }
.pagination button { min-width: 38px; height: 38px; padding: 0 10px; border: 1px solid #cfd5dd; color: #374151; background: #fff; cursor: pointer; }
.pagination button.is-current { border-color: #2f6bff; color: #fff; background: #2f6bff; font-weight: 800; }
.pagination button:disabled { color: #a2a9b3; background: #f5f6f7; cursor: not-allowed; }
.modal-backdrop { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; padding: 24px; background: rgba(15, 23, 42, .48); }
.modal { box-sizing: border-box; width: min(480px, 100%); max-height: calc(100vh - 48px); overflow-y: auto; padding: 30px; border-radius: 12px; background: #fff; box-shadow: 0 24px 54px rgba(15, 23, 42, .28); }
.modal-heading h2 { color: #111827; font-size: 22px; font-weight: 900; }
.modal-heading p { margin: 8px 0 24px; color: #667085; font-size: 14px; line-height: 1.5; }
.modal label + select, .modal select + label, .modal label + textarea { margin-top: 9px; }
.modal select + label { margin-top: 18px; }
.modal-actions { justify-content: flex-end; margin-top: 20px; }
@media (max-width: 860px) { .search-panel { align-items: stretch; flex-direction: column; } .search-field { width: 100%; } .search-actions { justify-content: flex-end; } }
</style>
