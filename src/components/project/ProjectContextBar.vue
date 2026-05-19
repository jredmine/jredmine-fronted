<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'

import WikiPageCreateDialog from '@/views/projects/WikiPageCreateDialog.vue'
import { fetchProjectDetail } from '@/services/projects'
import { useProjectContextStore } from '@/stores/project-context'
import { parseBackendErrorMessage } from '@/utils/http-error'

const route = useRoute()
const router = useRouter()
const ctx = useProjectContextStore()
const { currentProject } = storeToRefs(ctx)

const projectIdParam = computed(() => {
  const p = route.params.projectId
  if (typeof p === 'string') return p
  if (Array.isArray(p) && p[0]) return p[0]
  return ''
})

const projectIdNum = computed(() => {
  const n = Number(projectIdParam.value)
  return Number.isNaN(n) ? null : n
})

const tabs = [
  { routeName: 'ProjectOverview' as const, label: '概览' },
  { routeName: 'IssueList' as const, label: '问题' },
  { routeName: 'ProjectMembers' as const, label: '成员' },
  { routeName: 'ProjectWiki' as const, label: 'Wiki' },
]

const activeRouteName = computed(() => {
  const n = route.name
  if (n === 'IssueDetail') return 'IssueList'
  return n as string
})

function isTabActive(routeName: string) {
  return activeRouteName.value === routeName
}

function goTab(routeName: (typeof tabs)[number]['routeName']) {
  const pid = projectIdParam.value
  if (!pid) return
  void router.push({ name: routeName, params: { projectId: pid } })
}

function goProjectList() {
  void router.push({ name: 'ProjectList' })
}

const wikiCreateVisible = ref(false)

const wikiModuleEnabled = computed(() => {
  const modules = currentProject.value?.enabledModules
  if (!modules || modules.length === 0) return true
  return modules.includes('wiki')
})

function openWikiCreate() {
  if (!wikiModuleEnabled.value) {
    ElMessage.warning('当前项目未启用 Wiki 模块')
    return
  }
  wikiCreateVisible.value = true
}

function onQuickAddCommand(cmd: string) {
  if (cmd === 'wiki') openWikiCreate()
}

function onWikiCreateSuccess() {
  ctx.notifyWikiPagesChanged()
  if (route.name !== 'ProjectWiki') {
    const pid = projectIdParam.value
    if (pid) void router.push({ name: 'ProjectWiki', params: { projectId: pid } })
  }
}

watch(
  () => projectIdParam.value,
  async (pid) => {
    if (!pid) {
      ctx.clear()
      return
    }
    const id = Number(pid)
    if (Number.isNaN(id)) {
      ctx.clear()
      return
    }
    if (currentProject.value?.id === id) return
    try {
      const d = await fetchProjectDetail(id)
      ctx.setProject(d)
      const appTitle = import.meta.env.VITE_APP_TITLE || 'JRedmine'
      document.title = `${d.name} - ${appTitle}`
    } catch (e) {
      ctx.clear()
      ElMessage.error(parseBackendErrorMessage(e, '加载项目信息失败'))
    }
  },
  { immediate: true },
)

</script>

<template>
  <div v-if="projectIdNum != null" class="project-context">
    <div class="project-context__top">
      <el-button text class="project-context__back" @click="goProjectList">
        <el-icon><ArrowLeft /></el-icon>
        项目列表
      </el-button>
      <div class="project-context__title-block">
        <h2 class="project-context__title">{{ currentProject?.name ?? '…' }}</h2>
        <span v-if="currentProject?.identifier" class="project-context__id">{{ currentProject.identifier }}</span>
      </div>
    </div>
    <nav class="project-context__tabs" aria-label="项目功能">
      <el-dropdown trigger="click" placement="bottom-start" @command="onQuickAddCommand">
        <button type="button" class="project-context__quick-add" aria-label="新建">
          <el-icon><Plus /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="wiki" :disabled="!wikiModuleEnabled">新建 Wiki 页面</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <button
        v-for="tab in tabs"
        :key="tab.routeName"
        type="button"
        class="project-context__tab"
        :class="{ 'is-active': isTabActive(tab.routeName) }"
        @click="goTab(tab.routeName)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <WikiPageCreateDialog
      v-model="wikiCreateVisible"
      :project-id="projectIdNum"
      @success="onWikiCreateSuccess"
    />
  </div>
</template>

<style scoped>
.project-context {
  margin-bottom: 20px;
  padding: 16px 20px 0;
  background: #fff;
  border-radius: var(--jr-radius-lg);
  box-shadow: var(--jr-shadow-md);
  border: 1px solid var(--el-border-color-lighter);
}

.project-context__top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px 20px;
  padding-bottom: 12px;
}

.project-context__back {
  padding: 4px 8px 4px 4px;
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.project-context__back:hover {
  color: var(--el-color-primary);
}

.project-context__title-block {
  flex: 1;
  min-width: 0;
}

.project-context__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.35;
  color: var(--el-text-color-primary);
}

.project-context__id {
  display: inline-block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: ui-monospace, monospace;
}

.project-context__tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 4px;
  margin: 0 -4px;
  padding-bottom: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.project-context__quick-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0 4px 6px 8px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, transform 0.15s ease;
}

.project-context__quick-add:hover {
  background: var(--el-color-primary-light-3);
}

.project-context__quick-add:focus-visible {
  outline: 2px solid var(--el-color-primary-light-5);
  outline-offset: 2px;
}

.project-context__tab {
  position: relative;
  margin: 0;
  padding: 10px 16px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.project-context__tab:hover {
  color: var(--el-color-primary);
  background: var(--jr-brand-soft);
}

.project-context__tab.is-active {
  color: var(--el-color-primary);
  font-weight: 600;
}

.project-context__tab.is-active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--el-color-primary);
}
</style>
