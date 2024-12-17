export default [
    {
        path: '/login',
        name: 'loginIndex',
        component: () => import('@/views/login/loginIndex.vue'),
        meta: {
            title: '登录页'
        }
    }
];
