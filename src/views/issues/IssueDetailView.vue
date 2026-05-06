<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { fetchIssueDetail } from '@/services/issues'
import { fetchProjectDetail } from '@/services/projects'
import { useProjectContextStore } from '@/stores/project-context'
import { parseBackendErrorMessage } from '@/utils/http-error'
import type { IssueDetail } from '@/types/issue'

const route = useRoute()
const router = useRouter()
const ctx = useProjectContextStore()

const loading = ref(false)
const detail = ref<IssueDetail | null>(null)

const projectId = computed(() => {
  const id = Number(route.params.projectId)
  return Number.isNaN(id) ? null : id
})

const issueId = computed(() => {
  const id = Number(route.params.issueId)
  return Number.isNaN(id) ? null : id
})

async function loadProjectContext() {
  const pid = projectId.value
  if (pid == null) return
  try {
    const d = await fetchProjectDetail(pid)
    ctx.setProject(d)
  } catch {
    // ignore
  }
}

async function loadDetail() {
  const id = issueId.value
  if (id == null) return
  loading.value = true
  try {
    detail.value = await fetchIssueDetail(id)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载任务详情失败'))
    detail.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => [route.params.projectId, route.params.issueId],
  () => {
    void loadProjectContext()
    void loadDetail()
  },
  { immediate: true },
)
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <template #header>
      <div class="detail-header">
        <span>任务详情</span>
        <div class="detail-header__actions">
          <el-button
            :disabled="projectId == null"
            @click="router.push({ name: 'IssueList', params: { projectId: String(projectId) } })"
          >
            返回列表
          </el-button>
        </div>
      </div>
    </template>

    <template v-if="detail">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="项目">{{ detail.projectName || detail.projectId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="跟踪器">{{ detail.trackerName || detail.trackerId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.statusName || detail.statusId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="优先级">{{ detail.priorityName || detail.priorityId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="指派给">{{ detail.assignedToName || detail.assignedToId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ detail.startDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="截止日期">{{ detail.dueDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="完成度">{{ detail.doneRatio != null ? `${detail.doneRatio}%` : '—' }}</el-descriptions-item>
        <el-descriptions-item label="预估工时">{{ detail.estimatedHours ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="创建者">{{ detail.authorName || detail.authorId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createdOn || '—' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updatedOn || '—' }}</el-descriptions-item>
        <el-descriptions-item label="私有">{{ detail.isPrivate ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="标题" :span="2">{{ detail.subject || '—' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          <div class="desc">{{ detail.description || '—' }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </template>
  </el-card>
</template>

<style scoped>
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-header__actions {
  display: flex;
  gap: 8px;
}

.desc {
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>

