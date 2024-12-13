import axios from 'axios'
import { message } from 'antd'

export const BASE_API = "http://127.0.0.1:8000"

const instance = axios.create({
  baseURL: BASE_API,
  timeout: 10 * 1000,
})

// response 拦截器 统一处理errno 和 message
// response {errno:0,data:{....} || {errno:200,message:"xxx"}}
instance.interceptors.response.use(res => {
  const resData = (res.data || {}) as ResType
  const { errno, data = {}, msg } = resData
  if (errno !== 0) {
    // 错误提示
    if (msg) {
      message.error(msg)
    }
  }
  return data as any
})


export default instance

export type ResType = {
  errno: Number
  data?: ResDataType
  msg: string
}

export type ResDataType = {
  [key: string]: any
}

