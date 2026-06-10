<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, FolderOpened } from '@element-plus/icons-vue'

import { useAuthStore } from '@/stores/auth'
import {
  createSavedIssueQueryId,
  deleteSavedIssueQuery,
  listSavedIssueQueries,
  saveIssueQuery,
} from '@/utils/issue-saved-queries'
import { serializeFiltersToQuery } from '@/utils/issue-filters'
import type { IssueFilterRow, SavedIssueQuery } from '@/types/issue-filter'

const props = defineProps<{
  projectId: number | null
  filterRows: IssueFilterRow[]
  keyword: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}>()

const emit = defineEmits<{
  (e: 'load', payload: { filters: string; keyword: string; sortBy: string; sortOrder: 'asc' | 'desc' }): void
}>()

const auth = useAuthStore()
const selectedId = ref('')
const saveDialogVisible = ref(false)
const saveName = ref('')

const userId = computed(() => auth.user?.id ?? null)

const savedQueries = computed(() => {
  if (userId.value == null) return []
  return listSavedIssueQueries(userId.value, props.projectId)
})

function openSaveDialog() {
  saveName.value = ''
  saveDialogVisible.value = true
}

function confirmSave() {
  const name = saveName.value.trim()
  if (!name) {
    ElMessage.warning('请输入查询名称')
    return
  }
  if (userId.value == null) {
    ElMessage.warning('请先登录')
    return
  }
  const filters = serializeFiltersToQuery(props.filterRows)
  if (!filters && !props.keyword.trim()) {
    ElMessage.warning('当前没有可保存的筛选条件')
    return
  }

  const item: SavedIssueQuery = {
    id: createSavedIssueQueryId(),
    name,
    projectId: props.projectId,
    filters,
    keyword: props.keyword.trim() || undefined,
    sortBy: props.sortBy,
    sortOrder: props.sortOrder,
    createdAt: Date.now(),
  }
  saveIssueQuery(userId.value, item)
  selectedId.value = item.id
  saveDialogVisible.value = false
  ElMessage.success('自定义查询已保存')
}

function onSelectQuery(id: string) {
  if (!id || userId.value == null) return
  const q = savedQueries.value.find((x) => x.id === id)
  if (!q) return
  emit('load', {
    filters: q.filters,
    keyword: q.keyword ?? '',
    sortBy: q.sortBy ?? 'updated_on',
    sortOrder: q.sortOrder ?? 'desc',
  })
}

async function onDeleteQuery() {
  if (!selectedId.value || userId.value == null) return
  const q = savedQueries.value.find((x) => x.id === selectedId.value)
  if (!q) return
  try {
    await ElMessageBox.confirm(`确认删除自定义查询「${q.name}」？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  deleteSavedIssueQuery(userId.value, selectedId.value)
  selectedId.value = ''
  ElMessage.success('已删除')
}
</script>

<template>
  <div v-if="userId != null" class="saved-query-bar">
    <el-icon class="saved-query-bar__icon"><FolderOpened /></el-icon>
    <el-select
      v-model="selectedId"
      clearable
      placeholder="自定义查询"
      class="saved-query-bar__select"
      @change="onSelectQuery"
    >
      <el-option v-for="q in savedQueries" :key="q.id" :label="q.name" :value="q.id" />
    </el-select>
    <el-button :icon="Document" @click="openSaveDialog">保存</el-button>
    <el-button v-if="selectedId" link type="danger" @click="onDeleteQuery">删除</el-button>

    <el-dialog v-model="saveDialogVisible" title="保存自定义查询" width="400px" append-to-body>
      <el-input v-model="saveName" placeholder="查询名称" maxlength="64" show-word-limit />
      <template #footer>
        <el-button @click="saveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.saved-query-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.saved-query-bar__icon {
  color: var(--el-text-color-secondary);
}

.saved-query-bar__select {
  width: 200px;
}
</style>
