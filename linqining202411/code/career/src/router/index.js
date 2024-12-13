// import  { App } from 'vue';
// 引入 login.ts
// import LoginRouter from './modules/login';

// 引入 test.ts
// import TestRouter from './modules/test';
import { createRouter, createWebHashHistory } from 'vue-router';

export const publicRoutes= [
    {
        path: "",
        component: () => import('@/views/layout/layOut.vue'),
        children:[
            {
                path:"",
                name: 'indexPage',
                component: () => import('@/views/home/homeIndex.vue'),
                redirect: '/home'
            },
            {
                path:"/home",
                name: 'homeIndex',
                component: () => import('@/views/home/homeIndex.vue'),
                meta: {
                    title: '首页'
                }
            },
            {
                path: '/login',
                name: 'loginIndex',
                component: () => import('@/views/login/loginIndex.vue'),
                meta: {
                    title: '登录页'
                }
            },
            {
                path: '/profile',
                name: 'profileIndex',
                component: () => import('@/views/profile/profileIndex.vue'),
                meta: {
                    title: '个人主页'
                }
            },
            {
                path:"/company",
                name: 'companyIndex',
                component: () => import('@/views/company/companyIndex.vue'),
                meta: {
                    title: '公司'
                }
            },
        ]
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes: publicRoutes
});

/* 初始化路由表 */
export function resetRouter() {
    router.getRoutes().forEach((route) => {
        const { name } = route;
        if (name) {
            router.hasRoute(name) && router.removeRoute(name);
        }
    });
}
/* 导出 setupRouter */
export const setupRouter = (app) => {
    app.use(router);
};

export default router


