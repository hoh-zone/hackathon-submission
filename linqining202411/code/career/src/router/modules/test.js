export default [
    {
        path: '/test',
        name: 'testIndex',
        component: () => import('@/views/test/loginIndex.vue'),
        meta: {
            title: '测试页面'
        }
    }
];