import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  //  hash 模式。
  history: createWebHashHistory(),
  routes: [
    // 设置首页
    {
      path: '/',
      component: () => import('@/pages/projectManager/ProjectManagerPage.vue')
    },
    {
      path: '/station-editor',
      component: () => import('@/pages/stationEditor/StationEditorPage.vue')
    }
  ]
})

export default router
