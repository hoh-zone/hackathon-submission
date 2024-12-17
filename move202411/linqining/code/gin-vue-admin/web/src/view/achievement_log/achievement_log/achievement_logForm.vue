
<template>
  <div>
    <div class="gva-form-box">
      <el-form :model="formData" ref="elFormRef" label-position="right" :rules="rule" label-width="80px">
        <el-form-item label="交易digest:" prop="digest">
          <el-input v-model="formData.digest" :clearable="true"  placeholder="请输入交易digest" />
       </el-form-item>
        <el-form-item label="获奖人地址:" prop="receiver_address">
          <el-input v-model="formData.receiver_address" :clearable="true"  placeholder="请输入获奖人地址" />
       </el-form-item>
        <el-form-item label="发奖人地址:" prop="sender_address">
          <el-input v-model="formData.sender_address" :clearable="true"  placeholder="请输入发奖人地址" />
       </el-form-item>
        <el-form-item label="奖金(SUI):" prop="sui_amount">
          <el-input v-model.number="formData.sui_amount" :clearable="true" placeholder="请输入" />
       </el-form-item>
        <el-form-item label="成就名:" prop="achievement_name">
          <el-input v-model="formData.achievement_name" :clearable="true"  placeholder="请输入成就名" />
       </el-form-item>
        <el-form-item label="图片:" prop="achievement_image">
          <el-input v-model="formData.achievement_image" :clearable="true"  placeholder="请输入图片" />
       </el-form-item>
        <el-form-item label="成就ObjectID:" prop="achievement_id">
          <el-input v-model="formData.achievement_id" :clearable="true"  placeholder="请输入成就ObjectID" />
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
  createAchievementLog,
  updateAchievementLog,
  findAchievementLog
} from '@/api/achievement_log/achievement_log'

defineOptions({
    name: 'AchievementLogForm'
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
            digest: '',
            receiver_address: '',
            sender_address: '',
            sui_amount: undefined,
            achievement_name: '',
            achievement_image: '',
            achievement_id: '',
        })
// 验证规则
const rule = reactive({
})

const elFormRef = ref()

// 初始化方法
const init = async () => {
 // 建议通过url传参获取目标数据ID 调用 find方法进行查询数据操作 从而决定本页面是create还是update 以下为id作为url参数示例
    if (route.query.id) {
      const res = await findAchievementLog({ ID: route.query.id })
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
               res = await createAchievementLog(formData.value)
               break
             case 'update':
               res = await updateAchievementLog(formData.value)
               break
             default:
               res = await createAchievementLog(formData.value)
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
