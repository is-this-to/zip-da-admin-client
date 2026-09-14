<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import adminAxios from "../../api/adminAxios.js";
import adminRoleCode from "../../constant/adminRoleCode.js";

// 목록 페이지 크기
const PAGE_SIZE = 20;

// 부여 가능 역할
const ASSIGNABLE_ROLE_CODES = adminRoleCode.assignableAdminRoleCodes;

// 검색 조건 상태
const searchForm = reactive({ adminCode: "", adminName: "", role: "" });
const appliedSearch = reactive({ ...searchForm });

// 관리자 생성 입력값
const createForm = reactive({ adminCode: "", adminName: "", adminRole: "CS_ADMIN" });

// 권한 변경 입력값
const roleForm = reactive({ roleCode: "CS_ADMIN" });

// 목록 응답 상태
const admins = ref([]);
const page = ref(0);
const totalElements = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);
const isCreating = ref(false);
const isChangingRole = ref(false);
const errorMessage = ref("");
const modalErrorMessage = ref("");
const isCreateModalOpen = ref(false);
const selectedAdmin = ref(null);

// 역할 선택 항목
const roleOptions = computed(() => ASSIGNABLE_ROLE_CODES.map((code) => ({
  code,
  name: adminRoleCode.getAdminRoleCodeName(code),
})));

const selectedRoles = computed(() => selectedAdmin.value?.activeRoles ?? []);

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

  Object.entries(appliedSearch).forEach(([key, value]) => {
    if (value.trim()) params[key] = value.trim();
  });

  return params;
};

// 관리자 목록 조회
const fetchAdmins = async (requestedPage = 0) => {
  if (isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await adminAxios.get("/api/member/admin/admins", {
      params: requestParams(requestedPage),
    });
    const result = response.data.data;

    admins.value = result.content;
    page.value = result.page;
    totalElements.value = result.totalElements;
    totalPages.value = result.totalPages;
  } catch {
    admins.value = [];
    page.value = 0;
    totalElements.value = 0;
    totalPages.value = 0;
    errorMessage.value = "관리자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isLoading.value = false;
  }
};

const search = () => {
  Object.assign(appliedSearch, searchForm);
  fetchAdmins(0);
};

const resetSearch = () => {
  Object.keys(searchForm).forEach((key) => {
    searchForm[key] = "";
  });
  Object.assign(appliedSearch, searchForm);
  fetchAdmins(0);
};

const movePage = (requestedPage) => {
  if (
    isLoading.value
    || requestedPage < 0
    || requestedPage >= totalPages.value
    || requestedPage === page.value
  ) return;

  fetchAdmins(requestedPage);
};

const openCreateModal = () => {
  Object.assign(createForm, {
    adminCode: "",
    adminName: "",
    adminRole: "CS_ADMIN",
  });
  modalErrorMessage.value = "";
  isCreateModalOpen.value = true;
};

const closeCreateModal = () => {
  if (!isCreating.value) isCreateModalOpen.value = false;
};

// 관리자 계정 생성
const createAdmin = async () => {
  if (isCreating.value) return;

  isCreating.value = true;
  modalErrorMessage.value = "";

  try {
    await adminAxios.post("/api/member/admin/admins", createForm);
    isCreateModalOpen.value = false;
    await fetchAdmins(0);
  } catch (error) {
    modalErrorMessage.value = error.response?.data?.message
      || "관리자 계정을 생성하지 못했습니다. 입력값을 확인해 주세요.";
  } finally {
    isCreating.value = false;
  }
};

const openRoleModal = (admin) => {
  selectedAdmin.value = admin;
  roleForm.roleCode = ASSIGNABLE_ROLE_CODES.find(
    (roleCode) => !admin.activeRoles.includes(roleCode),
  ) || ASSIGNABLE_ROLE_CODES[0];
  modalErrorMessage.value = "";
};

const closeRoleModal = () => {
  if (!isChangingRole.value) selectedAdmin.value = null;
};

// 관리자 권한 변경
const changeRole = async (action) => {
  if (!selectedAdmin.value || isChangingRole.value) return;

  const hasSelectedRole = selectedRoles.value.includes(roleForm.roleCode);
  if ((action === "assign" && hasSelectedRole) || (action === "revoke" && !hasSelectedRole)) {
    modalErrorMessage.value = action === "assign"
      ? "이미 부여된 권한입니다."
      : "회수할 활성 권한이 아닙니다.";
    return;
  }

  isChangingRole.value = true;
  modalErrorMessage.value = "";

  try {
    const baseUrl = `/api/member/admin/admins/${selectedAdmin.value.adminId}/roles`;
    if (action === "assign") {
      await adminAxios.post(baseUrl, { roleCode: roleForm.roleCode });
    } else {
      await adminAxios.delete(`${baseUrl}/${roleForm.roleCode}`);
    }

    selectedAdmin.value = null;
    await fetchAdmins(page.value);
  } catch (error) {
    modalErrorMessage.value = error.response?.data?.message
      || "권한을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    isChangingRole.value = false;
  }
};

const formatDateTime = (value) => value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "-";
const formatRoles = (roles) => roles.map(adminRoleCode.getAdminRoleCodeName);

onMounted(() => {
  fetchAdmins();
});
</script>

<template>
  <section class="admin-account-role-page" aria-live="polite">
    <form class="search-panel" @submit.prevent="search">
      <div class="search-field">
        <label for="admin-code">관리자 코드</label>
        <input id="admin-code" v-model="searchForm.adminCode" type="text" maxlength="20" placeholder="관리자 코드를 입력하세요." />
      </div>
      <div class="search-field">
        <label for="admin-name">성명</label>
        <input id="admin-name" v-model="searchForm.adminName" type="text" maxlength="50" placeholder="성명을 입력하세요." />
      </div>
      <div class="search-field">
        <label for="admin-role">권한</label>
        <select id="admin-role" v-model="searchForm.role">
          <option value="">전체</option>
          <option v-for="role in roleOptions" :key="role.code" :value="role.code">{{ role.name }}</option>
        </select>
      </div>
      <div class="search-actions">
        <button type="button" class="button button--outline" :disabled="isLoading" @click="resetSearch">초기화</button>
        <button type="submit" class="button button--primary" :disabled="isLoading">{{ isLoading ? "검색 중..." : "검색" }}</button>
      </div>
    </form>

    <div class="result-heading">
      <div>
        <h2>관리자 목록</h2>
        <p>총 <strong>{{ totalElements.toLocaleString() }}</strong>건</p>
      </div>
      <button type="button" class="button button--primary" @click="openCreateModal">관리자 생성</button>
    </div>

    <p v-if="errorMessage" class="message message--error">{{ errorMessage }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>관리자 ID</th><th>관리자 코드</th><th>성명</th><th>활성 권한</th><th>생성일</th><th>최근 로그인</th><th>권한 관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading"><td colspan="7" class="table-message">관리자 목록을 불러오는 중입니다.</td></tr>
          <tr v-else-if="admins.length === 0"><td colspan="7" class="table-message">검색 결과가 없습니다.</td></tr>
          <tr v-for="admin in admins" v-else :key="admin.adminId">
            <td class="id-cell">{{ admin.adminId }}</td>
            <td class="code-cell">{{ admin.adminCode }}</td>
            <td>{{ admin.adminName }}</td>
            <td><div class="role-badges"><span v-for="roleName in formatRoles(admin.activeRoles)" :key="roleName" class="role-badge">{{ roleName }}</span></div></td>
            <td>{{ formatDateTime(admin.createdAt) }}</td>
            <td>{{ formatDateTime(admin.lastLoginAt) }}</td>
            <td><button type="button" class="table-action" @click="openRoleModal(admin)">권한 관리</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="totalPages > 1" class="pagination" aria-label="관리자 목록 페이지">
      <button type="button" :disabled="page === 0 || isLoading" @click="movePage(page - 1)">이전</button>
      <button v-for="pageNumber in visiblePages" :key="pageNumber" type="button" :class="{ 'is-current': pageNumber === page }" :disabled="isLoading" @click="movePage(pageNumber)">{{ pageNumber + 1 }}</button>
      <button type="button" :disabled="page >= totalPages - 1 || isLoading" @click="movePage(page + 1)">다음</button>
    </nav>

    <div v-if="isCreateModalOpen" class="modal-backdrop" @click.self="closeCreateModal">
      <form class="modal" @submit.prevent="createAdmin">
        <div class="modal-heading"><h2>관리자 등록</h2><p>신규 관리자 기본정보와 최초 권한을 입력하세요.</p></div>
        <label>관리자 코드<input v-model="createForm.adminCode" type="text" maxlength="20" required placeholder="관리자 코드를 입력하세요." /></label>
        <label>성명<input v-model="createForm.adminName" type="text" maxlength="50" required placeholder="성명을 입력하세요." /></label>
        <label>권한<select v-model="createForm.adminRole" required><option v-for="role in roleOptions" :key="role.code" :value="role.code">{{ role.name }}</option></select></label>
        <p class="modal-note">임시 비밀번호로 계정이 생성되며, 최초 로그인 시 비밀번호를 변경해야 합니다.</p>
        <p v-if="modalErrorMessage" class="message message--error">{{ modalErrorMessage }}</p>
        <div class="modal-actions"><button type="button" class="button button--outline" :disabled="isCreating" @click="closeCreateModal">취소</button><button type="submit" class="button button--primary" :disabled="isCreating">{{ isCreating ? "등록 중..." : "등록" }}</button></div>
      </form>
    </div>

    <div v-if="selectedAdmin" class="modal-backdrop" @click.self="closeRoleModal">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
        <div class="modal-heading"><h2 id="role-modal-title">권한 관리</h2><p>{{ selectedAdmin.adminCode }} · {{ selectedAdmin.adminName }}</p></div>
        <div class="active-role-box"><strong>현재 활성 권한</strong><div class="role-badges"><span v-for="roleName in formatRoles(selectedRoles)" :key="roleName" class="role-badge">{{ roleName }}</span></div></div>
        <label>권한<select v-model="roleForm.roleCode"><option v-for="role in roleOptions" :key="role.code" :value="role.code">{{ role.name }}</option></select></label>
        <p class="modal-note">권한을 변경하면 해당 관리자의 기존 로그인 세션이 종료됩니다. 자기 자신의 마지막 최고 관리자 권한은 회수할 수 없습니다.</p>
        <p v-if="modalErrorMessage" class="message message--error">{{ modalErrorMessage }}</p>
        <div class="modal-actions"><button type="button" class="button button--outline" :disabled="isChangingRole" @click="closeRoleModal">취소</button><button type="button" class="button button--danger" :disabled="isChangingRole" @click="changeRole('revoke')">권한 회수</button><button type="button" class="button button--primary" :disabled="isChangingRole" @click="changeRole('assign')">권한 부여</button></div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.admin-account-role-page { margin-top: 46px; }
.search-panel { display: grid; grid-template-columns: repeat(3, minmax(170px, 1fr)) auto; gap: 18px; align-items: end; padding: 28px 30px; border-radius: 12px; background: #f2f5f9; }
.search-field { min-width: 0; }
.search-field label, .modal label { display: block; color: #1f2937; font-size: 13px; font-weight: 800; }
.search-field input, .search-field select, .modal input, .modal select { box-sizing: border-box; width: 100%; height: 46px; margin-top: 9px; padding: 0 14px; border: 1px solid #aeb7c4; border-radius: 6px; color: #111827; background: #fff; font-size: 14px; }
.search-field input:focus, .search-field select:focus, .modal input:focus, .modal select:focus { border-color: #2f6bff; outline: 2px solid rgba(47, 107, 255, .16); }
.search-actions, .modal-actions { display: flex; gap: 8px; }
.button { min-width: 76px; height: 46px; padding: 0 17px; border: 1px solid #111827; border-radius: 5px; font-size: 13px; font-weight: 800; cursor: pointer; }
.button:disabled { opacity: .6; cursor: wait; }
.button--outline { color: #111827; background: #fff; }
.button--primary { color: #fff; background: #111827; }
.button--danger { border-color: #b42318; color: #fff; background: #b42318; }
.result-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin: 36px 0 15px; }
.result-heading h2 { color: #111827; font-size: 20px; font-weight: 900; }
.result-heading p { margin-top: 6px; color: #667085; font-size: 13px; }
.result-heading strong { color: #174ea6; }
.message { margin: 0 0 14px; padding: 12px 14px; font-size: 13px; }
.message--error { border: 1px solid #efc6c2; color: #b42318; background: #fff4f2; }
.table-wrap { overflow-x: auto; border-top: 2px solid #111827; border-bottom: 1px solid #cfd5dd; }
table { width: 100%; min-width: 1120px; border-collapse: collapse; table-layout: fixed; }
th, td { padding: 15px 13px; border-bottom: 1px solid #e1e5ea; color: #313946; font-size: 13px; text-align: center; vertical-align: middle; }
th { color: #111827; background: #f7f8fa; font-weight: 800; }
tbody tr:last-child td { border-bottom: 0; }
.id-cell { color: #526071; font-variant-numeric: tabular-nums; }
.code-cell { color: #111827; font-weight: 800; }
.role-badges { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
.role-badge { display: inline-flex; padding: 5px 8px; border: 1px solid #c8d6f5; border-radius: 3px; color: #174ea6; background: #eef4ff; font-size: 11px; font-weight: 800; }
.table-action { padding: 7px 10px; border: 1px solid #8394ad; border-radius: 4px; color: #344054; background: #fff; font-size: 12px; font-weight: 800; cursor: pointer; }
.table-message { height: 160px; color: #7a8492; }
.pagination { display: flex; justify-content: center; gap: 5px; margin-top: 26px; }
.pagination button { min-width: 38px; height: 38px; padding: 0 10px; border: 1px solid #cfd5dd; color: #374151; background: #fff; cursor: pointer; }
.pagination button.is-current { border-color: #2f6bff; color: #fff; background: #2f6bff; font-weight: 800; }
.pagination button:disabled { color: #a2a9b3; background: #f5f6f7; cursor: not-allowed; }
.modal-backdrop { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; padding: 24px; background: rgba(15, 23, 42, .48); }
.modal { box-sizing: border-box; width: min(480px, 100%); max-height: calc(100vh - 48px); overflow-y: auto; padding: 30px; border-radius: 12px; background: #fff; box-shadow: 0 24px 54px rgba(15, 23, 42, .28); }
.modal-heading h2 { color: #111827; font-size: 22px; font-weight: 900; }
.modal-heading p { margin: 8px 0 24px; color: #667085; font-size: 14px; line-height: 1.5; }
.modal label + label { margin-top: 18px; }
.modal-note { margin: 18px 0; padding: 12px; color: #4b5563; background: #f4f6f8; font-size: 13px; line-height: 1.55; }
.modal-actions { justify-content: flex-end; }
.active-role-box { margin-bottom: 20px; padding: 14px; background: #f4f6f8; }
.active-role-box strong { display: block; margin-bottom: 10px; color: #344054; font-size: 13px; }
.active-role-box .role-badges { justify-content: flex-start; }
@media (max-width: 1180px) { .search-panel { grid-template-columns: repeat(2, minmax(180px, 1fr)); } }
@media (max-width: 860px) { .search-panel { grid-template-columns: 1fr; } .search-actions { justify-content: flex-end; } }
</style>
