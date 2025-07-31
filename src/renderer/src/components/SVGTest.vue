<script setup lang="ts">
import { onMounted, ref } from 'vue';
import DownStairsUrl from '../themes/E235-0/SVG/DownStairs.svg?url';

const imgRef = ref<HTMLImageElement>();
const status = ref('loading');

onMounted(() => {
  console.log('Direct SVG URL:', DownStairsUrl);

  if (imgRef.value) {
    imgRef.value.onload = () => {
      status.value = 'loaded';
      console.log('Image loaded successfully');
    };

    imgRef.value.onerror = (error) => {
      status.value = 'error';
      console.error('Image load error:', error);
    };
  }
});
</script>

<template>
  <div style="padding: 20px; background: #f0f0f0;">
    <h3>SVG Test</h3>
    <p>Status: {{ status }}</p>
    <p>URL: {{ DownStairsUrl }}</p>

    <!-- 直接显示 SVG -->
    <div style="border: 2px solid red; display: inline-block; margin: 10px;">
      <img
        ref="imgRef"
        :src="DownStairsUrl"
        alt="Down Stairs"
        style="width: 100px; height: 100px; background: white;"
      >
    </div>

    <!-- 在黑色背景下显示 -->
    <div style="border: 2px solid red; display: inline-block; margin: 10px; background: black;">
      <img
        :src="DownStairsUrl"
        alt="Down Stairs"
        style="width: 100px; height: 100px;"
      >
    </div>
  </div>
</template>
