<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

import { fetchProjectMembers } from '@/services/projects'
import { parseBackendErrorMessage } from '@/utils/http-error'
import type { ProjectMember } from '@/types/project'

const route = useRoute()

const loading = ref(false)
const members = ref<ProjectMember[]>([])
const total = ref(0)
const query = ref({ current: 1, size: 10 })

const projectId = computed(() => {
  const id = Number(route.params.projectId)
  return Number.isNaN(id) ? null : id
})

function roleNames(row: ProjectMember) {
  return row.roles?.map((r) => r.roleName).filter(Boolean).join('、') || '—'
}

async function loadMembers() {
  const id = projectId.value
  if (id == null) return
  loading.value = true
  try {
    const page = await fetchProjectMembers(id, {
      current: query.value.current,
      size: query.value.size,
    })
    members.value = page.records ?? []
    total.value = page.total ?? 0
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载成员失败'))
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.projectId,
  () => {
    query.value.current = 1
    void loadMembers()
  },
  { immediate: true },
)
</script>

<template>
  <el-card class="jr-panel" shadow="never">
    <template #header>
      <div class="list-header">
        <span>成员</span>
      </div>
    </template>

    <el-table v-loading="loading" :data="members" stripe style="width: 100%">
      <el-table-column prop="login" label="登录名" width="140" />
      <el-table-column label="姓名" min-width="120">
        <template #default="{ row }">
          {{ [row.firstname, row.lastname].filter(Boolean).join(' ') || '—' }}
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
      <el-table-column label="角色" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ roleNames(row) }}</template>
      </el-table-column>
    </el-table>
    <div class="members-pagination">
      <el-pagination
        v-model:current-page="query.current"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadMembers"
        @size-change="() => { query.current = 1; loadMembers() }"
      />
    </div>
  </el-card>
</template>

<style scoped>
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.members-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
