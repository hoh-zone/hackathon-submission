
<template>
  <div>
    <div class="gva-form-box">
      <el-form-item label="JobID:"  prop="jobId" >
        <el-input v-model.number="formData.jobId" :clearable="true" placeholder="请输入JobID" />
      </el-form-item>
      <el-form :model="formData" ref="elFormRef" label-position="right" :rules="rule" label-width="80px">
        <el-form-item label="申请人钱包地址:" prop="address">
          <el-input v-model="formData.address" :clearable="true"  placeholder="请输入申请人钱包地址" />
       </el-form-item>
        <el-form-item label="申请人名字:" prop="name">
          <el-input v-model="formData.name" :clearable="true"  placeholder="请输入申请人名字" />
       </el-form-item>
        <el-form-item label="自我介绍:" prop="introduction">
          <el-input v-model="formData.introduction" :clearable="true"  placeholder="请输入自我介绍" />
       </el-form-item>
        <el-form-item label="简历blobID:" prop="resumeBlobId">
          <el-input v-model="formData.resumeBlobId" :clearable="true"  placeholder="请输入简历blobID" />
       </el-form-item>
        <el-form-item label="电话:"  prop="phone" >
          <el-input v-model="formData.phone" :clearable="true"  placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="邮箱:"  prop="email" >
          <el-input v-model="formData.email" :clearable="true"  placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="简历ObjectId:"  prop="suiObjectId" >
          <el-input v-model="formData.suiObjectId" :clearable="true"  placeholder="请输入简历ObjectId" />
        </el-form-item>
        <el-form-item label="文件类型:"  prop="mediaType" >
          <el-input v-model="formData.mediaType" :clearable="true"  placeholder="请输入文件类型" />
        </el-form-item>
        <el-form-item>
          <el-button :loading="btnLoading" type="primary" @click="save">保存</el-button>
          <el-button type="primary" @click="back">返回</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import {
  createJobApplication,
  updateJobApplication,
  findJobApplication
} from '@/api/job_application/job_application'

defineOptions({
    name: 'JobApplicationForm'
})

// 自动获取字典
import { getDictFunc } from '@/utils/format'
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from 'element-plus'
import { ref, reactive } from 'vue'


const route = useRoute()
const router = useRouter()

// 提交按钮loading
const btnLoading = ref(false)

const type = ref('')
const formData = ref({
            jobId: undefined,
            address: '',
            name: '',
            introduction: '',
            resumeBlobId: '',
            phone: '',
            email: '',
            suiObjectId: '',
            mediaType: '',
        })
// 验证规则
const rule = reactive({
})

const elFormRef = ref()

// 初始化方法
const init = async () => {
 // 建议通过url传参获取目标数据ID 调用 find方法进行查询数据操作 从而决定本页面是create还是update 以下为id作为url参数示例
    if (route.query.id) {
      const res = await findJobApplication({ ID: route.query.id })
      if (res.code === 0) {
        formData.value = res.data
        type.value = 'update'
      }
    } else {
      type.value = 'create'
    }
}

init()
// 保存按钮
const save = async() => {
      btnLoading.value = true
      elFormRef.value?.validate( async (valid) => {
         if (!valid) return btnLoading.value = false
            let res
           switch (type.value) {
             case 'create':
               res = await createJobApplication(formData.value)
               break
             case 'update':
               res = await updateJobApplication(formData.value)
               break
             default:
               res = await createJobApplication(formData.value)
               break
           }
           btnLoading.value = false
           if (res.code === 0) {
             ElMessage({
               type: 'success',
               message: '创建/更改成功'
             })
           }
       })
}

// 返回按钮
const back = () => {
    router.go(-1)
}

</script>

<style>
</style>
