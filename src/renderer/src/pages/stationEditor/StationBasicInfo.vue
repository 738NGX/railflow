<template>
  <el-card class="mb-4">
    <template #header>
      <h3>基本信息</h3>
    </template>
    <el-form label-position="top">
      <div class="grid grid-cols-2 gap-4">
        <el-form-item label="日文名称">
          <el-input
            :model-value="station.name.kanji"
            @input="updateName('kanji', $event)"
          />
        </el-form-item>
        <el-form-item label="英文名称">
          <el-input
            :model-value="station.name.english"
            @input="updateName('english', $event)"
          />
        </el-form-item>
        <el-form-item label="中文名称">
          <el-input
            :model-value="station.name.chinese || ''"
            @input="updateName('chinese', $event)"
          />
        </el-form-item>
        <el-form-item label="韩文名称">
          <el-input
            :model-value="station.name.korean || ''"
            @input="updateName('korean', $event)"
          />
        </el-form-item>
        <el-form-item label="站点代码">
          <el-input
            :model-value="station.name.code || ''"
            @input="updateName('code', $event)"
          />
        </el-form-item>
        <el-form-item label="更新时间">
          <div class="flex gap-2">
            <el-input-number
              :model-value="station.update.year"
              :min="2000"
              :max="2100"
              @change="updateTime('year', $event)"
            />
            <span>年</span>
            <el-input-number
              :model-value="station.update.month"
              :min="1"
              :max="12"
              @change="updateTime('month', $event)"
            />
            <span>月</span>
          </div>
        </el-form-item>
      </div>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import type { Station } from '../../../../../types/station'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber
} from 'element-plus'

interface Props {
  station: Station
}

interface Emits {
  (e: 'update', station: Station): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function updateName(field: keyof Station['name'], value: string) {
  const updatedStation = {
    ...props.station,
    name: {
      ...props.station.name,
      [field]: value
    }
  }
  emit('update', updatedStation)
}

function updateTime(field: keyof Station['update'], value: number | undefined) {
  if (value === undefined) return

  const updatedStation = {
    ...props.station,
    update: {
      ...props.station.update,
      [field]: value
    }
  }
  emit('update', updatedStation)
}
</script>
