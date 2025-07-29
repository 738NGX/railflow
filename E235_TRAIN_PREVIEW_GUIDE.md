# E235-0 系列车型预览组件

## 概述

`PlatformPreviewE235-0.vue` 是专为 JR East E235-0 系列电车设计的站台布局预览组件。该组件使用 Canvas 技术提供高性能的可视化渲染，并为后续的 E235-1000 等其他衍生车型预留了扩展架构。

## 特性

### E235-0 专用特性
- **车型特定的绘图样式**：专为 E235-0 系列定制的颜色方案和布局
- **高性能 Canvas 渲染**：支持高 DPI 显示，硬件加速
- **交互式设施展示**：点击和悬停事件支持
- **动画准备**：为未来动画功能预留接口
- **调试模式**：开发时的详细信息显示

### 车型扩展架构
- **模块化设计**：每个车型独立组件
- **统一接口**：所有车型组件共享相同的 props 接口
- **主题系统**：支持自定义颜色主题
- **可扩展性**：为新车型添加提供清晰的扩展路径

## 使用方法

### 基本用法

```vue
<template>
  <div>
    <!-- 车型选择 -->
    <el-select v-model="selectedTrainType">
      <el-option label="E235-0系" value="E235-0" />
      <!-- 未来车型 -->
      <!-- <el-option label="E235-1000系" value="E235-1000" /> -->
    </el-select>

    <!-- E235-0 预览 -->
    <PlatformPreviewE235_0
      v-if="selectedTrainType === 'E235-0'"
      :platform="platform"
      :exits="exits"
    />
  </div>
</template>

<script setup>
import PlatformPreviewE235_0 from '@/components/PlatformPreviewE235-0.vue'
</script>
```

### 高级配置

```vue
<PlatformPreviewE235_0
  :platform="platform"
  :exits="exits"
  :enable-animations="true"
  :show-debug-info="false"
  :custom-theme="customE235Theme"
  :on-object-click="handleFacilityClick"
  :on-object-hover="handleFacilityHover"
/>
```

## Props 接口

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `platform` | `Platform` | ✅ | - | 站台数据 |
| `exits` | `Exit[]` | ✅ | - | 出口数据 |
| `enableAnimations` | `boolean` | ❌ | `false` | 启用动画功能 |
| `showDebugInfo` | `boolean` | ❌ | `false` | 显示调试信息 |
| `customTheme` | `Partial<ThemeConfig>` | ❌ | `undefined` | 自定义主题 |
| `onObjectClick` | `Function` | ❌ | `undefined` | 设施点击回调 |
| `onObjectHover` | `Function` | ❌ | `undefined` | 设施悬停回调 |

## E235-0 专用配色方案

```typescript
const E235_0_Colors = {
  track: '#4B5563',           // 轨道颜色
  exits: {
    top: '#FCD34D',          // 上方出口
    bottom: '#F59E0B'        // 下方出口
  },
  facilities: {
    stairs: '#F97316',       // 楼梯
    escalator: '#3B82F6',    // 扶梯
    elevator: '#10B981'      // 电梯
  },
  blocks: [                  // 站台块颜色循环
    '#FEE2E2', '#DBEAFE', '#D1FAE5',
    '#FEF3C7', '#F3E8FF', '#FCE7F3'
  ]
}
```

## 车型架构扩展

### 添加新车型步骤

1. **创建车型专用组件**
   ```
   src/components/PlatformPreviewE235-1000.vue
   ```

2. **实现标准接口**
   ```typescript
   interface TrainTypePreviewProps {
     platform: Platform
     exits: Exit[]
     enableAnimations?: boolean
     showDebugInfo?: boolean
     customTheme?: Partial<ThemeConfig>
     onObjectClick?: (object: DrawableObject) => void
     onObjectHover?: (object: DrawableObject | null) => void
   }
   ```

3. **定制车型专用渲染器**
   ```typescript
   class PlatformRendererE235_1000 extends PlatformRenderer {
     // E235-1000 专用实现
   }
   ```

4. **更新选择器**
   ```vue
   <el-select v-model="selectedTrainType">
     <el-option label="E235-0系" value="E235-0" />
     <el-option label="E235-1000系" value="E235-1000" />
   </el-select>

   <PlatformPreviewE235_0 v-if="selectedTrainType === 'E235-0'" ... />
   <PlatformPreviewE235_1000 v-else-if="selectedTrainType === 'E235-1000'" ... />
   ```

## 技术实现细节

### Canvas 优化
- **高 DPI 支持**：自动检测设备像素比
- **硬件加速**：利用 GPU 加速渲染
- **内存管理**：正确的生命周期管理，避免内存泄漏

### 事件系统
- **精确点击检测**：基于坐标的设施检测
- **悬停状态**：实时鼠标位置跟踪
- **键盘支持**：为无障碍访问预留

### 扩展性设计
- **模块化渲染器**：每个车型独立的渲染逻辑
- **统一接口**：所有车型共享相同的 API
- **主题系统**：灵活的视觉定制能力

## 调试和开发

### 启用调试模式
```vue
<PlatformPreviewE235_0 :show-debug-info="true" />
```

调试模式将显示：
- 网格坐标信息
- 对象边界框
- 性能指标
- 车型标识

### 性能监控
组件内置性能监控，在开发模式下会输出关键指标：
- 渲染时间
- 内存使用
- Canvas 操作次数

## 示例项目

参考 `CanvasTestPage.vue` 查看完整的使用示例和配置选项。

## 未来规划

- **E235-1000 系列**：计划支持的下一个车型
- **动画系统**：车门开关、信息显示等动态效果
- **3D 渲染**：可能的立体视图支持
- **VR/AR 集成**：沉浸式预览体验

## 技术支持

如需添加新车型或定制功能，请参考现有的 E235-0 实现作为模板。
