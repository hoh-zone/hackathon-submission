import { Button, Modal, QRCode } from 'antd'
import { copyText } from '../utils/tools'
import { useEffect } from 'react'
import { useState } from 'react'
// props为图片链接
interface QrcodeModalProps {
  open: boolean
  activityId: string
  onCancel: () => void
}
export default function QrcodeModal({ open, activityId, onCancel }: QrcodeModalProps) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    setUrl(`${window.location.origin}/checkin?activityId=${activityId}`)
  }, [activityId])
  return (
    <Modal open={open} title="活动签到二维码" onCancel={onCancel} footer={null}>
      <div className="flex flex-col justify-center items-center">
        <QRCode value={url} icon="/logo.svg" size={400} />
        <Button className="mt-4" type="primary" onClick={() => copyText(url)}>复制链接</Button>
      </div>
    </Modal>
  )
}
