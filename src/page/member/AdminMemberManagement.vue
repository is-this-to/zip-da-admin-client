<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import adminAxios from "../../api/adminAxios.js";
import memberRolePolicy from "../../constant/memberRolePolicy.js";
import memberSanctionScope from "../../constant/memberSanctionScope.js";
import memberStatus from "../../constant/memberStatus.js";
import memberSuspensionReasonCode from "../../constant/memberSuspensionReasonCode.js";

// 목록 페이지 크기
const PAGE_SIZE = 20;

// 검색 조건 상태
const searchForm = reactive({ email: "", nickname: "" });
const appliedSearch = reactive({ ...searchForm });

// 회원 제재 입력값
const sanctionForm = reactive({
  scope: "ACCOUNT",
  reasonCode: "FALSE_PROPERTY_REPEAT",
  startAt: "",
  endAt: "",
});

// 정지 해제 입력값
const releaseForm = reactive({ releaseReason: "" });

// 목록 응답 상태
const members = ref([]);
const page = ref(0);
const totalElements = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);
const isSubmitting = ref(false);
const isHistoryLoading = ref(false);
const errorMessage = ref("");
const modalErrorMessage = ref("");
const selectedMember = ref(null);
const modalType = ref("");
const sanctionHistories = ref([]);
const selectedHistory = ref(null);
const isPermanentSanction = ref(false);

const sanctionScopeOptions = computed(() => (
  memberSanctionScope.memberSanctionScopeCodes.map((code) => ({
    code,
    name: memberSanctionScope.getMemberSanctionScopeName(code),
  }))
));

const reasonCodeOptions = computed(() => (
  memberSuspensionReasonCode.memberSuspensionReasonCodes.map((code) => ({
    code,
    name: memberSuspensionReasonCode.getMemberSuspensionReasonCodeName(code),
  }))
));

const visiblePages = computed(() => {
  if (totalPages.value === 0) return [];

  const groupSize = 5;
  const start = Math.floor(page.value / groupSize) * groupSize;
  const end = Math.min(start + groupSize, totalPages.value);
  return Array.from({ length: end - start }, (_, index) => start + index);
});

const historyModalTitle = computed(() => (
  modalType.value === "sanction" ? "회원제재 상세" : "회원변경이력"
));

// 목록 조회 파라미터
const requestParams = (requestedPage) => {
  const params = { page: requestedPage, size: PAGE_SIZE };

  Object.entries(appliedSearch).forEach(([key, value]) => {
    const normalizedValue = value.trim();
    if (normalizedValue) params[key] = normalizedValue;
  });

  return params;
};

// 회원 관리 목록 조회
const fetchMembers = async (requestedPage = 0) => {
  if (isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await adminAxios.get("/api/member/admin/members", {
      params: requestParams(requestedPage),
    });
    const result = response.data.data;

    members.value = result.content;
    page.value = result.page;
    totalElements.value = result.totalElements;
    totalPages.value = result.totalPages;
  } catch {
    members.value = [];
    page.value = 0;
    totalElements.value = 0;
    totalPages.value = 0;
    errorMessage.value = "회원 관리 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isLoading.value = false;
  }
};

const search = () => {
  Object.assign(appliedSearch, searchForm);
  fetchMembers(0);
};

const resetSearch = () => {
  searchForm.email = "";
  searchForm.nickname = "";
  Object.assign(appliedSearch, searchForm);
  fetchMembers(0);
};

const movePage = (requestedPage) => {
  if (
    isLoading.value
    || requestedPage < 0
    || requestedPage >= totalPages.value
    || requestedPage === page.value
  ) return;

  fetchMembers(requestedPage);
};

// 제재 이력 조회
const fetchSanctionHistories = async (memberId) => {
  isHistoryLoading.value = true;

  try {
    const response = await adminAxios.get(
      `/api/member/admin/members/${memberId}/sanction-histories`,
    );
    sanctionHistories.value = response.data.data.histories || [];
  } catch (error) {
    sanctionHistories.value = [];
    modalErrorMessage.value = error.response?.data?.message
      || "회원 변경 이력을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isHistoryLoading.value = false;
  }
};

const resetSanctionForm = () => {
  sanctionForm.scope = "ACCOUNT";
  sanctionForm.reasonCode = "FALSE_PROPERTY_REPEAT";
  sanctionForm.startAt = dayjs().format("YYYY-MM-DDTHH:mm");
  sanctionForm.endAt = "";
  isPermanentSanction.value = false;
};

const openSanctionModal = async (member) => {
  selectedMember.value = member;
  modalType.value = "sanction";
  modalErrorMessage.value = "";
  selectedHistory.value = null;
  releaseForm.releaseReason = "";
  resetSanctionForm();
  await fetchSanctionHistories(member.memberId);
};

const openHistoryModal = async (member) => {
  selectedMember.value = member;
  modalType.value = "history";
  modalErrorMessage.value = "";
  selectedHistory.value = null;
  await fetchSanctionHistories(member.memberId);
};

const closeModal = () => {
  if (isSubmitting.value) return;

  selectedMember.value = null;
  modalType.value = "";
  sanctionHistories.value = [];
  selectedHistory.value = null;
  modalErrorMessage.value = "";
};

const selectHistory = (history) => {
  selectedHistory.value = history;
  releaseForm.releaseReason = "";
  modalErrorMessage.value = "";
};

const toApiDateTime = (value) => (
  value && value.length === 16 ? `${value}:00` : value || null
);

// 회원 제재 처리
const submitSanction = async () => {
  if (!selectedMember.value || isSubmitting.value) return;

  if (!sanctionForm.startAt) {
    modalErrorMessage.value = "제재 시작일시를 입력해 주세요.";
    return;
  }
  if (!isPermanentSanction.value && !sanctionForm.endAt) {
    modalErrorMessage.value = "기간 정지의 종료일시를 입력해 주세요.";
    return;
  }
  if (
    !isPermanentSanction.value
    && !dayjs(sanctionForm.endAt).isAfter(dayjs(sanctionForm.startAt))
  ) {
    modalErrorMessage.value = "제재 종료일시는 시작일시보다 이후여야 합니다.";
    return;
  }

  isSubmitting.value = true;
  modalErrorMessage.value = "";

  try {
    await adminAxios.post(
      `/api/member/admin/members/${selectedMember.value.memberId}/sanctions`,
      {
        scope: sanctionForm.scope,
        reasonCode: sanctionForm.reasonCode,
        startAt: toApiDateTime(sanctionForm.startAt),
        endAt: isPermanentSanction.value ? null : toApiDateTime(sanctionForm.endAt),
      },
    );
    await fetchSanctionHistories(selectedMember.value.memberId);
    await fetchMembers(page.value);
    resetSanctionForm();
  } catch (error) {
    modalErrorMessage.value = error.response?.data?.message
      || "회원 제재를 처리하지 못했습니다. 입력값을 확인해 주세요.";
  } finally {
    isSubmitting.value = false;
  }
};

const canRelease = (history) => (
  history.historyType === "SANCTION" && !history.releasedAt
);

// 회원 제재 해제 처리
const releaseSanction = async () => {
  if (!selectedHistory.value || isSubmitting.value) return;

  const releaseReason = releaseForm.releaseReason.trim();
  if (!releaseReason) {
    modalErrorMessage.value = "정지 해제 사유를 입력해 주세요.";
    return;
  }

  isSubmitting.value = true;
  modalErrorMessage.value = "";

  try {
    await adminAxios.patch(
      `/api/member/admin/members/sanctions/${selectedHistory.value.sanctionId}/release`,
      { releaseReason },
    );
    selectedHistory.value = null;
    releaseForm.releaseReason = "";
    await fetchSanctionHistories(selectedMember.value.memberId);
    await fetchMembers(page.value);
  } catch (error) {
    modalErrorMessage.value = error.response?.data?.message
      || "회원 제재를 해제하지 못했습니다. 입력값을 확인해 주세요.";
  } finally {
    isSubmitting.value = false;
  }
};

const formatDateTime = (value) => value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "-";
const formatStatus = (value) => memberStatus.getMemberStatusName(value);
const formatRole = (value) => memberRolePolicy.getMemberRolePolicyName(value);
const formatScope = (value) => memberSanctionScope.getMemberSanctionScopeName(value);
const formatReasonCode = (value) => memberSuspensionReasonCode.getMemberSuspensionReasonCodeName(value);
const formatHistoryType = (value) => ({ SANCTION: "제재", RELEASE: "해제" }[value] || value);
const formatChangedBy = (history) => {
  const role = history.changedByRoleCode ? ` · ${history.changedByRoleCode}` : "";
  return history.changedByName ? `${history.changedByName}${role}` : "-";
};

onMounted(() => {
  fetchMembers();
});
</script>

<template>
  <section class="member-management-page" aria-live="polite">
    <header class="page-heading">
      <p>관리자 화면 &gt; 회원 관리 &gt; 회원 관리</p>
      <h1>회원 관리</h1>
      <span>회원 상태를 확인하고 제재 상세와 회원 변경 이력을 조회합니다.</span>
    </header>

    <form class="search-panel" @submit.prevent="search">
      <div class="search-field">
        <label for="member-email">이메일</label>
        <input id="member-email" v-model="searchForm.email" type="text" maxlength="255" placeholder="이메일을 입력하세요." />
      </div>
      <div class="search-field">
        <label for="member-nickname">닉네임</label>
        <input id="member-nickname" v-model="searchForm.nickname" type="text" maxlength="100" placeholder="닉네임을 입력하세요." />
      </div>
      <div class="search-actions">
        <button type="button" class="button button--outline" :disabled="isLoading" @click="resetSearch">초기화</button>
        <button type="submit" class="button button--primary" :disabled="isLoading">{{ isLoading ? "검색 중..." : "검색" }}</button>
      </div>
    </form>

    <div class="result-heading">
      <div>
        <h2>회원 관리 목록</h2>
        <p>총 <strong>{{ totalElements.toLocaleString() }}</strong>건</p>
      </div>
    </div>

    <p v-if="errorMessage" class="message message--error">{{ errorMessage }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>회원 ID</th>
            <th>이메일</th>
            <th>닉네임</th>
            <th>역할</th>
            <th>상태</th>
            <th>회원제재</th>
            <th>변경이력</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading"><td colspan="7" class="table-message">회원 관리 목록을 불러오는 중입니다.</td></tr>
          <tr v-else-if="members.length === 0"><td colspan="7" class="table-message">검색 결과가 없습니다.</td></tr>
          <tr v-for="member in members" v-else :key="member.memberId">
            <td class="id-cell">{{ member.memberId }}</td>
            <td>{{ member.email || "-" }}</td>
            <td class="nickname-cell">{{ member.nickname || "-" }}</td>
            <td><span class="role-badge">{{ formatRole(member.role) }}</span></td>
            <td><span class="status-badge" :class="`status-badge--${member.status?.toLowerCase()}`">{{ formatStatus(member.status) }}</span></td>
            <td><button type="button" class="table-action" @click="openSanctionModal(member)">회원정지</button></td>
            <td><button type="button" class="table-action" @click="openHistoryModal(member)">상세</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="visiblePages.length > 0" class="pagination" aria-label="회원 관리 목록 페이지">
      <button type="button" :disabled="page === 0 || isLoading" @click="movePage(page - 1)">이전</button>
      <button v-for="visiblePage in visiblePages" :key="visiblePage" type="button" :class="{ 'is-current': page === visiblePage }" :disabled="isLoading" @click="movePage(visiblePage)">{{ visiblePage + 1 }}</button>
      <button type="button" :disabled="page >= totalPages - 1 || isLoading" @click="movePage(page + 1)">다음</button>
    </nav>

    <div v-if="selectedMember" class="modal-backdrop" @click.self="closeModal">
      <section class="member-modal" role="dialog" aria-modal="true" :aria-labelledby="`${modalType}-modal-title`">
        <header class="modal-heading">
          <h2 :id="`${modalType}-modal-title`">{{ historyModalTitle }}</h2>
          <p>{{ selectedMember.memberId }} · {{ selectedMember.email }} · {{ selectedMember.nickname || "-" }}</p>
        </header>

        <p v-if="isHistoryLoading" class="modal-message">회원 제재 이력을 불러오는 중입니다.</p>
        <template v-else>
          <template v-if="modalType === 'sanction'">
            <div class="member-detail-grid">
              <div><span>회원 ID</span><strong>{{ selectedMember.memberId }}</strong></div>
              <div><span>현재 상태</span><strong>{{ formatStatus(selectedMember.status) }}</strong></div>
              <div><span>이메일</span><strong>{{ selectedMember.email }}</strong></div>
              <div><span>역할</span><strong>{{ formatRole(selectedMember.role) }}</strong></div>
            </div>

            <form class="sanction-form" @submit.prevent="submitSanction">
              <label for="sanction-scope">제재범위</label>
              <select id="sanction-scope" v-model="sanctionForm.scope">
                <option v-for="scope in sanctionScopeOptions" :key="scope.code" :value="scope.code">{{ scope.name }}</option>
              </select>

              <fieldset>
                <legend>정지유형</legend>
                <label class="radio-label"><input v-model="isPermanentSanction" :value="false" type="radio" /> 기간정지</label>
                <label class="radio-label"><input v-model="isPermanentSanction" :value="true" type="radio" /> 영구정지</label>
              </fieldset>

              <div class="date-grid">
                <label for="sanction-start-at">시작일시<input id="sanction-start-at" v-model="sanctionForm.startAt" type="datetime-local" required /></label>
                <label for="sanction-end-at">종료일시<input id="sanction-end-at" v-model="sanctionForm.endAt" type="datetime-local" :disabled="isPermanentSanction" :required="!isPermanentSanction" /></label>
              </div>

              <label for="sanction-reason-code">사유코드</label>
              <select id="sanction-reason-code" v-model="sanctionForm.reasonCode">
                <option v-for="reasonCode in reasonCodeOptions" :key="reasonCode.code" :value="reasonCode.code">{{ reasonCode.name }}</option>
              </select>

              <p v-if="modalErrorMessage" class="message message--error">{{ modalErrorMessage }}</p>
              <div class="modal-actions">
                <button type="button" class="button button--outline" :disabled="isSubmitting" @click="closeModal">닫기</button>
                <button type="submit" class="button button--danger" :disabled="isSubmitting">{{ isSubmitting ? "처리 중..." : "회원정지" }}</button>
              </div>
            </form>

            <section class="history-summary">
              <h3>기존 제재 이력</h3>
              <p v-if="sanctionHistories.length === 0" class="modal-message">등록된 제재 이력이 없습니다.</p>
              <button v-for="history in sanctionHistories" :key="`${history.historyType}-${history.sanctionId}-${history.changedAt}`" type="button" class="history-card" :class="{ 'is-selected': selectedHistory?.sanctionId === history.sanctionId }" @click="selectHistory(history)">
                <strong>{{ formatHistoryType(history.historyType) }} · {{ formatScope(history.scope) }}</strong>
                <span>{{ formatReasonCode(history.reasonCode) }}</span>
                <small>{{ formatDateTime(history.changedAt) }} · {{ formatChangedBy(history) }}</small>
              </button>
            </section>

            <section v-if="selectedHistory" class="selected-history-detail">
              <h3>제재 상세</h3>
              <div class="member-detail-grid">
                <div><span>제재 승인자</span><strong>{{ selectedHistory.sanctionedByName || "-" }}</strong></div>
                <div><span>제재 해제자</span><strong>{{ selectedHistory.releasedByName || "-" }}</strong></div>
                <div><span>시작일시</span><strong>{{ formatDateTime(selectedHistory.startAt) }}</strong></div>
                <div><span>종료일시</span><strong>{{ formatDateTime(selectedHistory.endAt) }}</strong></div>
              </div>
              <template v-if="canRelease(selectedHistory)">
                <label for="release-reason">정지 해제 사유</label>
                <textarea id="release-reason" v-model="releaseForm.releaseReason" maxlength="500" placeholder="정지 해제 사유를 입력하세요." />
                <div class="modal-actions"><button type="button" class="button button--primary" :disabled="isSubmitting" @click="releaseSanction">{{ isSubmitting ? "해제 중..." : "정지해제" }}</button></div>
              </template>
            </section>
          </template>

          <template v-else>
            <p v-if="modalErrorMessage" class="message message--error">{{ modalErrorMessage }}</p>
            <div class="history-table-wrap">
              <table class="history-table">
                <thead><tr><th>이력유형</th><th>이전상태</th><th>변경상태</th><th>범위</th><th>사유</th><th>변경자</th><th>변경일시</th></tr></thead>
                <tbody>
                  <tr v-if="sanctionHistories.length === 0"><td colspan="7" class="table-message">등록된 변경 이력이 없습니다.</td></tr>
                  <tr v-for="history in sanctionHistories" v-else :key="`${history.historyType}-${history.sanctionId}-${history.changedAt}`">
                    <td>{{ formatHistoryType(history.historyType) }}</td>
                    <td>{{ formatStatus(history.beforeStatus) }}</td>
                    <td>{{ formatStatus(history.afterStatus) }}</td>
                    <td>{{ formatScope(history.scope) }}</td>
                    <td>{{ formatReasonCode(history.reasonCode) }}</td>
                    <td>{{ formatChangedBy(history) }}</td>
                    <td>{{ formatDateTime(history.changedAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="modal-actions"><button type="button" class="button button--outline" @click="closeModal">닫기</button></div>
          </template>
        </template>
      </section>
    </div>
  </section>
</template>

<style scoped>
.member-management-page { width: min(100%, 1440px); margin: 0 auto; }
.page-heading p { color: #5f6875; font-size: 13px; }
.page-heading h1 { margin-top: 38px; color: #0b1220; font-size: 36px; font-weight: 900; letter-spacing: -0.04em; }
.page-heading span { display: block; margin-top: 10px; color: #667085; font-size: 14px; }
.search-panel { display: flex; align-items: end; gap: 18px; margin-top: 46px; padding: 28px 30px; border-radius: 12px; background: #f2f5f9; }
.search-field { width: min(360px, 100%); }
.search-field label, .sanction-form > label, .date-grid label, .selected-history-detail > label { display: block; color: #1f2937; font-size: 13px; font-weight: 800; }
.search-field input, .sanction-form select, .date-grid input, .selected-history-detail textarea { box-sizing: border-box; width: 100%; height: 46px; margin-top: 9px; padding: 0 14px; border: 1px solid #aeb7c4; border-radius: 6px; color: #111827; background: #fff; font: inherit; font-size: 14px; }
.selected-history-detail textarea { min-height: 100px; height: auto; padding-top: 12px; resize: vertical; }
.search-field input:focus, .sanction-form select:focus, .date-grid input:focus, .selected-history-detail textarea:focus { border-color: #2f6bff; outline: 2px solid rgba(47, 107, 255, .16); }
.search-actions, .modal-actions { display: flex; gap: 8px; }
.button { min-width: 76px; height: 46px; padding: 0 17px; border: 1px solid #111827; border-radius: 5px; font-size: 13px; font-weight: 800; cursor: pointer; }
.button:disabled { opacity: .6; cursor: wait; }
.button--outline { color: #111827; background: #fff; }
.button--primary { color: #fff; background: #111827; }
.button--danger { border-color: #b42318; color: #fff; background: #b42318; }
.result-heading { margin: 36px 0 15px; }
.result-heading h2 { color: #111827; font-size: 20px; font-weight: 900; }
.result-heading p { margin-top: 6px; color: #667085; font-size: 13px; }
.result-heading strong { color: #174ea6; }
.message { margin: 0 0 14px; padding: 12px 14px; font-size: 13px; }
.message--error { border: 1px solid #efc6c2; color: #b42318; background: #fff4f2; }
.table-wrap, .history-table-wrap { overflow-x: auto; border-top: 2px solid #111827; border-bottom: 1px solid #cfd5dd; }
table { width: 100%; min-width: 1120px; border-collapse: collapse; table-layout: fixed; }
th, td { padding: 15px 13px; border-bottom: 1px solid #e1e5ea; color: #313946; font-size: 13px; text-align: center; vertical-align: middle; }
th { color: #111827; background: #f7f8fa; font-weight: 800; }
tbody tr:last-child td { border-bottom: 0; }
.id-cell { color: #526071; font-variant-numeric: tabular-nums; }
.nickname-cell { color: #111827; font-weight: 800; }
.role-badge, .status-badge { display: inline-flex; padding: 5px 8px; border: 1px solid; border-radius: 3px; font-size: 11px; font-weight: 800; }
.role-badge { border-color: #c8d6f5; color: #174ea6; background: #eef4ff; }
.status-badge--active { border-color: #b7dfc2; color: #166534; background: #effbf2; }
.status-badge--suspended { border-color: #efc6c2; color: #b42318; background: #fff4f2; }
.status-badge--withdrawn { border-color: #d9dce1; color: #667085; background: #f4f5f7; }
.table-action { padding: 7px 10px; border: 1px solid #8394ad; border-radius: 4px; color: #344054; background: #fff; font-size: 12px; font-weight: 800; cursor: pointer; }
.table-message { height: 160px; color: #7a8492; }
.pagination { display: flex; justify-content: center; gap: 5px; margin-top: 26px; }
.pagination button { min-width: 38px; height: 38px; padding: 0 10px; border: 1px solid #cfd5dd; color: #374151; background: #fff; cursor: pointer; }
.pagination button.is-current { border-color: #2f6bff; color: #fff; background: #2f6bff; font-weight: 800; }
.pagination button:disabled { color: #a2a9b3; background: #f5f6f7; cursor: not-allowed; }
.modal-backdrop { position: fixed; z-index: 20; inset: 0; background: rgba(15, 23, 42, .48); }
.member-modal { position: absolute; top: 0; right: 0; box-sizing: border-box; width: min(680px, 100vw); height: 100%; overflow-y: auto; padding: 32px; background: #fff; box-shadow: -18px 0 42px rgba(15, 23, 42, .24); }
.modal-heading h2 { color: #111827; font-size: 22px; font-weight: 900; }
.modal-heading p { margin: 8px 0 24px; color: #667085; font-size: 14px; line-height: 1.5; }
.member-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; margin-bottom: 22px; border: 1px solid #e1e5ea; background: #e1e5ea; }
.member-detail-grid div { min-width: 0; padding: 13px 14px; background: #fff; }
.member-detail-grid span { display: block; margin-bottom: 6px; color: #667085; font-size: 12px; }
.member-detail-grid strong { display: block; overflow: hidden; color: #1f2937; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.sanction-form fieldset { margin: 18px 0; padding: 0; border: 0; }
.sanction-form legend { margin-bottom: 9px; color: #1f2937; font-size: 13px; font-weight: 800; }
.radio-label { margin-right: 18px; color: #344054; font-size: 14px; }
.radio-label input { margin-right: 5px; }
.date-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
.sanction-form > label + select { margin-bottom: 18px; }
.history-summary, .selected-history-detail { margin-top: 28px; }
.history-summary h3, .selected-history-detail h3 { margin-bottom: 10px; color: #1f2937; font-size: 15px; font-weight: 900; }
.history-card { display: block; width: 100%; margin-top: 8px; padding: 13px; border: 1px solid #d5dbe4; color: #344054; background: #fff; text-align: left; cursor: pointer; }
.history-card.is-selected { border-color: #2f6bff; background: #f4f7ff; }
.history-card strong, .history-card span, .history-card small { display: block; }
.history-card span { margin-top: 5px; font-size: 13px; }
.history-card small { margin-top: 5px; color: #667085; font-size: 12px; }
.selected-history-detail textarea { margin-bottom: 18px; }
.modal-message { margin: 0; padding: 14px; color: #667085; background: #f4f6f8; font-size: 13px; }
.modal-actions { justify-content: flex-end; margin-top: 20px; }
.history-table { min-width: 760px; }
.history-table-wrap { margin-top: 14px; }
@media (max-width: 860px) { .page-heading h1 { margin-top: 28px; font-size: 30px; } .search-panel { align-items: stretch; flex-direction: column; } .search-field { width: 100%; } .search-actions { justify-content: flex-end; } .member-modal { width: 100vw; padding: 24px; } .member-detail-grid, .date-grid { grid-template-columns: 1fr; } }
</style>
