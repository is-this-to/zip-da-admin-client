<script setup>
import { computed } from "vue";
import { useAdminAuthStore } from "../../store/auth/useAdminAuthStore.js";

const authStore = useAdminAuthStore();

const superAdminDashboard = {
  id: "super",
  title: "전체 운영 현황",
  description: "회원, 중개소와 운영 보안 현황을 확인합니다.",
  metrics: [
    "전체 회원",
    "활성 중개소",
    "전체 처리 대기",
    "로그인 실패",
    "권한 접근 거부",
  ],
  leftTitle: "서비스별 처리 대기",
  rightTitle: "보안·운영 주의 항목",
};

const csAdminDashboard = {
  id: "cs",
  title: "CS 운영 현황",
  description: "회원과 허위매물 신고 처리 현황을 확인합니다.",
  metrics: [
    "신규 회원",
    "정지 회원",
    "신고 처리 대기",
    "오늘 신고 처리",
    "로그인 차단",
  ],
  leftTitle: "처리 대기 허위매물 신고",
  rightTitle: "정지 만료 예정 회원",
};

const salesAdminDashboard = {
  id: "sales",
  title: "중개사 영업 현황",
  description: "중개사 신청 심사와 중개소 운영 현황을 확인합니다.",
  metrics: ["심사 대기", "심사 중", "보완 요청", "오늘 승인", "오늘 반려"],
  leftTitle: "심사 대기 신청",
  rightTitle: "보완 기한 임박",
};

const dashboardSections = computed(() => {
  if (authStore.hasRole("SUPER_ADMIN")) {
    return [superAdminDashboard];
  }

  const sections = [];

  if (authStore.hasRole("CS_ADMIN")) {
    sections.push(csAdminDashboard);
  }

  if (authStore.hasRole("SALES_ADMIN")) {
    sections.push(salesAdminDashboard);
  }

  return sections;
});

const isMultipleRoleDashboard = computed(() => dashboardSections.value.length > 1);
</script>

<template>
  <div class="admin-dashboard">
    <header class="admin-dashboard__heading">
      <p>관리자 화면 &gt; 대시보드</p>
      <h1>대시보드</h1>
      <span>보유 권한에 해당하는 업무 현황을 확인합니다.</span>
    </header>

    <div
      class="admin-dashboard__sections"
      :class="{ 'is-multiple': isMultipleRoleDashboard }"
    >
      <section
        v-for="section in dashboardSections"
        :key="section.id"
        class="dashboard-section"
      >
        <div class="dashboard-section__heading">
          <div>
            <h2>{{ section.title }}</h2>
            <p>{{ section.description }}</p>
          </div>
          <span v-if="isMultipleRoleDashboard" class="dashboard-section__role">
            {{ section.id === "cs" ? "CS 관리자" : "영업 관리자" }}
          </span>
        </div>

        <div class="dashboard-metrics">
          <article
            v-for="(metric, index) in section.metrics"
            :key="metric"
            class="dashboard-metric"
            :class="`dashboard-metric--${(index % 4) + 1}`"
          >
            <span>{{ metric }}</span>
            <strong>-</strong>
            <small>API 연동 전</small>
          </article>
        </div>

        <div class="dashboard-panels">
          <article class="dashboard-panel">
            <h3>{{ section.leftTitle }}</h3>
            <div class="dashboard-panel__empty">
              <strong>-</strong>
              <p>API 연동 후 처리 대상이 표시됩니다.</p>
            </div>
          </article>

          <article class="dashboard-panel">
            <h3>{{ section.rightTitle }}</h3>
            <div class="dashboard-panel__empty">
              <strong>-</strong>
              <p>API 연동 후 주의 항목이 표시됩니다.</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard {
  width: min(100%, 1280px);
  margin: 0 auto;
}

.admin-dashboard__heading p {
  color: #5f6875;
  font-size: 13px;
}

.admin-dashboard__heading h1 {
  margin-top: 38px;
  color: #0b1220;
  font-size: 36px;
  line-height: 1.25;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.admin-dashboard__heading span {
  display: block;
  margin-top: 10px;
  color: #667085;
  font-size: 14px;
}

.admin-dashboard__sections {
  margin-top: 46px;
}

.dashboard-section + .dashboard-section {
  margin-top: 54px;
  padding-top: 50px;
  border-top: 1px solid #d8dde5;
}

.dashboard-section__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.dashboard-section__heading h2 {
  color: #111827;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.dashboard-section__heading p {
  margin-top: 8px;
  color: #667085;
  font-size: 14px;
}

.dashboard-section__role {
  padding: 7px 10px;
  border: 1px solid #c9d6f5;
  border-radius: 3px;
  color: #174ea6;
  background: #f2f6ff;
  font-size: 12px;
  font-weight: 800;
}

.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(140px, 1fr));
  gap: 14px;
  margin-top: 24px;
}

.dashboard-metric {
  min-height: 168px;
  padding: 24px 22px;
  border: 1px solid #d8dde5;
  border-radius: 12px;
  background: #ffffff;
}

.dashboard-metric--2 {
  border-color: #d5e0fb;
  background: #eef3ff;
}

.dashboard-metric--3 {
  border-color: #d4e8d8;
  background: #eef8f0;
}

.dashboard-metric--4 {
  border-color: #f0d7d2;
  background: #fff2ef;
}

.dashboard-metric span,
.dashboard-metric small {
  display: block;
}

.dashboard-metric span {
  min-height: 38px;
  color: #273142;
  font-size: 14px;
  font-weight: 800;
}

.dashboard-metric strong {
  display: block;
  margin-top: 14px;
  color: #0b1220;
  font-size: 34px;
  font-weight: 900;
}

.dashboard-metric small {
  margin-top: 13px;
  color: #7a8492;
  font-size: 11px;
}

.dashboard-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 22px;
}

.dashboard-panel {
  min-height: 220px;
  padding: 26px 28px;
  border: 1px solid #d8dde5;
  border-radius: 12px;
  background: #f2f5f9;
}

.dashboard-panel h3 {
  color: #111827;
  font-size: 18px;
  font-weight: 900;
}

.dashboard-panel__empty {
  display: grid;
  min-height: 130px;
  place-items: center;
  align-content: center;
  color: #7a8492;
  text-align: center;
}

.dashboard-panel__empty strong {
  color: #9aa2ad;
  font-size: 28px;
}

.dashboard-panel__empty p {
  margin-top: 8px;
  font-size: 13px;
}

@media (max-width: 1180px) {
  .dashboard-metrics {
    grid-template-columns: repeat(3, minmax(150px, 1fr));
  }
}

@media (max-width: 860px) {
  .admin-dashboard__heading h1 {
    margin-top: 28px;
    font-size: 30px;
  }

  .dashboard-metrics,
  .dashboard-panels {
    grid-template-columns: 1fr;
  }
}
</style>
