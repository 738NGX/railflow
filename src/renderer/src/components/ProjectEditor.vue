<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Project from '../../../../types/project'
import { ElInput, ElButton, ElMessage } from 'element-plus'

const props = defineProps<{
  project: Project | null
}>()

const emit = defineEmits(['project-updated'])
const editableProjectName = ref('')

const selectedProject = computed(() => {
  return props.project
})

watch(selectedProject, (newVal) => {
  if (newVal) {
    editableProjectName.value = newVal.name
  }
}, { immediate: true })

async function handleUpdateProjectName() {
  if (!selectedProject.value) return
  if (!editableProjectName.value.trim()) {
    ElMessage.warning('项目名称不能为空')
    return
  }
  try {
    const result = await window.api.updateProject(selectedProject.value.id, { name: editableProjectName.value })
    if (result.success) {
      ElMessage.success('项目名称更新成功')
      emit('project-updated')
    } else {
      ElMessage.error('更新项目名称失败')
    }
  } catch (error) {
    console.error('Failed to update project name:', error)
    ElMessage.error('更新项目名称失败')
  }
}
</script>

<template>
  <div v-if="selectedProject" class="p-4">
    <h2>编辑项目: {{ selectedProject.name }}</h2>
    <div class="mt-4">
      <el-input v-model="editableProjectName" placeholder="项目名称" />
      <el-button class="mt-2" type="primary" @click="handleUpdateProjectName">保存名称</el-button>
    </div>
    <!-- Placeholder for future extensions -->
    <div class="mt-8">
      <h3>其他设置</h3>
      <p>这里可以添加更多项目相关的设置。</p>
    </div>
  </div>
  <div v-else class="p-4 text-center text-gray-500">
    <p>请从左侧选择一个项目进行编辑</p>
  </div>
</template>
