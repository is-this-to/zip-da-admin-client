<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const pageName = computed(() => route.meta.pageName || "관리자 화면");
</script>

<template>
  <div class="admin-page-placeholder">
    <header>
      <p>관리자 화면 &gt; {{ pageName }}</p>
      <h1>{{ pageName }}</h1>
    </header>

    <section>
      <strong>{{ pageName }}</strong>
      <p>이 메뉴의 상세 화면은 다음 작업 단위에서 구현합니다.</p>
    </section>
  </div>
</template>

<style scoped>
.admin-page-placeholder {
  width: min(100%, 1280px);
  margin: 0 auto;
}

header p {
  color: #5f6875;
  font-size: 13px;
}

header h1 {
  margin-top: 38px;
  color: #0b1220;
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

section {
  min-height: 260px;
  margin-top: 48px;
  padding: 34px;
  border: 1px solid #d8dde5;
  border-radius: 12px;
  background: #f2f5f9;
}

section strong {
  font-size: 22px;
}

section p {
  margin-top: 12px;
  color: #667085;
  font-size: 14px;
}
</style>
