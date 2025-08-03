<template>
  <el-card class="mb-4">
    <template #header>
      <div class="flex justify-between items-center">
        <h3>出口管理</h3>
        <el-button type="primary" size="small" @click="addExit">添加出口</el-button>
      </div>
    </template>
    <el-collapse v-if="station.exits.length > 0">
      <el-collapse-item
        v-for="exit in station.exits"
        :key="exit.id"
        :name="exit.id.toString()"
      >
        <template #title>
          <span>出口 {{ exit.id }}: {{ exit.name.kanji }}</span>
        </template>
        <el-form label-position="top">
          <div class="grid grid-cols-2 gap-4">
            <el-form-item label="日文名称">
              <el-input
                :model-value="exit.name.kanji"
                @input="updateExitName(exit.id, 'kanji', $event)"
              />
            </el-form-item>
            <el-form-item label="英文名称">
              <el-input
                :model-value="exit.name.english"
                @input="updateExitName(exit.id, 'english', $event)"
              />
            </el-form-item>
          </div>
          <el-button type="danger" size="small" @click="removeExit(exit.id)">
            删除出口
          </el-button>
        </el-form>
      </el-collapse-item>
    </el-collapse>
    <div v-else class="text-center text-gray-500 py-4">
      暂无出口信息
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { Station, Exit } from '../../../../../types/station'
import {
  ElCard,
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElForm,
  ElFormItem,
  ElInput
} from 'element-plus'

interface Props {
  station: Station
}

interface Emits {
  (e: 'update', station: Station): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function addExit() {
  const newExit: Exit = {
    id: Math.max(0, ...props.station.exits.map(e => e.id)) + 1,
    name: {
      kanji: '新出口',
      english: 'New Exit',
    }
  }

  const updatedStation = {
    ...props.station,
    exits: [...props.station.exits, newExit]
  }
  emit('update', updatedStation)
}

function removeExit(exitId: number) {
  const updatedStation = {
    ...props.station,
    exits: props.station.exits.filter(e => e.id !== exitId)
  }
  emit('update', updatedStation)
}

function updateExitName(exitId: number, field: keyof Exit['name'], value: string) {
  const updatedStation = {
    ...props.station,
    exits: props.station.exits.map(exit =>
      exit.id === exitId
        ? {
            ...exit,
            name: {
              ...exit.name,
              [field]: value
            }
          }
        : exit
    )
  }
  emit('update', updatedStation)
}
</script>
