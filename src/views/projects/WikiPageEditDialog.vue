<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { fetchWikiPage, fetchWikiPageList, updateWikiPage } from '@/services/wiki'
import { parseBackendErrorMessage } from '@/utils/http-error'
import type { WikiPageDetail, WikiPageListItem } from '@/types/wiki'

const props = defineProps<{
  modelValue: boolean
  projectId: number | null
  /** 要编辑的页面标题 */
  pageTitle: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success', page: WikiPageDetail): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const loading = ref(false)
const saving = ref(false)
const pagesLoading = ref(false)
const parentOptions = ref<WikiPageListItem[]>([])
const form = reactive({
  title: '',
  parentId: undefined as number | undefined,
  isProtected: false,
  text: '',
  comments: '',
})

async function loadParentOptions(excludeId?: number) {
  if (props.projectId == null) return
  pagesLoading.value = true
  try {
    const page = await fetchWikiPageList(props.projectId, { current: 1, size: 200 })
    parentOptions.value = (page.records ?? []).filter((p) => p.id !== excludeId)
  } catch {
    parentOptions.value = []
  } finally {
    pagesLoading.value = false
  }
}

async function loadPage() {
  if (props.projectId == null || !props.pageTitle) return
  loading.value = true
  try {
    const detail = await fetchWikiPage(props.projectId, props.pageTitle)
    form.title = detail.title
    form.parentId = detail.parentId ?? undefined
    form.isProtected = Boolean(detail.isProtected)
    form.text = detail.text ?? ''
    form.comments = ''
    await loadParentOptions(detail.id)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '加载 Wiki 页面失败'))
    visible.value = false
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.pageTitle) {
      void loadPage()
    }
  },
)

async function submit() {
  if (props.projectId == null || !props.pageTitle) return

  saving.value = true
  try {
    const page = await updateWikiPage(props.projectId, props.pageTitle, {
      parentId: form.parentId ?? null,
      isProtected: form.isProtected,
      text: form.text,
      comments: form.comments.trim() || undefined,
    })
    ElMessage.success('Wiki 页面已更新')
    visible.value = false
    emit('success', page)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '更新 Wiki 页面失败'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`编辑 Wiki 页面${form.title ? `：${form.title}` : ''}`"
    width="560px"
    append-to-body
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-position="top" v-loading="loading || pagesLoading">
      <el-form-item label="标题">
        <el-input v-model="form.title" disabled />
      </el-form-item>
      <el-form-item label="父页面">
        <el-select v-model="form.parentId" clearable filterable placeholder="无（顶级页面）" style="width: 100%">
          <el-option v-for="p in parentOptions" :key="p.id" :label="p.title" :value="p.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="保护页面">
        <el-switch v-model="form.isProtected" />
        <span class="field-hint">开启后仅具备 manage_wiki 权限的用户可编辑</span>
      </el-form-item>
      <el-form-item label="正文">
        <el-input v-model="form.text" type="textarea" :rows="8" placeholder="支持 Markdown" />
      </el-form-item>
      <el-form-item label="版本备注">
        <el-input v-model="form.comments" placeholder="可选，保存时写入新版本备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="loading" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.field-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
