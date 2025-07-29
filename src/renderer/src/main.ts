import 'pixi.js/unsafe-eval';
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/main.css'
import App from './App.vue'
import router from './router'
import { useProjectStore } from './stores/project'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 将 store 暴露到全局，供主进程访问
const projectStore = useProjectStore()
;(window as any).projectStore = projectStore

app.mount('#app')
