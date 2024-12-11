import axios, { type InternalAxiosRequestConfig } from 'axios'

const instance = axios.create({
  timeout: 240000
})

// request拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config
  },
  (err) => {
    return Promise.reject(err)
  }
)

// response拦截器
instance.interceptors.response.use(
  (response) => {
    return response
  },
  (err) => {
    if (err.response) {
      switch (err.response.status) {
        case 401:
          break
        case 500:
        case 501:
        case 502:
        case 503:
          break
      }
      if (err.response?.data) {
        return Promise.reject(err.response.data)
      }
    } else {
      return Promise.reject(err)
    }
  }
)

export default instance
