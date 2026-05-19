<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import WikiPageCreateDialog from '@/views/projects/WikiPageCreateDialog.vue'
import WikiPageEditDialog from '@/views/projects/WikiPageEditDialog.vue'
import { fetchProjectWiki, fetchWikiPage, fetchWikiPageList, updateProjectWiki } from '@/services/wiki'
import { useProjectContextStore } from '@/stores/project-context'
import { parseBackendErrorMessage } from '@/utils/http-error'
import { renderWikiMarkdown } from '@/utils/wiki-content'
import type { WikiInfo, WikiPageDetail, WikiPageListItem } from '@/types/wiki'

const route = useRoute()
const ctx = useProjectContextStore()
const { wikiPagesVersion } = storeToRefs(ctx)

const loading = ref(false)
const pageLoading = ref(false)
const saving = ref(false)
const wikiInfo = ref<WikiInfo | null>(null)
const pageOptions = ref<WikiPageListItem[]>([])
const currentPage = ref<WikiPageDetail | null>(null)
const viewingTitle = ref<string | null>(null)
const startPageMissing = ref(false)
const wikiCreateVisible = ref(false)
const wikiEditVisible = ref(false)
const editingTitle = ref<string | null>(null)
const manageOpen = ref<string[]>([])

const formRef = ref<FormInstance>()
const form = reactive({
  startPage: '',
})

const projectId = computed(() => {
  const id = Number(route.params.projectId)
  return Number.isNaN(id) ? null : id
})

const rules: FormRules = {
  startPage: [{ required: true, message: '请选择 Wiki 首页', trigger: 'change' }],
}

const pageHtml = computed(() => renderWikiMarkdown(currentPage.value?.text))

function wikiStatusLabel(status: number | null | undefined) {
  if (status === 1) return '正常'
  return status != null ? String(status) : '—'
}

function formatDateTime(raw: string | null | undefined): string {
  if (raw == null || raw === '') return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function loadWikiPages(id: number) {
  try {
    const page = await fetchWikiPageList(id, { current: 1, size: 200 })
    pageOptions.value = page.records ?? []
  } catch {
    pageOptions.value = []
  }
}

async function loadPageContent(title: string) {
  const id = projectId.value
  if (id == null || !title) return
  pageLoading.value = true
  currentPage.value = null
  viewingTitle.value = title
  try {
    currentPage.value = await fetchWikiPage(id, title)
    startPageMissing.value = false
  } catch (e) {
    currentPage.value = null
    ElMessage.error(parseBackendErrorMessage(e, `加载页面「${title}」失败`))
  } finally {
    pageLoading.value = false
  }
}

/** 按 start_page 加载首页正文；若首页页面不存在则回退到列表第一项 */
async function loadHomePageContent() {
  const info = wikiInfo.value
  if (!info) return

  const start = info.startPage?.trim()
  if (!start) {
    currentPage.value = null
    viewingTitle.value = null
    return
  }

  const startExists = pageOptions.value.some((p) => p.title === start)
  if (startExists) {
    startPageMissing.value = false
    await loadPageContent(start)
    return
  }

  startPageMissing.value = true
  if (pageOptions.value.length > 0) {
    await loadPageContent(pageOptions.value[0].title)
    return
  }
  currentPage.value = null
  viewingTitle.value = null
}

async function load() {
  const id = projectId.value
  if (id == null) return
  loading.value = true
  try {
    const info = await fetchProjectWiki(id)
    await loadWikiPages(id)
    wikiInfo.value = info
    form.startPage = info.startPage ?? ''
    await loadHomePageContent()
  } catch (e) {
    wikiInfo.value = null
    currentPage.value = null
    ElMessage.error(parseBackendErrorMessage(e, '加载 Wiki 信息失败'))
  } finally {
    loading.value = false
  }
}

async function tryAutoSetStartPage(title: string) {
  const id = projectId.value
  if (id == null || !title) return
  const start = wikiInfo.value?.startPage?.trim() ?? ''
  if (start && pageOptions.value.some((p) => p.title === start)) return

  try {
    const updated = await updateProjectWiki(id, { startPage: title })
    wikiInfo.value = updated
    form.startPage = updated.startPage ?? title
    startPageMissing.value = false
  } catch {
    // 无 manage_wiki 时由用户手动保存首页
  }
}

async function onSave() {
  if (!formRef.value || projectId.value == null) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const updated = await updateProjectWiki(projectId.value, {
      startPage: form.startPage.trim(),
    })
    wikiInfo.value = updated
    form.startPage = updated.startPage ?? form.startPage
    ElMessage.success('Wiki 设置已保存')
    await loadHomePageContent()
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '保存 Wiki 设置失败'))
  } finally {
    saving.value = false
  }
}

function openCreate() {
  wikiCreateVisible.value = true
}

async function onWikiCreated(page: WikiPageDetail) {
  ctx.notifyWikiPagesChanged()
  await load()
  await tryAutoSetStartPage(page.title)
  await loadPageContent(page.title)
}

function openEdit(row: WikiPageListItem) {
  editingTitle.value = row.title
  wikiEditVisible.value = true
}

function openEditCurrent() {
  if (!currentPage.value) return
  openEdit({ title: currentPage.value.title } as WikiPageListItem)
}

async function onWikiEdited(page: WikiPageDetail) {
  ctx.notifyWikiPagesChanged()
  const id = projectId.value
  if (id == null) return
  await loadWikiPages(id)
  if (viewingTitle.value === page.title) {
    currentPage.value = page
  }
}

watch(
  () => route.params.projectId,
  () => {
    void load()
  },
  { immediate: true },
)

watch(wikiPagesVersion, () => {
  const id = projectId.value
  if (id == null || !wikiInfo.value) return
  void (async () => {
    await loadWikiPages(id)
    if (viewingTitle.value) {
      const stillExists = pageOptions.value.some((p) => p.title === viewingTitle.value)
      if (stillExists) await loadPageContent(viewingTitle.value)
      else await loadHomePageContent()
    } else {
      await loadHomePageContent()
    }
  })()
})
</script>

<template>
  <el-card v-loading="loading" class="jr-panel" shadow="never">
    <template #header>
      <div class="wiki-header">
        <span>Wiki</span>
        <el-button type="primary" :disabled="!wikiInfo" @click="openCreate">新建 Wiki 页面</el-button>
      </div>
    </template>

    <template v-if="wikiInfo">
      <el-alert
        v-if="startPageMissing"
        type="warning"
        :closable="false"
        show-icon
        class="wiki-alert"
        :title="`首页「${wikiInfo.startPage}」对应的页面不存在`"
        description="请在下方 Wiki 设置中选择已创建的页面并保存，或创建标题为「Wiki」的页面。"
      />

      <section v-loading="pageLoading" class="wiki-read">
        <template v-if="currentPage">
          <div class="wiki-read__head">
            <h1 class="wiki-read__title">{{ currentPage.title }}</h1>
            <el-button link type="primary" @click="openEditCurrent">编辑</el-button>
          </div>
          <div v-if="pageHtml" class="wiki-read__body wiki-read__body--md" v-html="pageHtml" />
          <p v-else class="wiki-read__empty">此页面暂无正文。</p>
          <p class="wiki-read__meta">
            由 {{ currentPage.authorName || '—' }} 更新于 {{ formatDateTime(currentPage.updatedOn) }}
            <template v-if="currentPage.version != null"> · 版本 {{ currentPage.version }}</template>
            <template v-if="viewingTitle && wikiInfo.startPage === viewingTitle"> · 当前为 Wiki 首页</template>
          </p>
        </template>
        <el-empty
          v-else-if="!pageLoading"
          description="暂无 Wiki 页面内容。请新建页面，并在 Wiki 设置中指定首页。"
        />
      </section>

      <el-collapse v-model="manageOpen" class="wiki-manage">
        <el-collapse-item title="页面列表与管理" name="manage">
          <el-table :data="pageOptions" stripe empty-text="暂无 Wiki 页面">
            <el-table-column prop="title" label="标题" min-width="160">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEdit(row)">{{ row.title }}</el-button>
              </template>
            </el-table-column>
            <el-table-column label="保护" width="80">
              <template #default="{ row }">{{ row.isProtected ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="72" />
            <el-table-column prop="authorName" label="最后更新人" width="120" show-overflow-tooltip />
            <el-table-column label="更新时间" width="160">
              <template #default="{ row }">{{ formatDateTime(row.updatedOn) }}</template>
            </el-table-column>
          </el-table>

          <el-divider content-position="left">Wiki 设置</el-divider>

          <el-descriptions :column="2" border size="small" class="wiki-meta">
            <el-descriptions-item label="Wiki ID">{{ wikiInfo.id }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ wikiStatusLabel(wikiInfo.status) }}</el-descriptions-item>
          </el-descriptions>

          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="wiki-form">
            <el-form-item label="首页（start_page）" prop="startPage">
              <el-select
                v-model="form.startPage"
                filterable
                placeholder="选择已存在的 Wiki 页面标题"
                style="width: 100%; max-width: 480px"
                :disabled="pageOptions.length === 0"
              >
                <el-option v-for="p in pageOptions" :key="p.id" :label="p.title" :value="p.title" />
              </el-select>
              <p class="wiki-hint">保存后上方将展示该页面的正文；须为已存在的页面标题。</p>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" :disabled="pageOptions.length === 0" @click="onSave">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </template>
    <el-empty v-else-if="!loading" description="无法加载 Wiki 信息（请确认项目已启用 Wiki 模块）" />

    <WikiPageCreateDialog v-model="wikiCreateVisible" :project-id="projectId" @success="onWikiCreated" />
    <WikiPageEditDialog
      v-model="wikiEditVisible"
      :project-id="projectId"
      :page-title="editingTitle"
      @success="onWikiEdited"
    />
  </el-card>
</template>

<style scoped>
.wiki-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.wiki-alert {
  margin-bottom: 16px;
}

.wiki-read {
  min-height: 120px;
  margin-bottom: 20px;
  padding: 8px 4px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.wiki-read__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.wiki-read__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.wiki-read__body--md {
  font-size: 14px;
  line-height: 1.65;
  word-break: break-word;
}

.wiki-read__body--md :deep(h1),
.wiki-read__body--md :deep(h2),
.wiki-read__body--md :deep(h3),
.wiki-read__body--md :deep(h4) {
  margin: 1em 0 0.5em;
  font-weight: 600;
  line-height: 1.35;
}

.wiki-read__body--md :deep(h1) {
  font-size: 1.35em;
}

.wiki-read__body--md :deep(p) {
  margin: 0.6em 0;
}

.wiki-read__body--md :deep(ul),
.wiki-read__body--md :deep(ol) {
  margin: 0.6em 0;
  padding-left: 1.5em;
}

.wiki-read__body--md :deep(blockquote) {
  margin: 0.6em 0;
  padding: 0.25em 0 0.25em 1em;
  border-left: 4px solid var(--el-border-color);
  color: var(--el-text-color-secondary);
}

.wiki-read__body--md :deep(pre) {
  margin: 0.75em 0;
  padding: 12px 14px;
  overflow-x: auto;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.wiki-read__body--md :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
}

.wiki-read__body--md :deep(:not(pre) > code) {
  padding: 0.15em 0.35em;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}

.wiki-read__body--md :deep(table) {
  border-collapse: collapse;
  margin: 0.75em 0;
}

.wiki-read__body--md :deep(th),
.wiki-read__body--md :deep(td) {
  border: 1px solid var(--el-border-color-lighter);
  padding: 6px 10px;
}

.wiki-read__body--md :deep(a) {
  color: var(--el-color-primary);
}

.wiki-read__empty {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.wiki-read__meta {
  margin: 20px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.wiki-manage {
  border: none;
}

.wiki-manage :deep(.el-collapse-item__header) {
  font-weight: 600;
}

.wiki-meta {
  margin-bottom: 12px;
}

.wiki-form {
  max-width: 560px;
  margin-top: 12px;
}

.wiki-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
