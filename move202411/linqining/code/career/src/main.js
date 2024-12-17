// import App from './App.vue'
import { createApp } from 'vue';
// import App from './App.vue';
import ProviderWrapper from "./ProviderWrapper.vue";
import {createSuiue} from "suiue";
import { store } from '@/pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'


// 引入我们导出的 router
import { setupRouter } from '@/router';
const setupApp = async () => {

    const app = createApp(ProviderWrapper);
    // 创建路由
    app.use(createSuiue()).use(ElementPlus).use(store);
    setupRouter(app);
    app.mount('#app');
};

setupApp();
