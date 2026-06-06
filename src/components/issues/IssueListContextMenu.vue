<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, MoreFilled } from '@element-plus/icons-vue'

import {
  assignIssue,
  copyIssue,
  deleteIssue,
  fetchIssuePriorities,
  fetchIssueTransitions,
  updateIssue,
  updateIssueStatus,
} from '@/services/issues'
import { fetchIssueCategories, fetchProjectDetail, fetchProjectMembers } from '@/services/projects'
import { fetchTrackerList } from '@/services/trackers'
import { parseBackendErrorMessage } from '@/utils/http-error'
import { memberDisplayName } from '@/utils/project-members'
import type { IssueCategoryItem, IssuePriorityItem } from '@/types/issue-filter'
import type { IssueDetail, IssueListItem } from '@/types/issue'
import type { AvailableTransition } from '@/types/workflow'
import type { ProjectMember } from '@/types/project'
import type { TrackerListItem } from '@/types/tracker'

const props = defineProps<{
  row: IssueListItem
  /** 路由级项目 ID；全局列表时传 null，使用 row.projectId */
  routeProjectId: number | null
}>()

const emit = defineEmits<{
  (e: 'change', detail: IssueDetail): void
  (e: 'copied', detail: IssueDetail): void
  (e: 'deleted', issueId: number): void
}>()

const router = useRouter()

const menuLoading = ref(false)
const actionLoading = ref(false)
const transitions = ref<AvailableTransition[]>([])
const priorities = ref<IssuePriorityItem[]>([])
const members = ref<ProjectMember[]>([])
const categories = ref<IssueCategoryItem[]>([])
const trackers = ref<TrackerListItem[]>([])

const DONE_RATIO_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

const effectiveProjectId = computed(() => props.routeProjectId ?? props.row.projectId)

const assigneeOptions = computed(() => {
  const opts = [{ userId: 0, label: '未分配' }]
  for (const m of members.value) {
    opts.push({ userId: m.userId, label: memberDisplayName(m) })
  }
  return opts
})

const categoryOptions = computed(() => {
  const opts = [{ id: 0, name: '无' }]
  return opts.concat(categories.value.map((c) => ({ id: c.id, name: c.name })))
})

let prioritiesLoaded = false

async function loadMenuOptions() {
  const pid = effectiveProjectId.value
  if (pid == null) return

  menuLoading.value = true
  try {
    const tasks: Promise<unknown>[] = [
      fetchIssueTransitions(props.row.id).then((t) => {
        transitions.value = t.availableTransitions ?? []
      }),
      fetchProjectMembers(pid, { current: 1, size: 200 }).then((page) => {
        members.value = page.records ?? []
      }),
      fetchIssueCategories(pid).then((page) => {
        categories.value = page.records ?? []
      }),
      Promise.all([
        fetchTrackerList({ current: 1, size: 100 }),
        fetchProjectDetail(pid),
      ]).then(([trackerPage, project]) => {
        const allowed = project.trackerIds?.length ? new Set(project.trackerIds) : null
        const list = trackerPage.records ?? []
        trackers.value =
          allowed != null ? list.filter((t) => allowed.has(t.id)) : list
      }),
    ]
    if (!prioritiesLoaded) {
      tasks.push(
        fetchIssuePriorities().then((list) => {
          priorities.value = list
          prioritiesLoaded = true
        }),
      )
    }
    await Promise.all(tasks)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载菜单选项失败'))
  } finally {
    menuLoading.value = false
  }
}

function onMenuVisible(visible: boolean) {
  if (visible) void loadMenuOptions()
}

function goEdit() {
  const pid = effectiveProjectId.value
  if (pid == null) {
    ElMessage.warning('无法解析问题所属项目')
    return
  }
  void router.push({
    name: 'IssueDetail',
    params: { projectId: String(pid), issueId: String(props.row.id) },
  })
}

async function runAction(action: () => Promise<IssueDetail>, successMsg: string) {
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const detail = await action()
    emit('change', detail)
    ElMessage.success(successMsg)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '操作失败'))
  } finally {
    actionLoading.value = false
  }
}

function onSelectStatus(statusId: number) {
  if (statusId === props.row.statusId) return
  void runAction(
    () => updateIssueStatus(props.row.id, { statusId }),
    '状态已更新',
  )
}

function onSelectPriority(priorityId: number) {
  if (priorityId === props.row.priorityId) return
  void runAction(
    () => updateIssue(props.row.id, { priorityId }),
    '优先级已更新',
  )
}

function onSelectTracker(trackerId: number) {
  if (trackerId === props.row.trackerId) return
  void runAction(
    () => updateIssue(props.row.id, { trackerId }),
    '跟踪器已更新',
  )
}

function onSelectAssignee(userId: number) {
  const current = props.row.assignedToId ?? 0
  if (userId === current) return
  void runAction(
    () => assignIssue(props.row.id, { assignedToId: userId === 0 ? 0 : userId }),
    '指派人已更新',
  )
}

function onSelectCategory(categoryId: number) {
  void runAction(
    () => updateIssue(props.row.id, { categoryId }),
    '类别已更新',
  )
}

function onSelectDoneRatio(ratio: number) {
  if (ratio === props.row.doneRatio) return
  void runAction(
    () => updateIssue(props.row.id, { doneRatio: ratio }),
    '完成度已更新',
  )
}

async function onCopyLink() {
  const pid = effectiveProjectId.value
  if (pid == null) {
    ElMessage.warning('无法解析问题所属项目')
    return
  }
  const resolved = router.resolve({
    name: 'IssueDetail',
    params: { projectId: String(pid), issueId: String(props.row.id) },
  })
  const url = `${window.location.origin}${resolved.href}`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.error('复制链接失败')
  }
}

async function onCopyIssue() {
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const detail = await copyIssue(props.row.id, {})
    emit('copied', detail)
    ElMessage.success(`已复制为 #${detail.id}`)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '复制问题失败'))
  } finally {
    actionLoading.value = false
  }
}

async function onDelete() {
  try {
    await ElMessageBox.confirm(`确认删除问题 #${props.row.id}？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    await deleteIssue(props.row.id)
    emit('deleted', props.row.id)
    ElMessage.success('问题已删除')
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '删除问题失败'))
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <el-dropdown trigger="click" @visible-change="onMenuVisible">
    <el-button link type="primary" class="issue-row-menu__trigger" :loading="actionLoading">
      <el-icon><MoreFilled /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu v-loading="menuLoading" class="issue-row-menu">
        <el-dropdown-item @click="goEdit">编辑</el-dropdown-item>

        <el-dropdown-item divided @click.stop>
          <el-dropdown
            placement="right-start"
            trigger="hover"
            popper-class="issue-row-menu__submenu"
          >
            <span class="issue-row-menu__submenu-label">
              状态
              <el-icon><ArrowRight /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="t in transitions"
                  :key="t.statusId"
                  :disabled="t.statusId === row.statusId"
                  @click="onSelectStatus(t.statusId)"
                >
                  {{ t.statusName }}
                </el-dropdown-item>
                <el-dropdown-item v-if="transitions.length === 0" disabled>
                  无可用转换
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-dropdown-item>

        <el-dropdown-item @click.stop>
          <el-dropdown placement="right-start" trigger="hover" popper-class="issue-row-menu__submenu">
            <span class="issue-row-menu__submenu-label">
              跟踪器
              <el-icon><ArrowRight /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="t in trackers"
                  :key="t.id"
                  :disabled="t.id === row.trackerId"
                  @click="onSelectTracker(t.id)"
                >
                  {{ t.name }}
                </el-dropdown-item>
                <el-dropdown-item v-if="trackers.length === 0" disabled>
                  无可用跟踪器
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-dropdown-item>

        <el-dropdown-item @click.stop>
          <el-dropdown placement="right-start" trigger="hover" popper-class="issue-row-menu__submenu">
            <span class="issue-row-menu__submenu-label">
              优先级
              <el-icon><ArrowRight /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="p in priorities"
                  :key="p.id"
                  :disabled="p.id === row.priorityId"
                  @click="onSelectPriority(p.id)"
                >
                  {{ p.name }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-dropdown-item>

        <el-dropdown-item @click.stop>
          <el-dropdown placement="right-start" trigger="hover" popper-class="issue-row-menu__submenu">
            <span class="issue-row-menu__submenu-label">
              指派给
              <el-icon><ArrowRight /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="issue-row-menu__scroll">
                <el-dropdown-item
                  v-for="a in assigneeOptions"
                  :key="a.userId"
                  :disabled="a.userId === (row.assignedToId ?? 0)"
                  @click="onSelectAssignee(a.userId)"
                >
                  {{ a.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-dropdown-item>

        <el-dropdown-item v-if="categoryOptions.length > 1" @click.stop>
          <el-dropdown placement="right-start" trigger="hover" popper-class="issue-row-menu__submenu">
            <span class="issue-row-menu__submenu-label">
              类别
              <el-icon><ArrowRight /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="c in categoryOptions"
                  :key="c.id"
                  @click="onSelectCategory(c.id)"
                >
                  {{ c.name }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-dropdown-item>

        <el-dropdown-item @click.stop>
          <el-dropdown placement="right-start" trigger="hover" popper-class="issue-row-menu__submenu">
            <span class="issue-row-menu__submenu-label">
              % 完成
              <el-icon><ArrowRight /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="issue-row-menu__scroll">
                <el-dropdown-item
                  v-for="ratio in DONE_RATIO_OPTIONS"
                  :key="ratio"
                  :disabled="ratio === row.doneRatio"
                  @click="onSelectDoneRatio(ratio)"
                >
                  {{ ratio }}%
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-dropdown-item>

        <el-dropdown-item divided @click="onCopyLink">复制链接</el-dropdown-item>
        <el-dropdown-item @click="onCopyIssue">复制</el-dropdown-item>
        <el-dropdown-item @click="onDelete">
          <span class="issue-row-menu__danger">删除问题</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.issue-row-menu__trigger {
  padding: 4px;
  font-size: 18px;
}

.issue-row-menu__submenu-label {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 120px;
  gap: 8px;
}

.issue-row-menu__danger {
  color: var(--el-color-danger);
}
</style>

<style>
.issue-row-menu__submenu .el-dropdown-menu__item {
  padding-right: 12px;
}

.issue-row-menu__scroll {
  max-height: 280px;
  overflow-y: auto;
}
</style>
