<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

import ProjectFormDialog from '@/views/projects/ProjectFormDialog.vue'
import { fetchProjectDetail } from '@/services/projects'
import { useProjectContextStore } from '@/stores/project-context'
import { parseBackendErrorMessage } from '@/utils/http-error'

const route = useRoute()
const ctx = useProjectContextStore()
const { currentProject } = storeToRefs(ctx)

const dialogVisible = ref(false)
const refreshLoading = ref(false)

const projectId = computed(() => {
  const id = Number(route.params.projectId)
  return Number.isNaN(id) ? null : id
})

function statusLabel(status: number | null | undefined) {
  if (status === 1) return '活跃'
  if (status === 5) return '关闭'
  if (status === 9) return '归档'
  return status != null ? String(status) : '—'
}

async function refreshDetail() {
  const id = projectId.value
  if (id == null) return
  refreshLoading.value = true
  try {
    const d = await fetchProjectDetail(id)
    ctx.setProject(d)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '刷新项目失败'))
  } finally {
    refreshLoading.value = false
  }
}

function openEdit() {
  dialogVisible.value = true
}

function onFormSuccess() {
  void refreshDetail()
}
</script>

<template>
  <el-card v-loading="refreshLoading" class="jr-panel" shadow="never">
    <template #header>
      <div class="overview-header">
        <span>概览</span>
        <div class="overview-header__actions">
          <el-button type="primary" :disabled="projectId == null" @click="openEdit">编辑项目</el-button>
        </div>
      </div>
    </template>

    <template v-if="currentProject">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标识符">{{ currentProject.identifier || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(currentProject.status) }}</el-descriptions-item>
        <el-descriptions-item label="公开">{{ currentProject.isPublic ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="父项目 ID">{{ currentProject.parentId ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="主页" :span="2">{{ currentProject.homepage || '—' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentProject.description || '—' }}</el-descriptions-item>
      </el-descriptions>
      <p class="hint">模块与跟踪器等字段将在后续与后端详情 DTO 对齐后展示与编辑。</p>
    </template>
    <el-empty v-else description="正在加载项目信息…" />

    <ProjectFormDialog
      v-model="dialogVisible"
      mode="edit"
      :project-id="projectId"
      @success="onFormSuccess"
    />
  </el-card>
</template>

<style scoped>
.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.overview-header__actions {
  display: flex;
  gap: 8px;
}

.hint {
  margin-top: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
