<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  ElContainer,
  ElAside,
  ElMain,
  ElButton,
  ElDialog,
  ElInput,
  ElMessageBox,
  ElMessage,
  ElTable,
  ElTableColumn
} from 'element-plus'
import Project from 'src/utils/project'
import { useProjectStore } from '@/stores/project'
import ProjectEditor from '@/components/ProjectEditor.vue'

const projects = ref<Project[]>([])
const dialogVisible = ref(false)
const newProjectName = ref('')
const projectStore = useProjectStore()

const selectedProject = computed(() => {
  return projects.value.find(p => p.id === projectStore.selectedProjectId) || null
})

async function loadProjects() {
  try {
    const projectList = await window.api.getProjects()
    projects.value = projectList
  } catch (error) {
    console.error('Failed to load projects:', error)
    ElMessage.error('加载项目列表失败')
  }
}

async function handleAddProject() {
  if (!newProjectName.value.trim()) {
    ElMessage.warning('项目名称不能为空')
    return
  }
  try {
    const newProject = await window.api.addProject(newProjectName.value)
    ElMessage.success('项目添加成功')
    dialogVisible.value = false
    newProjectName.value = ''
    await loadProjects()
    projectStore.selectProject(newProject.id)
  } catch (error) {
    console.error('Failed to add project:', error)
    ElMessage.error('添加项目失败')
  }
}

async function handleDeleteProject(projectId: string, projectName: string) {
  try {
    await ElMessageBox.confirm(`确定要删除项目 "${projectName}" 吗？此操作不可撤销。`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await window.api.deleteProject(projectId)
    ElMessage.success('项目删除成功')
    if (projectStore.selectedProjectId === projectId) {
      projectStore.clearProject()
    }
    await loadProjects()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete project:', error)
      ElMessage.error('删除项目失败')
    }
  }
}

function handleSelectProject(project: Project) {
  projectStore.selectProject(project.id)
}

onMounted(() => {
  loadProjects()
})
</script>

<template>
  <el-container style="height: calc(100vh - 60px);">
    <el-aside width="400px" class="p-4 border-r">
      <div class="mb-4">
        <el-button type="primary" @click="dialogVisible = true">新建项目</el-button>
      </div>
      <el-table :data="projects" stripe style="width: 100%" border @row-click="handleSelectProject">
        <el-table-column prop="name" label="项目名称" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click.stop="handleDeleteProject(row.id, row.name)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-aside>
    <el-main>
      <ProjectEditor :project="selectedProject" @project-updated="loadProjects" />
    </el-main>
  </el-container>

  <el-dialog v-model="dialogVisible" title="新建项目" width="30%">
    <el-input
      v-model="newProjectName"
      placeholder="请输入项目名称"
      @keyup.enter="handleAddProject"
    />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddProject">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>
