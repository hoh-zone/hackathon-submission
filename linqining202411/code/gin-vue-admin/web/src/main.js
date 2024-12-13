import './style/element_visiable.scss'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'

import 'element-plus/dist/index.css'
// 引入gin-vue-admin前端初始化相关内容
import './core/gin-vue-admin'
// 引入封装的router
import router from '@/router/index'
import '@/permission'
import run from '@/core/gin-vue-admin.js'
import auth from '@/directive/auth'
import { store } from '@/pinia'
// import App from './App.vue'
// 消除警告
import 'default-passive-events'
import VueSuiWallet from "vue-sui-wallet";
import "../node_modules/vue-sui-wallet/dist/style.css";

import ProviderWrapper from "./ProviderWrapper.vue";
import {createSuiue} from "suiue";

const app = createApp(ProviderWrapper)
app.config.productionTip = false

app.use(createSuiue()).use(VueSuiWallet).use(run).use(ElementPlus).use(store).use(auth).use(router).mount('#app')
export default app
