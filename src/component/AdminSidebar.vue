<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import adminMenu from "../constant/adminMenu.js";
import adminRoleCode from "../constant/adminRoleCode.js";
import { useAdminAuthStore } from "../store/auth/useAdminAuthStore.js";

const route = useRoute();
const router = useRouter();
const authStore = useAdminAuthStore();

const isLoggingOut = ref(false);

const visibleMenus = computed(() => {
  return adminMenu.filter((menu) => authStore.hasAnyRole(menu.roles));
});

const groupedMenus = computed(() => {
  const groups = [];

  visibleMenus.value.forEach((menu) => {
    const groupName = menu.group || "메인";
    let group = groups.find((item) => item.name === groupName);

    if (!group) {
      group = { name: groupName, menus: [] };
      groups.push(group);
    }

    group.menus.push(menu);
  });

  return groups;
});

const selectedMenuId = computed(() => {
  const requestedMenuId = route.meta.menuId || "dashboard";

  return visibleMenus.value.some((menu) => menu.id === requestedMenuId)
    ? requestedMenuId
    : visibleMenus.value[0]?.id;
});

const roleNames = computed(() => {
  return authStore.roles.map(adminRoleCode.getAdminRoleCodeName);
});

const selectMenu = (menuId) => {
  const targetRoute = router
    .getRoutes()
    .find((routeRecord) => routeRecord.meta.menuId === menuId);

  if (targetRoute?.name) {
    router.push({ name: targetRoute.name });
  }
};

const logout = async () => {
  if (isLoggingOut.value) return;

  isLoggingOut.value = true;

  try {
    await authStore.logout();
  } catch {
    // 서버 로그아웃 실패 시에도 클라이언트 인증 상태는 제거한다.
  } finally {
    isLoggingOut.value = false;
    await router.replace("/admins/sign-in");
  }
};
</script>

<template>
  <aside class="admin-sidebar">
    <div class="admin-sidebar__brand">
      <span class="admin-sidebar__brand-mark">Z</span>
      <div>
        <strong>ZIPDA</strong>
        <span>ADMIN</span>
      </div>
    </div>

    <nav class="admin-sidebar__navigation" aria-label="관리자 메뉴">
      <section
        v-for="group in groupedMenus"
        :key="group.name"
        class="admin-sidebar__menu-group"
      >
        <h2 v-if="group.name !== '메인'">{{ group.name }}</h2>

        <button
          v-for="menu in group.menus"
          :key="menu.id"
          type="button"
          class="admin-sidebar__menu-button"
          :class="{ 'is-active': selectedMenuId === menu.id }"
          :aria-current="selectedMenuId === menu.id ? 'page' : undefined"
          @click="selectMenu(menu.id)"
        >
          {{ menu.name }}
        </button>
      </section>
    </nav>

    <div class="admin-sidebar__account">
      <span class="admin-sidebar__account-label">보유 권한</span>

      <div class="admin-sidebar__roles">
        <span v-for="roleName in roleNames" :key="roleName">
          {{ roleName }}
        </span>
      </div>

      <button
        type="button"
        class="admin-sidebar__logout-button"
        :disabled="isLoggingOut"
        @click="logout"
      >
        {{ isLoggingOut ? "로그아웃 중..." : "로그아웃" }}
      </button>
    </div>
  </aside>
</template>

<style scoped>
.admin-sidebar {
  display: flex;
  flex-direction: column;
  width: 260px;
  height: 100vh;
  overflow: hidden;
  color: #111827;
  background: #ffffff;
  border-right: 1px solid #d8dde5;
}

.admin-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 90px;
  padding: 20px 24px;
  border-bottom: 1px solid #d8dde5;
}

.admin-sidebar__brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 3px solid #111827;
  border-radius: 50%;
  color: #ffffff;
  background: #111827;
  font-size: 20px;
  font-weight: 900;
}

.admin-sidebar__brand div {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.admin-sidebar__brand strong {
  color: #080b10;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.admin-sidebar__brand div span {
  margin-top: 3px;
  color: #4b5563;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.2em;
}

.admin-sidebar__navigation {
  flex: 1;
  padding: 25px 20px 28px;
  overflow-y: auto;
}

.admin-sidebar__menu-group {
  margin-top: 0;
  padding: 15px 0;
  border-bottom: 1px solid #d8dde5;
}

.admin-sidebar__menu-group:first-child {
  padding-top: 0;
}

.admin-sidebar__menu-group h2 {
  margin: 0 7px 9px;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.admin-sidebar__menu-button {
  width: 100%;
  min-height: 39px;
  margin: 2px 0;
  padding: 9px 12px 9px 25px;
  border: 1px solid transparent;
  border-radius: 0;
  color: #202936;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.admin-sidebar__menu-button::before {
  content: "·";
  display: inline-block;
  width: 14px;
  margin-left: -14px;
  font-weight: 900;
}

.admin-sidebar__menu-button:hover {
  color: #111827;
  background: #f5f7fa;
}

.admin-sidebar__menu-button:focus-visible {
  outline: 2px solid #2f6bff;
  outline-offset: -2px;
}

.admin-sidebar__menu-button.is-active {
  color: #111827;
  background: #ffffff;
  border-color: #2f6bff;
  box-shadow: none;
  font-weight: 800;
}

.admin-sidebar__account {
  flex-shrink: 0;
  padding: 18px 24px 22px;
  border-top: 1px solid #d8dde5;
  background: #ffffff;
}

.admin-sidebar__account-label {
  display: block;
  margin-bottom: 10px;
  color: #4b5563;
  font-size: 12px;
  font-weight: 800;
}

.admin-sidebar__roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.admin-sidebar__roles span {
  padding: 5px 9px;
  border: 1px solid #c9d6f5;
  border-radius: 3px;
  color: #174ea6;
  background: #f2f6ff;
  font-size: 11px;
  font-weight: 700;
}

.admin-sidebar__logout-button {
  width: 100%;
  min-height: 40px;
  margin-top: 14px;
  border: 1px solid #111827;
  border-radius: 0;
  color: #111827;
  background: #ffffff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.admin-sidebar__logout-button:hover:not(:disabled) {
  color: #ffffff;
  background: #111827;
  border-color: #111827;
}

.admin-sidebar__logout-button:disabled {
  color: #8d949b;
  cursor: wait;
}

@media (max-width: 860px) {
  .admin-sidebar {
    width: 220px;
  }

  .admin-sidebar__navigation {
    padding-right: 14px;
    padding-left: 14px;
  }
}
</style>
