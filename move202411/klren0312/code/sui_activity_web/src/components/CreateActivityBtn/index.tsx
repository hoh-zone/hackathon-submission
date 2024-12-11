import { InboxOutlined, PlusOutlined } from '@ant-design/icons'
import { DatePicker, FloatButton, Form, FormInstance, Input, InputNumber, message, Modal, Select, Upload } from 'antd'
import { RangePickerProps } from 'antd/es/date-picker'
import dayjs from 'dayjs'
import { useRef, useState } from 'react'
import { UploadImageApi } from '/@/apis/common.api'
import { SUI_DECIMALS, WALRUS_AGGREGATOR } from '/@/utils/constants'
import { Transaction } from '@mysten/sui/transactions'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { useNetworkVariable } from '/@/utils/networkConfig'
import { useUserStore } from '/@/stores/user'
import MDEditor from '@uiw/react-md-editor'

const { Dragger } = Upload
const { RangePicker } = DatePicker

export default function CreateActivityBtn() {
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [submitLoading, setSubmitLoading] = useState<boolean>(false)
  const createActivityFormRef = useRef<FormInstance>(null)
  const packageId = useNetworkVariable('packageId')
  const { mutate } = useSignAndExecuteTransaction()
  const { userData } = useUserStore()
  const [messageApi, contextHolder] = message.useMessage()
  const [descriptionText, setDescriptionText] = useState('')

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current < dayjs().endOf('day');
  }
  const onFinish = async (values: any) => {
    setSubmitLoading(true)
    console.log(values)
    const mediaArr = values.media
    // 上传图片
    try {
      const resultArr = await Promise.all(mediaArr.map(async (file: any) => {
        const res = await UploadImageApi(file.originFileObj)
        if (res) {
          let blobId = ''
          if (res.alreadyCertified) {
            blobId = res.alreadyCertified.blobId
          } else if (res.newlyCreated) {
            blobId = res.newlyCreated.blobObject.blobId
          }
          return `${WALRUS_AGGREGATOR[0]}${blobId}`
        } else {
          message.error('上传失败')
        }
        return ''
      }))
      const linkArr = resultArr.filter(item => item)
      console.log(linkArr, values)
      const txb = new Transaction()

      txb.moveCall({
        target: `${packageId}::activity::create_activity`,
        arguments: [
          txb.object(userData.objectId),
          txb.pure.string(values.title),
          txb.pure.string(values.description),
          txb.pure.vector('string', [
            dayjs(values.date_range[0]).format('YYYY-MM-DD'),
            dayjs(values.date_range[1]).format('YYYY-MM-DD')
          ]),
          txb.pure.string(values.location),
          txb.pure.string(values.tag),
          txb.pure.u64(values.total_people_num),
          txb.pure.u64(values.join_fee * SUI_DECIMALS),
          txb.pure.vector('string', linkArr),
        ]
      })
      mutate(
        {
          transaction: txb
        },
        {
          onError: (err) => {
            console.log(err.message)
            messageApi.error(err.message)
          },
          onSuccess: (result) => {
            form.resetFields()
            setSubmitLoading(false)
            setIsCreateActivityModalOpen(false)
            messageApi.success(`活动创建成功: ${result.digest}`)
          },
        }
      )
    } catch (error) {
      console.error(error)
      messageApi.error('上传图片失败，请重新创建')
    }
  }
  const beforeUpload = (file: File) => {
    const isLessThan10M = file.size / 1024 / 1024 < 10;
    const isImage = /^image\/(jpeg|png|gif|webp)$/.test(file.type);
    
    if (!isLessThan10M) {
      messageApi.error('文件必须小于10MB!');
      return Upload.LIST_IGNORE;
    }
    if (!isImage) {
      messageApi.error('只能上传 JPG/PNG/GIF/WEBP 格式的图片!');
      return Upload.LIST_IGNORE;
    }
    return false;
  }
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  return (
    <>
      {contextHolder}
      <FloatButton type="primary" tooltip={<div>创建活动</div>} icon={<PlusOutlined />} onClick={() => {form.resetFields(); setIsCreateActivityModalOpen(true)}} />
      <Modal width={700} title="创建活动" open={isCreateActivityModalOpen} loading={submitLoading} onOk={() => form.submit()} onCancel={() => setIsCreateActivityModalOpen(false)}>
        <Form form={form} ref={createActivityFormRef} onFinish={onFinish}>
          <Form.Item name="title" label="活动标题" rules={[{ required: true, message: '请输入活动标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="date_range" label="时间范围" rules={[{ required: true, message: '请输入时间范围' }]}>
            <RangePicker
              disabledDate={disabledDate}
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item name="location" label="活动地点" rules={[{ required: true, message: '请输入活动地点' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tag" label="活动分类" rules={[{ required: true, message: '请输入活动分类' }]}>
            <Select>
              <Select.Option value="线上">线上</Select.Option>
              <Select.Option value="线下">线下</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="total_people_num" label="活动人数" rules={[{ required: true, message: '请输入活动人数' }]}>
            <InputNumber className="w-full"/>
          </Form.Item>
          <Form.Item name="join_fee" label="参与费用" rules={[{ required: true, message: '请输入参与费用' }]}>
            <div>
              <InputNumber<number>
                className="w-full"
                min={0}
                stringMode
                precision={9}
                addonAfter="SUI"
              />
            </div>
          </Form.Item>
          <Form.Item name="media" label="活动图片" rules={[{ required: true, message: '请输入活动图片' }]} getValueFromEvent={normFile} valuePropName="fileList">
            <Dragger
              accept="image/*"
              maxCount={3}
              beforeUpload={beforeUpload}
              multiple={true}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或者拖拽文件到此区域完成上传</p>
              <p className="ant-upload-hint">
                支持单个或批量上传，仅支持图片格式，单个文件大小不超过 10MB，最多上传6张图片
              </p>
            </Dragger>
          </Form.Item>
          <Form.Item name="description" label="活动描述" rules={[{ required: true, message: '请输��活动描述' }]}>
            <MDEditor
              data-color-mode="light"
              value={descriptionText}
              onChange={() => setDescriptionText}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
