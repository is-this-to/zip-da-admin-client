<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import adminAxios from "../../api/adminAxios.js";
import agentOperatingStatus from "../../constant/agentOperatingStatus.js";

const PAGE_SIZE = 20;

const searchForm = reactive({
  agencyName: "",
  representativeName: "",
  businessRegistrationNo: "",
});

const appliedSearch = reactive({
  agencyName: "",
  representativeName: "",
  businessRegistrationNo: "",
});

const agencies = ref([]);
const page = ref(0);
const totalElements = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);
const errorMessage = ref("");

const visiblePages = computed(() => {
  if (totalPages.value === 0) return [];

  const pageGroupSize = 5;
  const start = Math.floor(page.value / pageGroupSize) * pageGroupSize;
  const end = Math.min(start + pageGroupSize, totalPages.value);

  return Array.from({ length: end - start }, (_, index) => start + index);
});

const requestParams = (requestedPage) => {
  const params = {
    page: requestedPage,
    size: PAGE_SIZE,
  };

  Object.entries(appliedSearch).forEach(([key, value]) => {
    const normalizedValue = value.trim();

    if (normalizedValue) {
      params[key] = normalizedValue;
    }
  });

  return params;
};

const fetchAgencies = async (requestedPage = 0) => {
  if (isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await adminAxios.get("/api/member/admin/agencies", {
      params: requestParams(requestedPage),
    });
    const result = response.data.data;

    agencies.value = result.content;
    page.value = result.page;
    totalElements.value = result.totalElements;
    totalPages.value = result.totalPages;
  } catch {
    agencies.value = [];
    totalElements.value = 0;
    totalPages.value = 0;
    errorMessage.value = "중개소 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isLoading.value = false;
  }
};

const search = () => {
  Object.assign(appliedSearch, searchForm);
  fetchAgencies(0);
};

const resetSearch = () => {
  Object.keys(searchForm).forEach((key) => {
    searchForm[key] = "";
  });
  Object.assign(appliedSearch, searchForm);
  fetchAgencies(0);
};

const movePage = (requestedPage) => {
  if (
    isLoading.value ||
    requestedPage < 0 ||
    requestedPage >= totalPages.value ||
    requestedPage === page.value
  ) {
    return;
  }

  fetchAgencies(requestedPage);
};

const formatApprovedAt = (approvedAt) => {
  return approvedAt ? dayjs(approvedAt).format("YYYY-MM-DD HH:mm") : "-";
};

const statusClass = (status) => {
  return {
    ACTIVE: "is-active",
    SUSPENDED: "is-suspended",
    CLOSED: "is-closed",
  }[status];
};

onMounted(() => {
  fetchAgencies();
});
</script>

<template>
  <div class="agency-list-page">
    <header class="page-heading">
      <p>관리자 화면 &gt; 중개소 관리 &gt; 중개소 검색·조회</p>
      <h1>중개소 검색·조회</h1>
      <span>승인된 공인중개사 프로필의 중개소 정보와 영업 상태를 조회합니다.</span>
    </header>

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

      <div class="search-field">
        <label for="representative-name">대표자명</label>
        <input
          id="representative-name"
          v-model="searchForm.representativeName"
          type="text"
          maxlength="50"
          placeholder="대표자명을 입력하세요."
        />
      </div>

      <div class="search-field">
        <label for="business-registration-no">사업자번호</label>
        <input
          id="business-registration-no"
          v-model="searchForm.businessRegistrationNo"
          type="text"
          maxlength="50"
          placeholder="사업자번호를 입력하세요."
        />
      </div>

      <div class="search-actions">
        <button
          type="button"
          class="button button--outline"
          :disabled="isLoading"
          @click="resetSearch"
        >
          초기화
        </button>
        <button type="submit" class="button button--primary" :disabled="isLoading">
          {{ isLoading ? "검색 중..." : "검색" }}
        </button>
      </div>
    </form>

    <section class="result-section" aria-live="polite">
      <div class="result-heading">
        <h2>중개소 목록</h2>
        <p>총 <strong>{{ totalElements.toLocaleString() }}</strong>건</p>
      </div>

      <div v-if="errorMessage" class="result-message result-message--error">
        {{ errorMessage }}
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>중개사 ID</th>
              <th>중개소명</th>
              <th>대표자명</th>
              <th>사업자번호</th>
              <th>주소</th>
              <th>영업 상태</th>
              <th>승인일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="7" class="table-message">중개소 목록을 불러오는 중입니다.</td>
            </tr>
            <tr v-else-if="agencies.length === 0">
              <td colspan="7" class="table-message">검색 결과가 없습니다.</td>
            </tr>
            <tr v-for="agency in agencies" v-else :key="agency.agentId">
              <td class="id-cell">{{ agency.agentId }}</td>
              <td class="agency-name-cell">{{ agency.agencyName }}</td>
              <td>{{ agency.representativeName }}</td>
              <td>{{ agency.businessRegistrationNo }}</td>
              <td class="address-cell">{{ agency.address }}</td>
              <td>
                <span class="status-badge" :class="statusClass(agency.operatingStatus)">
                  {{ agentOperatingStatus.getAgentOperatingStatusName(agency.operatingStatus) }}
                </span>
              </td>
              <td>{{ formatApprovedAt(agency.approvedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="totalPages > 1" class="pagination" aria-label="중개소 목록 페이지">
        <button type="button" :disabled="page === 0 || isLoading" @click="movePage(page - 1)">
          이전
        </button>
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
        <button
          type="button"
          :disabled="page >= totalPages - 1 || isLoading"
          @click="movePage(page + 1)"
        >
          다음
        </button>
      </nav>
    </section>
  </div>
</template>

<style scoped>
.agency-list-page {
  width: min(100%, 1280px);
  margin: 0 auto;
}

.page-heading p {
  color: #5f6875;
  font-size: 13px;
}

.page-heading h1 {
  margin-top: 38px;
  color: #0b1220;
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.page-heading span {
  display: block;
  margin-top: 10px;
  color: #667085;
  font-size: 14px;
}

.search-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(170px, 1fr)) auto;
  gap: 18px;
  align-items: end;
  margin-top: 46px;
  padding: 28px 30px;
  border-radius: 12px;
  background: #f2f5f9;
}

.search-field {
  min-width: 0;
}

.search-field label {
  display: block;
  margin-bottom: 9px;
  color: #1f2937;
  font-size: 13px;
  font-weight: 800;
}

.search-field input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border: 1px solid #aeb7c4;
  border-radius: 6px;
  color: #111827;
  background: #ffffff;
  font-size: 14px;
}

.search-field input:focus {
  border-color: #2f6bff;
  outline: 2px solid rgba(47, 107, 255, 0.16);
}

.search-actions {
  display: flex;
  gap: 8px;
}

.button {
  min-width: 76px;
  height: 46px;
  padding: 0 17px;
  border: 1px solid #111827;
  border-radius: 5px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.button--outline {
  color: #111827;
  background: #ffffff;
}

.button--primary {
  color: #ffffff;
  background: #111827;
}

.result-section {
  margin-top: 36px;
}

.result-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.result-heading h2 {
  color: #111827;
  font-size: 20px;
  font-weight: 900;
}

.result-heading p {
  color: #667085;
  font-size: 13px;
}

.result-heading strong {
  color: #174ea6;
}

.result-message {
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid #efc6c2;
  color: #b42318;
  background: #fff4f2;
  font-size: 13px;
}

.table-wrap {
  overflow-x: auto;
  border-top: 2px solid #111827;
  border-bottom: 1px solid #cfd5dd;
}

table {
  width: 100%;
  min-width: 1040px;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  padding: 15px 13px;
  border-bottom: 1px solid #e1e5ea;
  color: #313946;
  font-size: 13px;
  text-align: center;
  vertical-align: middle;
}

th {
  color: #111827;
  background: #f7f8fa;
  font-weight: 800;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.id-cell {
  color: #526071;
  font-variant-numeric: tabular-nums;
}

.agency-name-cell {
  color: #111827;
  font-weight: 800;
}

.address-cell {
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  min-width: 54px;
  justify-content: center;
  padding: 5px 8px;
  border: 1px solid #cfd5dd;
  border-radius: 3px;
  color: #3d4652;
  background: #f4f6f8;
  font-size: 11px;
  font-weight: 800;
}

.status-badge.is-active {
  border-color: #b9dfc1;
  color: #237a34;
  background: #eef8f0;
}

.status-badge.is-suspended {
  border-color: #ead7a9;
  color: #8a6411;
  background: #fff8e8;
}

.status-badge.is-closed {
  border-color: #efc6c2;
  color: #b42318;
  background: #fff2ef;
}

.table-message {
  height: 160px;
  color: #7a8492;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-top: 26px;
}

.pagination button {
  min-width: 38px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #cfd5dd;
  color: #374151;
  background: #ffffff;
  cursor: pointer;
}

.pagination button.is-current {
  border-color: #2f6bff;
  color: #ffffff;
  background: #2f6bff;
  font-weight: 800;
}

.pagination button:disabled {
  color: #a2a9b3;
  background: #f5f6f7;
  cursor: not-allowed;
}

@media (max-width: 1180px) {
  .search-panel {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 860px) {
  .page-heading h1 {
    margin-top: 28px;
    font-size: 30px;
  }

  .search-panel {
    grid-template-columns: 1fr;
  }

  .search-actions {
    justify-content: flex-end;
  }
}
</style>
