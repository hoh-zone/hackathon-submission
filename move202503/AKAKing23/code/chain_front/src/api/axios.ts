import axios from 'axios';

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // 基础URL
  timeout: 50000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    console.error('请求错误', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 这里可以根据后端返回的状态码进行不同处理
    return res;
  },
  (error) => {
    console.error('响应错误', error);
    // 这里可以处理HTTP状态码错误
    return Promise.reject(error);
  }
);

export default service; 