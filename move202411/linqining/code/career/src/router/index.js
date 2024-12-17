// import  { App } from 'vue';
// 引入 login.ts
// import LoginRouter from './modules/login';

// 引入 test.ts
import { createRouter, createWebHashHistory } from 'vue-router';
import {globalLoginStore} from "@/pinia/modules/login";

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
                },
            },
            {
                path:"/company",
                name: 'companyIndex',
                component: () => import('@/views/company/companyIndex.vue'),
                meta: {
                    title: '公司'
                }
            },
            {
                path:"/application/:id",
                name: 'applicationIndex',
                component: () => import('@/views/application/applicationIndex.vue'),
                meta: {
                    title: '职位申请'
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

export const setupLogin = () => {
    router.beforeEach((to, from, next) => {
        // 这里可以添加检查逻辑，例如检查本地存储或者cookie中的token
        console.log("to",to)
        if (!globalLoginStore){
            next();
            return
        }
        console.log(globalLoginStore.getLogin())
        if (to.path =="/login"){
            console.log("beforeEach",to,from)
            next();
            return
        }
        if (!globalLoginStore.getLogin()) {
            // 如果用户访问需要登录的页面但未登录，则重定向到登录页面
            next({
                path: '/login',
                query: { redirect: to.fullPath } // 将目标路由作为重定向参数传递
            });
        } else {
            // 如果用户已登录或访问的不是需要登录的页面，则正常跳转
            next();
        }
    });
};




export default router


