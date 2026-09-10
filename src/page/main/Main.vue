<script setup>
import AdminSidebar from "../../component/AdminSidebar.vue";
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar />

    <main class="admin-content">
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
