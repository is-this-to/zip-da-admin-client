<script setup>
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMyErrorStore } from "./store/error/useMyErrorStore.js";

const route = useRoute();
const router = useRouter();

const myErrorStore = useMyErrorStore();

watch(
  // myErrorStore.isError 변경 되는거 지켜보기
  () => myErrorStore.isError,
  // 변경된 isError값을 파라미터로 함수 실행
  (isError) => {
    if (isError && route.path !== "/errors") {
      router.replace("/errors");
    }
  },
  { immediate: true },
);
</script>

<template>    
  <router-view></router-view>    
</template>
