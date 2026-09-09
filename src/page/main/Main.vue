<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AdminSidebar from "../../component/AdminSidebar.vue";
import AdminAccountRoleList from "../admin/AdminAccountRoleList.vue";
import AdminAgencyOperatingStatusList from "../admin/AdminAgencyOperatingStatusList.vue";
import adminMenu from "../../constant/adminMenu.js";
import { useAdminAuthStore } from "../../store/auth/useAdminAuthStore.js";

const route = useRoute();
const authStore = useAdminAuthStore();

const visibleMenus = computed(() => {
  return adminMenu.filter((menu) => authStore.hasAnyRole(menu.roles));
});

const selectedMenu = computed(() => {
  const selectedMenuId =
    typeof route.query.screen === "string" ? route.query.screen : "dashboard";

  return (
    visibleMenus.value.find((menu) => menu.id === selectedMenuId) ||
    visibleMenus.value[0]
  );
});
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar />

    <main class="admin-content">
      <section class="admin-content__heading">
        <p>관리자 화면</p>
        <h1>{{ selectedMenu?.name || "대시보드" }}</h1>
      </section>

      <AdminAccountRoleList
        v-if="selectedMenu?.id === 'admin-accounts-roles'"
      />

      <AdminAgencyOperatingStatusList
        v-else-if="selectedMenu?.id === 'agency-status'"
      />

      <section v-else class="admin-content__placeholder">
        <strong>{{ selectedMenu?.name || "대시보드" }}</strong>
        <p>이 메뉴의 상세 화면은 다음 작업 단위에서 구현합니다.</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  overflow: hidden;
  color: #111827;
  background: #ffffff;
}

.admin-content {
  flex: 1;
  min-width: 0;
  height: 100vh;
  padding: 42px clamp(40px, 6vw, 100px);
  overflow-y: auto;
}

.admin-content__heading p {
  color: #5f6875;
  font-size: 13px;
  font-weight: 500;
}

.admin-content__heading h1 {
  margin-top: 38px;
  color: #0b1220;
  font-size: 36px;
  line-height: 1.25;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.admin-content__placeholder {
  min-height: 260px;
  margin-top: 48px;
  padding: 34px;
  border: 1px solid #d8dde5;
  border-radius: 12px;
  background: #f2f5f9;
}

.admin-content__placeholder strong {
  color: #111827;
  font-size: 22px;
  font-weight: 900;
}

.admin-content__placeholder p {
  margin-top: 12px;
  color: #667085;
  font-size: 14px;
}

@media (max-width: 860px) {
  .admin-content {
    padding: 32px 28px;
  }

  .admin-content__heading h1 {
    margin-top: 28px;
    font-size: 30px;
  }
}
</style>
