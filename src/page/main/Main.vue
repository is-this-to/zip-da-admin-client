<script setup>
import AdminSidebar from "../../component/AdminSidebar.vue";
import AdminAccountRoleList from "../admin/AdminAccountRoleList.vue";
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

      <section v-else class="admin-content__placeholder">
        <strong>{{ selectedMenu?.name || "대시보드" }}</strong>
        <p>이 메뉴의 상세 화면은 다음 작업 단위에서 구현합니다.</p>
      </section>
      <router-view />
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

@media (max-width: 860px) {
  .admin-content {
    padding: 32px 28px;
  }
}
</style>
