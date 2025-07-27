<script setup lang="ts">
import { ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { useRouter } from 'vue-router'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const activeIndex = ref('/')
const router = useRouter()
const handleSelect = (key: string) => {
  router.push(key)
}

router.afterEach((to) => {
  activeIndex.value = to.path
})
</script>

<template>
  <div class="dark">
    <el-menu
      :default-active="activeIndex"
      class="dark w-full"
      mode="horizontal"
      :ellipsis="false"
      @select="handleSelect"
    >
      <el-menu-item index="/">项目管理</el-menu-item>
      <el-menu-item index="/station-editor">车站管理</el-menu-item>
      <el-menu-item index="/lines">线路管理</el-menu-item>
      <el-menu-item index="/devices">车辆管理</el-menu-item>
      <el-menu-item index="/timetable">时刻表管理</el-menu-item>
      <button @click="toggleDark()">Is Dark: {{ isDark }}</button>
    </el-menu>
    <router-view />
  </div>
</template>
