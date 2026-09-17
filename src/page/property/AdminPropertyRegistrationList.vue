<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import adminAxios from "../../api/adminAxios.js";
import propertyPublicationStatus from "../../constant/propertyPublicationStatus.js";
import propertyPublicState from "../../constant/propertyPublicState.js";
import propertyPublisherType from "../../constant/propertyPublisherType.js";
import propertyVerificationStatus from "../../constant/propertyVerificationStatus.js";
import { formatKoreanCurrency } from "../../util/formatter/useCurrency.js";

const PAGE_SIZE = 20;

const searchForm = reactive({
  address: "",
  publicationStatus: "",
  registeredFrom: "",
  registeredTo: "",
});
const appliedSearch = reactive({ ...searchForm });

const properties = ref([]);
const currentPage = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);
const isDetailLoading = ref(false);
const isVerifying = ref(false);
const isPublishing = ref(false);
const errorMessage = ref("");
const drawerErrorMessage = ref("");
const selectedProperty = ref(null);
const verificationReason = ref("");
const publicationReason = ref("");

const verificationCompleted = computed(() => (
  propertyVerificationStatus.isVerifiedPropertyVerificationStatus(
    selectedProperty.value?.verificationStatus,
  )
));

const canVerify = computed(() => (
  selectedProperty.value?.publicationStatus === "IN_REVIEW"
  && selectedProperty.value?.verificationStatus === "IN_REVIEW"
));

const canPublish = computed(() => (
  selectedProperty.value?.publicationStatus === "IN_REVIEW"
  && verificationCompleted.value
));

const requestParams = () => {
  const params = { page: currentPage.value, size: PAGE_SIZE };
  if (appliedSearch.address.trim()) params.address = appliedSearch.address.trim();
  if (appliedSearch.publicationStatus) params.status = appliedSearch.publicationStatus;
  if (appliedSearch.registeredFrom) params.registeredFrom = appliedSearch.registeredFrom;
  if (appliedSearch.registeredTo) params.registeredTo = appliedSearch.registeredTo;
  return params;
};

const fetchProperties = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await adminAxios.get(
      "/api/property/admin/property-publication-reviews",
      { params: requestParams() },
    );
    const result = response.data.data;

    properties.value = result.content ?? [];
    currentPage.value = result.page ?? currentPage.value;
    totalPages.value = result.totalPages ?? 0;
  } catch (error) {
    properties.value = [];
    totalPages.value = 0;
    errorMessage.value = error.response?.data?.message
      || "등록 매물 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isLoading.value = false;
  }
};

const search = () => {
  if (
    searchForm.registeredFrom
    && searchForm.registeredTo
    && dayjs(searchForm.registeredFrom).isAfter(dayjs(searchForm.registeredTo))
  ) {
    errorMessage.value = "등록기간 시작일은 종료일보다 늦을 수 없습니다.";
    return;
  }

  Object.assign(appliedSearch, searchForm);
  currentPage.value = 0;
  fetchProperties();
};

const resetSearch = () => {
  Object.keys(searchForm).forEach((key) => {
    searchForm[key] = "";
  });
  Object.assign(appliedSearch, searchForm);
  currentPage.value = 0;
  fetchProperties();
};

const movePreviousPage = () => {
  if (isLoading.value || currentPage.value === 0) return;

  currentPage.value -= 1;
  fetchProperties();
};

const moveNextPage = () => {
  if (isLoading.value || currentPage.value >= totalPages.value - 1) return;

  currentPage.value += 1;
  fetchProperties();
};

const openReview = async (property) => {
  selectedProperty.value = { ...property };
  verificationReason.value = "";
  publicationReason.value = "";
  drawerErrorMessage.value = "";
  isDetailLoading.value = true;

  try {
    const response = await adminAxios.get(
      `/api/property/admin/property-publication-reviews/${property.propertyId}`,
      { headers: { "X-Audit-Reason": "매물 등록 심사" } },
    );
    const detail = response.data.data;
    const propertyDetail = detail.property ?? {};
    const latestVerification = detail.latestVerification ?? {};

    selectedProperty.value = {
      ...property,
      ...propertyDetail,
      address: propertyDetail.address?.roadAddress || property.address,
      authorMemberId: detail.authorMemberId ?? property.authorMemberId,
      propertyVerificationId: latestVerification.verificationId,
    };
  } catch (error) {
    drawerErrorMessage.value = error.response?.data?.message
      || "매물 심사 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isDetailLoading.value = false;
  }
};

const closeReview = () => {
  if (isVerifying.value || isPublishing.value) return;
  selectedProperty.value = null;
};

const applyReviewResult = (result) => {
  if (!selectedProperty.value) return;

  selectedProperty.value = {
    ...selectedProperty.value,
    version: result.version ?? selectedProperty.value.version,
    publicationStatus: result.publicationStatus
      ?? selectedProperty.value.publicationStatus,
    verificationStatus: result.verificationStatus
      ?? selectedProperty.value.verificationStatus,
  };
};

const verifyEvidence = async () => {
  if (!selectedProperty.value || !canVerify.value || isVerifying.value) return;

  const verificationId = selectedProperty.value.propertyVerificationId
    ?? selectedProperty.value.verificationId;
  if (!verificationId) {
    drawerErrorMessage.value = "증빙 검증 신청 ID를 확인할 수 없습니다.";
    return;
  }

  isVerifying.value = true;
  drawerErrorMessage.value = "";

  try {
    const version = selectedProperty.value.version;
    const response = await adminAxios.patch(
      `/api/property/properties/${selectedProperty.value.propertyId}/verifications/${verificationId}`,
      {
        version,
        decision: "APPROVE",
        reason: verificationReason.value.trim() || null,
      },
      { headers: { "If-Match": String(version) } },
    );

    applyReviewResult(response.data.data);
  } catch (error) {
    drawerErrorMessage.value = error.response?.data?.message
      || "증빙 검증을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isVerifying.value = false;
  }
};

const approvePublication = async () => {
  if (!selectedProperty.value || !canPublish.value || isPublishing.value) return;

  const reason = publicationReason.value.trim();
  if (!reason) {
    drawerErrorMessage.value = "공개 사유를 입력해 주세요.";
    return;
  }

  isPublishing.value = true;
  drawerErrorMessage.value = "";

  try {
    const version = selectedProperty.value.version;
    const response = await adminAxios.patch(
      `/api/property/properties/${selectedProperty.value.propertyId}/publication-status`,
      { targetStatus: "PUBLISHED", version, reason },
      { headers: { "If-Match": String(version) } },
    );

    applyReviewResult(response.data.data);
    selectedProperty.value = null;
    currentPage.value = 0;
    await fetchProperties();
  } catch (error) {
    drawerErrorMessage.value = error.response?.data?.message
      || "매물을 공개 승인하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isPublishing.value = false;
  }
};

const formatDateTime = (value) => value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "-";
const formatPublicationStatus = (value) => (
  value ? propertyPublicationStatus.getPropertyPublicationStatusName(value) : "-"
);
const formatVerificationStatus = (value) => (
  value ? propertyVerificationStatus.getPropertyVerificationStatusName(value) : "-"
);
const formatPublisherType = (value) => (
  value ? propertyPublisherType.getPropertyPublisherTypeName(value) : "-"
);

const formatAddress = (property) => {
  if (typeof property.address === "string") return property.address;

  return property.publicAddress
    || property.address?.publicAddress
    || property.address?.roadAddress
    || "-";
};

const formatRegistrant = (property) => (
  property.registrantName
  || property.authorName
  || property.publisherName
  || String(property.authorMemberId ?? property.memberId ?? "-")
);

const formatTransaction = (property) => {
  if (property.transactionSummary) return property.transactionSummary;

  if (property.transactionType === "SALE") {
    return `매매 ${formatKoreanCurrency(property.salePrice)}`;
  }
  if (property.transactionType === "JEONSE") {
    return `전세 ${formatKoreanCurrency(property.deposit)}`;
  }
  if (property.transactionType === "MONTHLY_RENT") {
    return `월세 ${formatKoreanCurrency(property.deposit)} / ${formatKoreanCurrency(property.monthlyRent)}`;
  }
  return property.transactionType || "-";
};

const publicState = (property) => {
  if (property.publicState) return property.publicState;
  if (property.publicationStatus === "PUBLISHED") return "VISIBLE";
  if (
    property.publicationStatus === "IN_REVIEW"
    && property.verificationStatus === "IN_REVIEW"
  ) return "WAITING_BOTH";
  if (property.publicationStatus === "IN_REVIEW") return "WAITING_PUBLICATION";
  return "NOT_VISIBLE";
};

const formatPublicState = (value) => (
  value ? propertyPublicState.getPropertyPublicStateName(value) : "-"
);

const evidenceType = (property) => ({
  DIRECT_OWNER: "등기사항증명서",
  DIRECT_TENANT: "임대차계약서",
  AGENT_BROKERAGE: "중개사 회원 자격",
}[property?.publisherType] || "-");

const evidenceFileName = (property) => (
  property?.evidenceFileName
  || property?.verificationEvidenceFileName
  || (property?.publisherType === "AGENT_BROKERAGE" ? "-" : "제출 완료")
);

const statusClass = (value) => ({
  PUBLISHED: "is-success",
  OWNER_VERIFIED: "is-success",
  TENANT_VERIFIED: "is-success",
  AGENT_VERIFIED: "is-success",
  VERIFICATION_EXEMPT: "is-success",
  VISIBLE: "is-success",
  IN_REVIEW: "is-warning",
  WAITING_PUBLICATION: "is-warning",
  WAITING_VERIFICATION: "is-warning",
  WAITING_BOTH: "is-warning",
  REJECTED: "is-danger",
  EXPIRED: "is-danger",
  NOT_VISIBLE: "is-muted",
}[value] || "is-muted");

onMounted(() => {
  fetchProperties();
});
</script>

<template>
  <section class="property-registration-page" aria-live="polite">
    <header class="page-heading">
      <p>관리자 화면 &gt; 매물 관리 &gt; 매물 등록 관리</p>
      <h1>매물 등록 관리</h1>
      <span>등록 매물의 공개 적합성과 제출 증빙을 심사하여 승인된 매물을 공개합니다.</span>
    </header>

    <form class="search-panel" @submit.prevent="search">
      <div class="search-field search-field--address">
        <label for="property-address">주소</label>
        <input
          id="property-address"
          v-model="searchForm.address"
          type="text"
          maxlength="200"
          placeholder="주소를 입력하세요."
        />
      </div>
      <div class="search-field">
        <label for="publication-status">공개 심사</label>
        <select id="publication-status" v-model="searchForm.publicationStatus">
          <option value="">전체</option>
          <option value="IN_REVIEW">심사중</option>
          <option value="PUBLISHED">공개 승인</option>
          <option value="REJECTED">반려</option>
        </select>
      </div>
      <div class="search-field">
        <label for="registered-from">등록기간 시작일</label>
        <input id="registered-from" v-model="searchForm.registeredFrom" type="date" />
      </div>
      <div class="search-field">
        <label for="registered-to">등록기간 종료일</label>
        <input id="registered-to" v-model="searchForm.registeredTo" type="date" />
      </div>
      <div class="search-actions">
        <button type="button" class="button button--outline" :disabled="isLoading" @click="resetSearch">초기화</button>
        <button type="submit" class="button button--primary" :disabled="isLoading">{{ isLoading ? "검색 중..." : "검색" }}</button>
      </div>
    </form>

    <div class="result-heading">
      <div>
        <h2>등록 매물 목록</h2>
        <p>현재 <strong>{{ properties.length.toLocaleString() }}</strong>건</p>
      </div>
    </div>

    <p v-if="errorMessage" class="message message--error">{{ errorMessage }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>등록일시</th>
            <th>매물 ID</th>
            <th class="address-column">주소</th>
            <th>거래·금액</th>
            <th>등록자</th>
            <th>등록 유형</th>
            <th>공개 심사</th>
            <th>증빙 검증</th>
            <th>공개 상태</th>
            <th>처리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="10" class="table-message">등록 매물 목록을 불러오는 중입니다.</td>
          </tr>
          <tr v-else-if="properties.length === 0">
            <td colspan="10" class="table-message">검색 결과가 없습니다.</td>
          </tr>
          <tr v-for="property in properties" v-else :key="property.propertyId">
            <td>{{ formatDateTime(property.registeredAt ?? property.createdAt) }}</td>
            <td class="id-cell">{{ property.propertyId }}</td>
            <td class="address-cell">{{ formatAddress(property) }}</td>
            <td>{{ formatTransaction(property) }}</td>
            <td>{{ formatRegistrant(property) }}</td>
            <td>{{ formatPublisherType(property.publisherType) }}</td>
            <td><span class="status-badge" :class="statusClass(property.publicationStatus)">{{ formatPublicationStatus(property.publicationStatus) }}</span></td>
            <td><span class="status-badge" :class="statusClass(property.verificationStatus)">{{ formatVerificationStatus(property.verificationStatus) }}</span></td>
            <td><span class="status-badge" :class="statusClass(publicState(property))">{{ formatPublicState(publicState(property)) }}</span></td>
            <td>
              <button
                v-if="property.publicationStatus === 'IN_REVIEW'"
                type="button"
                class="table-action"
                @click="openReview(property)"
              >
                심사
              </button>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="totalPages > 1" class="pagination" aria-label="등록 매물 목록 페이지">
      <button type="button" :disabled="currentPage === 0 || isLoading" @click="movePreviousPage">이전</button>
      <span class="current-page">{{ currentPage + 1 }} / {{ totalPages }}</span>
      <button type="button" :disabled="currentPage >= totalPages - 1 || isLoading" @click="moveNextPage">다음</button>
    </nav>

    <div v-if="selectedProperty" class="drawer-backdrop" @click.self="closeReview">
      <section class="review-drawer" role="dialog" aria-modal="true" aria-labelledby="property-review-title">
        <header class="drawer-heading">
          <div>
            <h2 id="property-review-title">매물 등록 심사</h2>
            <p>{{ selectedProperty.propertyId }} · {{ formatAddress(selectedProperty) }}</p>
          </div>
          <button type="button" class="drawer-close" aria-label="닫기" :disabled="isVerifying || isPublishing" @click="closeReview">×</button>
        </header>

        <p v-if="isDetailLoading" class="drawer-loading">심사 상세를 불러오는 중입니다.</p>

        <template v-else>
        <div class="public-state-hero">
          <span>공개 상태</span>
          <strong class="status-badge" :class="statusClass(publicState(selectedProperty))">
            {{ formatPublicState(publicState(selectedProperty)) }}
          </strong>
        </div>

        <dl class="detail-grid">
          <div><dt>매물 ID</dt><dd>{{ selectedProperty.propertyId }}</dd></div>
          <div><dt>등록일시</dt><dd>{{ formatDateTime(selectedProperty.registeredAt ?? selectedProperty.createdAt) }}</dd></div>
          <div><dt>주소</dt><dd>{{ formatAddress(selectedProperty) }}</dd></div>
          <div><dt>거래·금액</dt><dd>{{ formatTransaction(selectedProperty) }}</dd></div>
          <div><dt>등록자</dt><dd>{{ formatRegistrant(selectedProperty) }}</dd></div>
          <div><dt>등록 유형</dt><dd>{{ formatPublisherType(selectedProperty.publisherType) }}</dd></div>
        </dl>

        <section class="review-section">
          <div class="review-section__heading">
            <div><span>증빙 심사</span><h3>증빙 검증 항목</h3></div>
            <strong class="status-badge" :class="statusClass(selectedProperty.verificationStatus)">{{ formatVerificationStatus(selectedProperty.verificationStatus) }}</strong>
          </div>
          <dl class="evidence-summary">
            <div><dt>증빙 유형</dt><dd>{{ evidenceType(selectedProperty) }}</dd></div>
            <div><dt>제출 파일</dt><dd>{{ evidenceFileName(selectedProperty) }}</dd></div>
          </dl>
          <ul class="review-check-list">
            <li>신청자와 매물 등록자 정보 일치</li>
            <li>증빙 문서와 매물 주소 정보 일치</li>
            <li>증빙 문서의 유효성과 식별 가능 여부</li>
          </ul>
          <label for="verification-reason">증빙 사유 <span>(선택)</span></label>
          <textarea
            id="verification-reason"
            v-model="verificationReason"
            maxlength="1000"
            :disabled="!canVerify || isVerifying"
            placeholder="증빙 검증 사유를 입력하세요."
          />
          <div class="section-actions">
            <small>{{ selectedProperty.publisherType === "AGENT_BROKERAGE" ? "승인된 중개사 회원은 매물별 증빙 검증에서 제외합니다." : "증빙 항목과 제출 내용을 확인한 후 검증 처리합니다." }}</small>
            <button type="button" class="button button--primary" :disabled="!canVerify || isVerifying" @click="verifyEvidence">
              {{ isVerifying ? "검증 중..." : "검증" }}
            </button>
          </div>
        </section>

        <section class="review-section">
          <div class="review-section__heading">
            <div><span>공개 심사</span><h3>공개 심사 항목</h3></div>
            <strong class="status-badge" :class="statusClass(selectedProperty.publicationStatus)">{{ formatPublicationStatus(selectedProperty.publicationStatus) }}</strong>
          </div>
          <ul class="review-check-list">
            <li>주소·가격·면적 정보 확인</li>
            <li>제목·설명 공개 적합성 확인</li>
            <li>매물 이미지 적합성 확인</li>
            <li>중복·허위 의심 정보 확인</li>
          </ul>
          <label for="publication-reason">공개 사유 <strong class="required-mark">*</strong></label>
          <textarea
            id="publication-reason"
            v-model="publicationReason"
            maxlength="200"
            required
            :disabled="!canPublish || isPublishing"
            placeholder="공개 승인 사유를 입력하세요."
          />
          <div class="section-actions">
            <small>{{ verificationCompleted ? "증빙 검증 조건을 충족하여 공개 승인할 수 있습니다." : "증빙 검증 완료 후 공개 승인할 수 있습니다." }}</small>
            <button type="button" class="button button--primary" :disabled="!canPublish || isPublishing" @click="approvePublication">
              {{ isPublishing ? "승인 중..." : "공개 승인" }}
            </button>
          </div>
        </section>

        <p v-if="drawerErrorMessage" class="message message--error drawer-message">{{ drawerErrorMessage }}</p>
        </template>
      </section>
    </div>
  </section>
</template>

<style scoped>
.property-registration-page {
  width: min(100%, 1500px);
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
  letter-spacing: -.04em;
}
.page-heading span {
  display: block;
  margin-top: 10px;
  color: #667085;
  font-size: 14px;
}
.search-panel {
  display: grid;
  grid-template-columns: minmax(250px, 1.4fr) minmax(150px, .8fr) repeat(2, minmax(160px, .8fr)) auto;
  gap: 14px;
  align-items: end;
  margin-top: 46px;
  padding: 28px 30px;
  border-radius: 12px;
  background: #f2f5f9;
}
.search-field {
  min-width: 0;
}
.search-field label, .review-section label {
  display: block;
  color: #1f2937;
  font-size: 13px;
  font-weight: 800;
}
.search-field input, .search-field select, .review-section textarea {
  box-sizing: border-box;
  width: 100%;
  margin-top: 9px;
  border: 1px solid #aeb7c4;
  border-radius: 6px;
  color: #111827;
  background: #fff;
  font: inherit;
  font-size: 14px;
}
.search-field input, .search-field select {
  height: 46px;
  padding: 0 14px;
}
.search-field input:focus, .search-field select:focus, .review-section textarea:focus {
  border-color: #2f6bff;
  outline: 2px solid rgba(47, 107, 255, .16);
}
.search-actions, .section-actions {
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
  opacity: .5;
  cursor: not-allowed;
}
.button--outline {
  color: #111827;
  background: #fff;
}
.button--primary {
  color: #fff;
  background: #111827;
}
.result-heading {
  margin: 36px 0 15px;
}
.result-heading h2 {
  color: #111827;
  font-size: 20px;
  font-weight: 900;
}
.result-heading p {
  margin-top: 6px;
  color: #667085;
  font-size: 13px;
}
.result-heading strong {
  color: #174ea6;
}
.message {
  margin: 0 0 14px;
  padding: 12px 14px;
  font-size: 13px;
}
.message--error {
  border: 1px solid #efc6c2;
  color: #b42318;
  background: #fff4f2;
}
.table-wrap {
  overflow-x: auto;
  border-top: 2px solid #111827;
  border-bottom: 1px solid #cfd5dd;
}
table {
  width: 100%;
  min-width: 1380px;
  border-collapse: collapse;
  table-layout: fixed;
}
th, td {
  padding: 15px 11px;
  border-bottom: 1px solid #e1e5ea;
  color: #313946;
  font-size: 12px;
  text-align: center;
  vertical-align: middle;
}
th {
  color: #111827;
  background: #f7f8fa;
  font-weight: 800;
}
.address-column {
  width: 190px;
}
.address-cell {
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.id-cell {
  color: #526071;
  font-variant-numeric: tabular-nums;
}
.status-badge {
  display: inline-flex;
  justify-content: center;
  padding: 5px 8px;
  border: 1px solid #cfd5dd;
  border-radius: 3px;
  color: #3d4652;
  background: #f4f6f8;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}
.status-badge.is-success {
  border-color: #b7dfc2;
  color: #166534;
  background: #effbf2;
}
.status-badge.is-warning {
  border-color: #f3d496;
  color: #9a6700;
  background: #fff7e8;
}
.status-badge.is-danger {
  border-color: #efc6c2;
  color: #b42318;
  background: #fff4f2;
}
.status-badge.is-muted {
  color: #667085;
  background: #f4f6f8;
}
.table-action {
  padding: 7px 11px;
  border: 1px solid #111827;
  border-radius: 4px;
  color: #fff;
  background: #111827;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
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
.pagination button, .current-page {
  min-width: 38px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #cfd5dd;
  color: #374151;
  background: #fff;
  cursor: pointer;
}
.current-page {
  display: inline-grid;
  place-items: center;
  border-color: #2f6bff;
  color: #fff;
  background: #2f6bff;
  font-weight: 800;
}
.pagination button:disabled {
  color: #a2a9b3;
  background: #f5f6f7;
  cursor: not-allowed;
}
.drawer-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  background: rgba(15, 23, 42, .48);
}
.review-drawer {
  position: absolute;
  top: 0;
  right: 0;
  box-sizing: border-box;
  width: min(620px, 100vw);
  height: 100%;
  overflow-y: auto;
  padding: 30px;
  background: #fff;
  box-shadow: -18px 0 42px rgba(15, 23, 42, .24);
}
.drawer-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 17px;
  border-bottom: 1px solid #d8dde5;
}
.drawer-heading h2 {
  color: #111827;
  font-size: 22px;
  font-weight: 900;
}
.drawer-heading p {
  margin-top: 7px;
  color: #667085;
  font-size: 13px;
}
.drawer-close {
  border: 0;
  color: #344054;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}
.public-state-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  padding: 16px;
  border: 2px solid #111827;
  border-radius: 9px;
  background: #f8fafc;
}
.public-state-hero > span {
  color: #475467;
  font-size: 13px;
  font-weight: 800;
}
.public-state-hero .status-badge {
  padding: 7px 11px;
  font-size: 13px;
}
.detail-grid, .evidence-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 16px;
  border-top: 1px solid #d8dde5;
}
.detail-grid div, .evidence-summary div {
  min-width: 0;
  padding: 12px 8px;
  border-bottom: 1px solid #e1e5ea;
}
.detail-grid dt, .evidence-summary dt {
  margin-bottom: 5px;
  color: #667085;
  font-size: 11px;
}
.detail-grid dd, .evidence-summary dd {
  overflow: hidden;
  margin: 0;
  color: #1f2937;
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.review-section {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid #d8dde5;
  border-radius: 10px;
}
.review-section__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.review-section__heading span {
  display: block;
  margin-bottom: 3px;
  color: #667085;
  font-size: 11px;
}
.review-section__heading h3 {
  color: #111827;
  font-size: 16px;
}
.review-check-list {
  margin: 14px 0 18px;
  padding: 0;
  list-style: none;
}
.review-check-list li {
  padding: 10px 0;
  border-top: 1px solid #eceff2;
  color: #344054;
  font-size: 13px;
}
.review-check-list li::before {
  margin-right: 8px;
  color: #166534;
  content: "✓";
  font-weight: 900;
}
.review-section label span {
  color: #667085;
  font-weight: 500;
}
.review-section textarea {
  min-height: 88px;
  padding: 11px 12px;
  resize: vertical;
}
.review-section textarea:disabled {
  color: #7a8492;
  background: #f1f3f5;
}
.required-mark {
  color: #b42318;
}
.section-actions {
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e1e5ea;
}
.section-actions small {
  max-width: 340px;
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
}
.drawer-message {
  margin-top: 16px;
}
.drawer-loading {
  padding: 42px 0;
  color: #667085;
  text-align: center;
}
@media (max-width: 1320px) {
  .search-panel {
    grid-template-columns: repeat(2, minmax(190px, 1fr));
  }
  .search-actions {
    justify-content: flex-end;
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
  .review-drawer {
    width: 100vw;
    padding: 24px;
  }
  .detail-grid, .evidence-summary {
    grid-template-columns: 1fr;
  }
  .section-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
