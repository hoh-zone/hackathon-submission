<template>
  <div >
    <el-form :model="formData" label-position="top" ref="elFormRef" :rules="rule" label-width="80px">
      <el-form-item label="JobID:"  prop="jobId" >
        <el-input v-model.number="formData.jobId" disabled placeholder="请输入JobID" />
      </el-form-item>
      <el-form-item label="申请人钱包地址:"  prop="address" >
        <el-input v-model="formData.address" disabled placeholder="请输入申请人钱包地址" />
      </el-form-item>
      <el-form-item label="申请人名字:"  prop="name" >
        <el-input v-model="formData.name" :clearable="true"  placeholder="请输入申请人名字" />
      </el-form-item>
      <el-form-item label="自我介绍:"  prop="introduction" >
        <el-input v-model="formData.introduction" :clearable="true"  placeholder="请输入自我介绍" />
      </el-form-item>

      <el-form-item label="电话:"  prop="phone" >
        <el-input v-model="formData.phone" :clearable="true"  placeholder="请输入电话" />
      </el-form-item>
      <el-form-item label="邮箱:"  prop="email" >
        <el-input v-model="formData.email" :clearable="true"  placeholder="请输入邮箱" />
      </el-form-item>
      <div>
        <span>简历:</span>
        <el-upload
            ref="uploadFile"
            v-model:file-list="fileList"
            class="upload-demo"
            action="https://publisher.walrus-testnet.walrus.space/v1/store?epochs=1"
            method="PUT"
            :auto-upload="false"
        >
          <template #trigger>
            <el-button type="primary">选择文件</el-button>
          </template>
          <el-button class="ml-3" type="success" @click="submitUpload">
            上传文件
          </el-button>
          <template #tip>
            <div class="el-upload__tip">
              不超过10m.
            </div>
          </template>
        </el-upload>
      </div>

<!--      <el-form-item label="简历blobID:"  prop="resumeBlobId" >-->
<!--        <el-input v-model="formData.resumeBlobId" :clearable="true"  placeholder="请输入简历blobID" />-->
<!--      </el-form-item>-->
<!--      <el-form-item label="简历ObjectId:"  prop="suiObjectId" >-->
<!--        <el-input v-model="formData.suiObjectId" :clearable="true"  placeholder="请输入简历ObjectId" />-->
<!--      </el-form-item>-->
<!--      <el-form-item label="文件类型:"  prop="mediaType" >-->
<!--        <el-input v-model="formData.mediaType" :clearable="true"  placeholder="请输入文件类型" />-->
<!--      </el-form-item>-->
      <el-form-item>
        <el-button :loading="btnLoading" type="primary" @click="save">保存</el-button>
        <el-button type="primary" @click="back">返回</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup >
import {ElForm,ElFormItem,ElInput,ElButton,ElMessage} from "element-plus";
import { useWalletState} from "suiue"
import router from"@/router/index"

const { address} = useWalletState();
import {ref} from 'vue';
const btnLoading = ref(false)



// 自动化生成的字典（可能为空）以及字段
const formData = ref({
  address: address.value,
  name: '',
  introduction: '',
  resumeBlobId: '',
  phone: '',
  email: '',
  suiObjectId: '',
  mediaType: '',
  jobId: router.currentRoute.value.params.id,
})

// // 行为控制标记（弹窗内部需要增还是改）
// const type = ref('')

// // 更新行
// const updateJobFunc = async(row) => {
//   const res = await findJob({ id: row.id })
//   type.value = 'update'
//   if (res.code === 0) {
//     formData.value = res.data
//     dialogFormVisible.value = true
//   }
// }

import {storeBlob} from "@/api/walrus"

const uploadFile = ref()
const fileList = ref([])
const submitUpload=()=>{
  console.log("uploadfile",uploadFile.value)
  console.log("filelist",fileList.value)
  if (fileList.value.length==0){
    return
  }
  btnLoading.value = true
  storeBlob(fileList.value[0].raw).then((resp)=>{
    const storage_info = resp.info
    const media_type = resp.media_type
    console.log("upload resp",resp)
    var info = {};
    const SUI_NETWORK = "testnet";
    const SUI_VIEW_TX_URL = `https://suiscan.xyz/${SUI_NETWORK}/tx`;
    const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/${SUI_NETWORK}/object`;
    if ("alreadyCertified" in storage_info) {
      info = {
        status: "Already certified",
        blobId: storage_info.alreadyCertified.blobId,
        endEpoch: storage_info.alreadyCertified.endEpoch,
        suiRefType: "Previous Sui Certified Event",
        suiRef: storage_info.alreadyCertified.eventOrObject.Event.txDigest,
        suiBaseUrl: SUI_VIEW_TX_URL,
      };
    } else if ("newlyCreated" in storage_info) {
      info = {
        status: "Newly created",
        blobId: storage_info.newlyCreated.blobObject.blobId,
        endEpoch: storage_info.newlyCreated.blobObject.storage.endEpoch,
        suiRefType: "Associated Sui Object",
        suiRef: storage_info.newlyCreated.blobObject.id,
        suiBaseUrl: SUI_VIEW_OBJECT_URL,
      };
    }
    console.log(storage_info)
    console.log(info)
    console.log("upload file",fileList.value[0])

    formData.value.resumeBlobId = info.blobId
    formData.value.suiObjectId = info.suiRef
    formData.value.mediaType = media_type
    btnLoading.value = false
  })
}
const elFormRef = ref()

import {userApply} from "@/api/job_application/job_application"
// 保存按钮
const save = async() => {
  btnLoading.value = true
  elFormRef.value?.validate( async (valid) => {
    if (!valid) return btnLoading.value = false
    formData.value.jobId = Number(formData.value.jobId)
    const res = await userApply(formData.value)
    btnLoading.value = false
    if (res.code === 0) {
      ElMessage({
        type: 'success',
        message: '创建/更改成功'
      })
    }
  })
}

const back = () => {
  router.go(-1)
}

</script>