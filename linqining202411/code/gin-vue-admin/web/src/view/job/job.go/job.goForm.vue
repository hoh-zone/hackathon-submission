
<template>
  <div>
    <div class="gva-form-box">
      <el-form :model="formData" ref="elFormRef" label-position="right" :rules="rule" label-width="80px">
        <el-form-item label="公司id:" prop="companyId">
          <el-input v-model.number="formData.companyId" :clearable="true" placeholder="请输入" />
       </el-form-item>
        <el-form-item label="职位描述:" prop="description">
          <el-input v-model.number="formData.description" :clearable="true" placeholder="请输入" />
       </el-form-item>
        <el-form-item label="薪资下限:" prop="salarmBottom">
          <el-input v-model.number="formData.salarmBottom" :clearable="true" placeholder="请输入" />
       </el-form-item>
        <el-form-item label="薪资上限:" prop="salaryCeil">
          <el-input v-model.number="formData.salaryCeil" :clearable="true" placeholder="请输入" />
       </el-form-item>
        <el-form-item label="WalrusBlobId:" prop="blobId">
          <el-input v-model="formData.blobId" :clearable="true"  placeholder="请输入WalrusBlobId" />
       </el-form-item>
        <el-form-item label="id:" prop="id">
          <el-input v-model.number="formData.id" :clearable="true" placeholder="请输入" />
       </el-form-item>
        <el-form-item label="标题:"  prop="title" >
          <el-input v-model="formData.title" :clearable="true"  placeholder="请输入标题" />
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
  createJob,
  updateJob,
  findJob
} from '@/api/job/job.go'

defineOptions({
    name: 'JobForm'
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
            companyId: undefined,
            description: undefined,
            salarmBottom: undefined,
            salaryCeil: undefined,
            blobId: '',
            id: undefined,
            title:'',
        })
// 验证规则
const rule = reactive({
})

const elFormRef = ref()

// 初始化方法
const init = async () => {
 // 建议通过url传参获取目标数据ID 调用 find方法进行查询数据操作 从而决定本页面是create还是update 以下为id作为url参数示例
    if (route.query.id) {
      const res = await findJob({ ID: route.query.id })
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
               res = await createJob(formData.value)
               break
             case 'update':
               res = await updateJob(formData.value)
               break
             default:
               res = await createJob(formData.value)
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
