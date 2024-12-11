import { PlusOutlined } from '@ant-design/icons'
import { Avatar, Button, Form, Input, Modal, Radio, Spin, Upload } from 'antd'
import ImgCrop from 'antd-img-crop'
import TextArea from 'antd/es/input/TextArea'
import { UploadImageApi } from '../apis/common.api'
import { forwardRef, useEffect, useState } from 'react'
import { Transaction } from '@mysten/sui/transactions'
import { useNetworkVariable } from '../utils/networkConfig'
import { WALRUS_AGGREGATOR } from '../utils/constants'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit'
import { message } from 'antd'
import { useUserStore } from '../stores/user'
import { UpdatePointApi } from '../apis/point.api'

interface MemberData {
  avatar: string
  description: string
  id: {
    id: string
  }
  index: string
  name: string
  nickname: string
  sex: string
  url: string
  point: number
}

const RegisterForm = forwardRef(() => {
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm()
  const packageId = useNetworkVariable('packageId')
  const server = useNetworkVariable('server')
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [userData, setUserData] = useState<MemberData>()
  const account = useCurrentAccount()
  const { mutate } = useSignAndExecuteTransaction()
  const { setUser, resetUser } = useUserStore()

  // 查找会员卡
  const { data: memberQueryData, isPending, refetch: refetchMemberInfo } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      limit: 1,
      filter: {
        MatchAll: [
          {
            StructType: `${packageId}::member::MemberNft`,
          },
          {
            AddressOwner: account?.address!!,
          },
        ],
      },
      options: {
        showContent: true,
      },
    },
    {
      gcTime: 10000,
    },
  )

  /**
   * 自定义上传逻辑
   */
  const customUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options
    const res = await UploadImageApi(file)
    if (res) {
      onProgress(100)
      let blobId = ''
      if (res.alreadyCertified) {
        blobId = res.alreadyCertified.blobId
      } else if (res.newlyCreated) {
        blobId = res.newlyCreated.blobObject.blobId
      }
      onSuccess(blobId)
      form.setFieldValue('avatar', blobId)
    } else {
      onError('上传失败')
    }
  }
  const onFinish = (values: any) => {
    console.log(values)
    const txb = new Transaction()
    txb.moveCall({
      target: `${packageId}::sui_hai::add_memeber`,
      arguments: [
        txb.object(server),
        txb.pure.string(values.name),
        txb.pure.string(values.description),
        txb.pure.string(values.sex),
        txb.pure.string(WALRUS_AGGREGATOR[0] +values.avatar),
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
          registerSuccessHandler()
          messageApi.success(`注册成功: ${result.digest}`)
        },
      }
    )
  }

  /**
   * 注册会员成功
   */
  const registerSuccessHandler = async () => {
    setIsRegisterModalOpen(false)
    const result = await refetchMemberInfo()
    console.log('refetch', result)
    if (result.data && result.data.data.length > 0 && result.data.data[0].data?.content?.dataType === 'moveObject') {
      setUserData(result.data.data[0].data.content.fields as unknown as MemberData)
    } else {
      setUserData(undefined)
    }
  }

  /**
   * 监听会员信息
   */
  useEffect(() => {
    if (!memberQueryData) {
      setUserData(undefined)
      resetUser()
      return
    }
    let memberData: MemberData | undefined = undefined
    if (memberQueryData.data.length > 0 && memberQueryData.data[0].data?.content?.dataType === 'moveObject') {
      memberData = memberQueryData.data[0].data.content.fields as unknown as MemberData
      const obj = {
        objectId: memberQueryData.data[0].data.objectId,
        point: memberData.point,
        name: memberData.name,
        nickname: memberData.nickname,
        description: memberData.description,
        sex: memberData.sex,
        avatar: memberData.avatar,
        index: memberData.index,
      }
      setUser(obj, account?.address || '')
      console.log('update point')
      UpdatePointApi(account?.address || '', obj)
      setUserData(memberData)
    } else {
      setUserData(undefined)
      resetUser()
    }
  }, [memberQueryData])

  return (
    <>
      {contextHolder}
      {
        isPending ?
        <Spin /> :
        userData ?
        <div className="flex items-center">
          <Avatar
            size="default"
            icon={<img src={userData.avatar as string} />}
          />
          <div className="flex items-center ml-2 mr-5">欢迎回家，<div className="font-bold text-green-500">{userData.nickname as string}</div></div>
        </div> :
        <Button className="mr-5" type="primary" onClick={() =>{
          form.resetFields()
          setIsRegisterModalOpen(true)
        }}>申请会员</Button>
      }
      <Modal title="申请会员" open={isRegisterModalOpen} onOk={() => form.submit()} onCancel={() => setIsRegisterModalOpen(false)}>
        <Form
          form={form}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 14 }}
          layout="horizontal"
          style={{ maxWidth: 600 }}
          variant="filled"
          onFinish={onFinish}
        >
          <Form.Item label="昵称：" name="name" rules={[{ required: true, message: '请输入昵称!' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="性别：" name="sex" rules={[{ required: true, message: '请选择性别!' }]}>
            <Radio.Group>
              <Radio value="未知"> 未知 </Radio>
              <Radio value="女"> 女 </Radio>
              <Radio value="男"> 男 </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="描述：" name="description" rules={[{ required: true, message: '请输入描述!' }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item label="头像：" name="avatar" rules={[{ required: true, message: '请上传头像!' }]}>
            <ImgCrop rotationSlider modalOk="确定" modalCancel="取消">
              <Upload customRequest={customUpload} multiple={false} maxCount={1} listType="picture-card">
                <button style={{ border: 0, background: 'none' }} type="button">
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </button>
              </Upload>
            </ImgCrop>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
})

export default RegisterForm
