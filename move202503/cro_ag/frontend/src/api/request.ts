import { message } from 'antd';
import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { resData } from './interface';

// ****
const baseURL = '';
export const service = Axios.create({
  baseURL,
  responseType: 'json',
  timeout: 600000,
});

// ****
service.interceptors.request.use((res: any) => {
  res.headers.token = 'token';
  return res;
});

// ****
service.interceptors.response.use(
  (response: any) => {
    const res = response.data;
    // ****** **********
    if (res || res.success) {
      if (res.message) message.success(res.message, 3);
      return response;
    } else {
      if (res.message) {
        message.error(res.message, 3);
        if (res.code === 401) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(res);
    }
  },
  (err) => {
    message.error(err.message, 5);
    return Promise.reject(err);
  }
);

// ***********
export default function request<Res = any, Q = any>(
  req: AxiosRequestConfig & {
    data?: Q;
  }
) {
  return service<Res>(req).then(
    (res) => {
      return res;
    },
    (res) => {
      return Promise.reject(res.data || res);
    }
  );
}
