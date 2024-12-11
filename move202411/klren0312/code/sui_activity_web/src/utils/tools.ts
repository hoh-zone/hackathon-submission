import dayjs from "dayjs"

/**
 * 返回范围内的随机数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机数
 */
export const getRandomInt = (min: number, max: number) => {
  const range = max - min + 1
  const array = new Uint32Array(1)
  window.crypto.getRandomValues(array)
  return min + (array[0] % range)
}

/**
 * 判断活动是否正在进行中
 * @param startStr 开始时间
 * @param endStr 结束时间
 * @returns 进行状态
 */
export const isActivityInProgress = (startStr: string, endStr: string) => {
  const now = dayjs()
  const startDate = dayjs(startStr)
  const endDate = dayjs(endStr)
  if (startDate.isAfter(now)) {
    return '未开始'
  }
  if (now.isAfter(startDate) && now.isBefore(endDate)) {
    return '进行中'
  }
  return '已结束'
}

/**
 * 复制文本
 * @param text 文本
 */
export const copyText = (text: string) => {
  navigator.clipboard.writeText(text)
}

/**
 * 解析location.search为对象
 */
export const parseSearch = () => {
  const search = window.location.search
  const searchObj: Record<string, string> = {}
  if (search) {
    search.substring(1).split('&').forEach((item) => {
     const [key, value] = item.split('=')
      searchObj[key] = value
    })
    return searchObj
  }
  return null
}
