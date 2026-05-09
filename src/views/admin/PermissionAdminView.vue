<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import type { Permission } from '@/types/rbac'
import { fetchAllPermissions } from '@/services/permissions'
import { parseBackendErrorMessage } from '@/utils/http-error'

const loading = ref(false)
const query = ref('')
const all = ref<Permission[]>([])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return all.value
  return all.value.filter((p) => {
    return (
      p.key.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    )
  })
})

async function load() {
  loading.value = true
  try {
    all.value = await fetchAllPermissions()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载权限列表失败'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="admin-toolbar">
        <span>权限列表</span>
        <div class="admin-toolbar__right">
          <el-input v-model="query" placeholder="搜索 key / 名称 / 分类" clearable style="width: 260px" />
        </div>
      </div>
    </template>

    <el-table :data="filtered" v-loading="loading" row-key="key">
      <el-table-column prop="key" label="Key" min-width="220" />
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column prop="category" label="分类" width="160" />
      <el-table-column prop="description" label="描述" min-width="240" />
    </el-table>
  </el-card>
</template>

<style scoped>
.admin-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

