<template>
  <el-card class="mb-4">
    <template #header>
      <div class="flex justify-between items-center">
        <h3>站台管理</h3>
        <el-button type="primary" size="small" @click="addPlatform">添加站台</el-button>
      </div>
    </template>
    <el-collapse v-if="station.platforms.length > 0">
      <el-collapse-item
        v-for="platform in station.platforms"
        :key="platform.id"
        :name="platform.id.toString()"
      >
        <template #title>
          <span>站台 {{ platform.id }}: {{ platform.name.kanji }}</span>
        </template>

        <PlatformEditor
          :platform="platform"
          :exits="station.exits"
          @update="updatePlatform(platform.id, $event)"
          @delete="removePlatform(platform.id)"
        />
      </el-collapse-item>
    </el-collapse>
    <div v-else class="text-center text-gray-500 py-4">
      暂无站台信息
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { Station, Platform } from '../../../../../types/station'
import PlatformEditor from './PlatformEditor.vue'
import {
  ElCard,
  ElButton,
  ElCollapse,
  ElCollapseItem
} from 'element-plus'

interface Props {
  station: Station
}

interface Emits {
  (e: 'update', station: Station): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function addPlatform() {
  const newPlatform: Platform = {
    id: Math.max(0, ...props.station.platforms.map(p => p.id)) + 1,
    name: {
      kanji: '新站台',
      english: 'New Platform'
    },
    doorside: 'Left',
    exits: [],
    units: []
  }

  const updatedStation = {
    ...props.station,
    platforms: [...props.station.platforms, newPlatform]
  }
  emit('update', updatedStation)
}

function removePlatform(platformId: number) {
  const updatedStation = {
    ...props.station,
    platforms: props.station.platforms.filter(p => p.id !== platformId)
  }
  emit('update', updatedStation)
}

function updatePlatform(platformId: number, updatedPlatform: Platform) {
  const updatedStation = {
    ...props.station,
    platforms: props.station.platforms.map(p =>
      p.id === platformId ? updatedPlatform : p
    )
  }
  emit('update', updatedStation)
}
</script>
