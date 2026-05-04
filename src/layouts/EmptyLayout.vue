<template>
  <div class="empty-layout">
    <router-view />
  </div>
</template>

<style scoped>
.empty-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--el-fill-color-light);
}
</style>
