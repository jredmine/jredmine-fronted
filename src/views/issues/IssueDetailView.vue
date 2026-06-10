<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import IssueFormDialog from '@/views/issues/IssueFormDialog.vue'
import { fetchIssueDetail } from '@/services/issues'
import { fetchProjectDetail } from '@/services/projects'
import { useProjectContextStore } from '@/stores/project-context'
import { formatDateTime, formatRelativeTimeZh } from '@/utils/datetime'
import { parseBackendErrorMessage } from '@/utils/http-error'
import { renderMarkdown } from '@/utils/wiki-content'
import type { IssueDetail } from '@/types/issue'

const route = useRoute()
const router = useRouter()
const ctx = useProjectContextStore()

const loading = ref(false)
const detail = ref<IssueDetail | null>(null)
const editVisible = ref(false)

const projectId = computed(() => {
  const id = Number(route.params.projectId)
  return Number.isNaN(id) ? null : id
})

const issueId = computed(() => {
  const id = Number(route.params.issueId)
  return Number.isNaN(id) ? null : id
})

const issueOpenLabel = computed(() => (detail.value?.closedOn ? '已关闭' : '打开'))

const createdRelative = computed(() => formatRelativeTimeZh(detail.value?.createdOn))

const descriptionHtml = computed(() => renderMarkdown(detail.value?.description))

const editProjectId = computed(() => projectId.value ?? detail.value?.projectId ?? null)

function onEditSuccess(updated?: IssueDetail) {
  if (!updated) {
    void loadDetail()
    return
  }
  detail.value = updated
  const newPid = updated.projectId
  if (newPid != null && newPid !== projectId.value) {
    void router.push({
      name: 'IssueDetail',
      params: { projectId: String(newPid), issueId: String(updated.id) },
    })
  }
}

function goParentIssue(parentId: number) {
  const pid = detail.value?.projectId ?? projectId.value
  if (pid == null) return
  void router.push({
    name: 'IssueDetail',
    params: { projectId: String(pid), issueId: String(parentId) },
  })
}

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
    ElMessage.error(parseBackendErrorMessage(e, '加载问题详情失败'))
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
  <el-card v-loading="loading" class="jr-panel issue-detail" shadow="never">
    <template v-if="detail">
      <div class="issue-heading">
        <div class="issue-heading__top">
          <div class="issue-heading__meta">
            <span class="issue-heading__tracker">{{ detail.trackerName || '—' }}</span>
            <span class="issue-heading__id">#{{ detail.id }}</span>
            <span class="issue-heading__state">[{{ issueOpenLabel }}]</span>
          </div>
          <div class="issue-heading__actions">
            <el-button type="primary" @click="editVisible = true">编辑</el-button>
            <el-button
              :disabled="projectId == null"
              @click="router.push({ name: 'IssueList', params: { projectId: String(projectId) } })"
            >
              返回列表
            </el-button>
          </div>
        </div>

        <h1 class="issue-heading__subject">{{ detail.subject || '—' }}</h1>

        <p v-if="detail.authorName || detail.createdOn" class="issue-heading__created">
          由
          <span class="issue-heading__author">{{ detail.authorName || '—' }}</span>
          在
          <span class="issue-heading__time">[{{ formatDateTime(detail.createdOn) }}]</span>
          <template v-if="createdRelative">
            {{ createdRelative }} 之前
          </template>
          添加。
        </p>
      </div>

      <el-descriptions class="issue-detail__attrs" :column="2" border>
        <el-descriptions-item label="项目">{{ detail.projectName || detail.projectId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.statusName || detail.statusId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="优先级">{{ detail.priorityName || detail.priorityId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="指派给">{{ detail.assignedToName || detail.assignedToId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="类别">{{ detail.categoryName || detail.categoryId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="父任务">
          <el-button
            v-if="detail.parentId"
            link
            type="primary"
            @click="goParentIssue(detail.parentId)"
          >
            #{{ detail.parentId }}
          </el-button>
          <span v-else>—</span>
        </el-descriptions-item>
        <el-descriptions-item label="目标版本">{{ detail.fixedVersionName || detail.fixedVersionId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ detail.startDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="截止日期">{{ detail.dueDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="完成度">{{ detail.doneRatio != null ? `${detail.doneRatio}%` : '—' }}</el-descriptions-item>
        <el-descriptions-item label="预估工时">{{ detail.estimatedHours ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updatedOn || '—' }}</el-descriptions-item>
        <el-descriptions-item label="私有">{{ detail.isPrivate ? '是' : '否' }}</el-descriptions-item>
      </el-descriptions>

      <section class="issue-detail__description">
        <h2 class="issue-detail__description-title">描述</h2>
        <div
          v-if="descriptionHtml"
          class="jr-markdown-body issue-detail__description-body"
          v-html="descriptionHtml"
        />
        <p v-else class="issue-detail__description-empty">暂无描述。</p>
      </section>

      <IssueFormDialog
        v-model="editVisible"
        mode="edit"
        :issue-id="issueId"
        :project-id="editProjectId"
        @success="onEditSuccess"
      />
    </template>
  </el-card>
</template>

<style scoped>
.issue-heading {
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.issue-heading__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.issue-heading__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  color: var(--el-text-color-regular);
}

.issue-heading__tracker,
.issue-heading__id {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.issue-heading__id {
  color: var(--jr-brand);
}

.issue-heading__state {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.25;
  color: var(--el-text-color-secondary);
}

.issue-heading__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.issue-heading__subject {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
}

.issue-heading__created {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
}

.issue-heading__author {
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.issue-heading__time {
  font-variant-numeric: tabular-nums;
}

.issue-detail__attrs {
  margin-top: 4px;
}

.issue-detail__description {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.issue-detail__description-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.issue-detail__description-body {
  padding: 4px 0;
}

.issue-detail__description-empty {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
</style>
