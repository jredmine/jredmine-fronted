<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { createWikiPage, fetchWikiPageList } from '@/services/wiki'
import { parseBackendErrorMessage } from '@/utils/http-error'
import type { WikiPageDetail, WikiPageListItem } from '@/types/wiki'

const props = defineProps<{
  modelValue: boolean
  projectId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success', page: WikiPageDetail): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const saving = ref(false)
const pagesLoading = ref(false)
const parentOptions = ref<WikiPageListItem[]>([])
const formRef = ref<FormInstance>()

const form = reactive({
  title: '',
  parentId: undefined as number | undefined,
  isProtected: false,
  text: '',
  comments: '',
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入页面标题', trigger: 'blur' }],
}

async function loadParentOptions() {
  if (props.projectId == null) return
  pagesLoading.value = true
  try {
    const page = await fetchWikiPageList(props.projectId, { current: 1, size: 200 })
    parentOptions.value = page.records ?? []
  } catch {
    parentOptions.value = []
  } finally {
    pagesLoading.value = false
  }
}

function resetForm() {
  form.title = ''
  form.parentId = undefined
  form.isProtected = false
  form.text = ''
  form.comments = ''
  formRef.value?.clearValidate()
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm()
      void loadParentOptions()
    }
  },
)

async function submit() {
  if (!formRef.value || props.projectId == null) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const page = await createWikiPage(props.projectId, {
      title: form.title.trim(),
      parentId: form.parentId ?? undefined,
      isProtected: form.isProtected,
      text: form.text.trim() || undefined,
      comments: form.comments.trim() || undefined,
    })
    ElMessage.success('Wiki 页面已创建')
    visible.value = false
    emit('success', page)
  } catch (e) {
    ElMessage.error(parseBackendErrorMessage(e, '创建 Wiki 页面失败'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="新建 Wiki 页面" width="560px" append-to-body :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" v-loading="pagesLoading">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="同一 Wiki 下标题唯一" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item label="父页面">
        <el-select
          v-model="form.parentId"
          clearable
          filterable
          placeholder="无（顶级页面）"
          style="width: 100%"
        >
          <el-option v-for="p in parentOptions" :key="p.id" :label="p.title" :value="p.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="保护页面">
        <el-switch v-model="form.isProtected" />
        <span class="field-hint">开启后仅具备 manage_wiki 权限的用户可编辑</span>
      </el-form-item>
      <el-form-item label="正文">
        <el-input v-model="form.text" type="textarea" :rows="6" placeholder="可选，支持 Textile / Markdown（以后端为准）" />
      </el-form-item>
      <el-form-item label="版本备注">
        <el-input v-model="form.comments" placeholder="可选" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">创建</el-button>
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
