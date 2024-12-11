import { UploadWalrusResponse } from './types/common.type'
import request from '/@/utils/request'
// import { getRandomInt } from '/@/utils/tools'
import mime from 'mime'
import { WALRUS_PUBLISHER_TESTNET } from '../utils/constants'

// 上传图片
export async function UploadImageApi (file: File): Promise<UploadWalrusResponse | null> {
  const buffer = await file.arrayBuffer()
  const binary = new Uint8Array(buffer)
  return request({
    method: 'PUT',
    url: WALRUS_PUBLISHER_TESTNET,
    data: binary,
    headers: {
      'Content-Type': mime.getType(file.name)
    },
    transformRequest: [(data) => data]
  }).then(res => {
    if (res.status === 200) {
      return res.data
    } else {
      console.error(res)
      return null
    }
  })
}
