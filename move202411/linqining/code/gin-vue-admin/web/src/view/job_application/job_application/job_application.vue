
<template>
  <div>
    <div class="gva-search-box">
      <el-form ref="elSearchFormRef" :inline="true" :model="searchInfo" class="demo-form-inline" :rules="searchRule" @keyup.enter="onSubmit">
      <el-form-item label="创建日期" prop="createdAt">
      <template #label>
        <span>
          创建日期
          <el-tooltip content="搜索范围是开始日期（包含）至结束日期（不包含）">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </span>
      </template>
      <el-date-picker v-model="searchInfo.startCreatedAt" type="datetime" placeholder="开始日期" :disabled-date="time=> searchInfo.endCreatedAt ? time.getTime() > searchInfo.endCreatedAt.getTime() : false"></el-date-picker>
       —
      <el-date-picker v-model="searchInfo.endCreatedAt" type="datetime" placeholder="结束日期" :disabled-date="time=> searchInfo.startCreatedAt ? time.getTime() < searchInfo.startCreatedAt.getTime() : false"></el-date-picker>
      </el-form-item>
        <el-form-item label="JobID" prop="jobId">
          <el-input v-model.number="searchInfo.jobId" placeholder="搜索条件" />
        </el-form-item>
      
        <el-form-item label="申请人钱包地址" prop="address">
         <el-input v-model="searchInfo.address" placeholder="搜索条件" />
        </el-form-item>
        <el-form-item label="申请人名字" prop="name">
         <el-input v-model="searchInfo.name" placeholder="搜索条件" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="searchInfo.phone" placeholder="搜索条件" />
        </el-form-item>

        <template v-if="showAllQuery">
          <!-- 将需要控制显示状态的查询条件添加到此范围内 -->
        </template>

        <el-form-item>
          <el-button type="primary" icon="search" @click="onSubmit">查询</el-button>
          <el-button icon="refresh" @click="onReset">重置</el-button>
          <el-button link type="primary" icon="arrow-down" @click="showAllQuery=true" v-if="!showAllQuery">展开</el-button>
          <el-button link type="primary" icon="arrow-up" @click="showAllQuery=false" v-else>收起</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-dialog title="发放Offer" v-model="grantDialogVisible">
      <el-tag type="success">{{ grantOfferForm.grantUserAddr }}</el-tag>
      <div  style="margin-top:30px">
        <el-form :model="grantOfferForm">
          <el-form-item label="截止时间" >
            <el-date-picker
                required
                v-model="grantOfferForm.deadline"
                type="datetime"
                placeholder="Select date and time"
            />
          </el-form-item>
        </el-form>
      </div>
      <div class="dialog-footer">
        <el-button @click="grantDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="grantOffer">确 定</el-button>
      </div>
    </el-dialog>
    <div class="gva-table-box">
        <div class="gva-btn-list">
            <el-button  type="primary" icon="plus" @click="openDialog()">新增</el-button>
            <el-button  icon="delete" style="margin-left: 10px;" :disabled="!multipleSelection.length" @click="onDelete">删除</el-button>
            
        </div>
        <el-table
        ref="multipleTable"
        style="width: 100%"
        tooltip-effect="dark"
        :data="tableData"
        row-key="ID"
        @selection-change="handleSelectionChange"
        >
        <el-table-column type="selection" width="55" />
        
        <el-table-column align="left" label="日期" prop="createdAt" width="180">
            <template #default="scope">{{ formatDate(scope.row.CreatedAt) }}</template>
        </el-table-column>
          <el-table-column align="left" label="JobID" prop="jobId" width="120" />
          <el-table-column align="left" label="申请人钱包地址" prop="address" width="120" />
          <el-table-column align="left" label="申请人名字" prop="name" width="120" />
          <el-table-column align="left" label="自我介绍" prop="introduction" width="120" />
          <el-table-column align="left" label="简历blobID" prop="resumeBlobId" width="120" v-slot="scope">
              <el-link v-if="scope.row.resumeBlobId" :href="'https://aggregator.walrus-testnet.walrus.space/v1/'+scope.row.resumeBlobId">下载简历</el-link>
          </el-table-column>

          <el-table-column align="left" label="电话" prop="phone" width="120" />
          <el-table-column align="left" label="邮箱" prop="email" width="120" />
          <el-table-column align="left" label="简历ObjectId" prop="suiObjectId" width="120" />
          <el-table-column align="left" label="文件类型" prop="mediaType" width="120" />
          <el-table-column align="left" label="offer交易摘要" prop="offerDigest" width="120" />

          <el-table-column align="left" label="操作" fixed="right" :min-width="appStore.operateMinWith">
            <template #default="scope">
            <el-button  type="primary" link class="table-button" @click="getDetails(scope.row)"><el-icon style="margin-right: 5px"><InfoFilled /></el-icon>查看</el-button>
            <el-button  type="primary" link icon="edit" class="table-button" @click="updateJobApplicationFunc(scope.row)">编辑</el-button>
            <el-button   type="primary" link icon="delete" @click="deleteRow(scope.row)">删除</el-button>
              <el-button   type="primary" link icon="document" @click="openGrantDialog(scope.row)">发放Offer</el-button>
            </template>
        </el-table-column>
        </el-table>
        <div class="gva-pagination">
            <el-pagination
            layout="total, sizes, prev, pager, next, jumper"
            :current-page="page"
            :page-size="pageSize"
            :page-sizes="[10, 30, 50, 100]"
            :total="total"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange"
            />
        </div>
    </div>
    <el-drawer destroy-on-close :size="appStore.drawerSize" v-model="dialogFormVisible" :show-close="false" :before-close="closeDialog">
       <template #header>
              <div class="flex justify-between items-center">
                <span class="text-lg">{{type==='create'?'新增':'编辑'}}</span>
                <div>
                  <el-button :loading="btnLoading" type="primary" @click="enterDialog">确 定</el-button>
                  <el-button @click="closeDialog">取 消</el-button>
                </div>
              </div>
            </template>

          <el-form :model="formData" label-position="top" ref="elFormRef" :rules="rule" label-width="80px">
            <el-form-item label="JobID:"  prop="jobId" >
              <el-input v-model.number="formData.jobId" disabled placeholder="请输入JobID" />
            </el-form-item>
            <el-form-item label="申请人钱包地址:"  prop="address" >
              <el-input v-model="formData.address" :clearable="true"  placeholder="请输入申请人钱包地址" />
            </el-form-item>
            <el-form-item label="申请人名字:"  prop="name" >
              <el-input v-model="formData.name" :clearable="true"  placeholder="请输入申请人名字" />
            </el-form-item>
            <el-form-item label="自我介绍:"  prop="introduction" >
              <el-input v-model="formData.introduction" :clearable="true"  placeholder="请输入自我介绍" />
            </el-form-item>
            <el-form-item label="简历blobID:"  prop="resumeBlobId" >
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
          </el-form>
    </el-drawer>

    <el-drawer destroy-on-close :size="appStore.drawerSize" v-model="detailShow" :show-close="true" :before-close="closeDetailShow" title="查看">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="JobID">
                {{ detailFrom.jobId }}
              </el-descriptions-item>
              <el-descriptions-item label="申请人钱包地址">
                  {{ detailFrom.address }}
              </el-descriptions-item>
              <el-descriptions-item label="申请人名字">
                  {{ detailFrom.name }}
              </el-descriptions-item>
              <el-descriptions-item label="自我介绍">
                  {{ detailFrom.introduction }}
              </el-descriptions-item>
              <el-descriptions-item label="简历blobID">
                  {{ detailFrom.resumeBlobId }}
              </el-descriptions-item>
              <el-descriptions-item label="电话">
                {{ detailFrom.phone }}
              </el-descriptions-item>
              <el-descriptions-item label="邮箱">
                {{ detailFrom.email }}
              </el-descriptions-item>
              <el-descriptions-item label="简历ObjectId">
                {{ detailFrom.suiObjectId }}
              </el-descriptions-item>
              <el-descriptions-item label="文件类型">
                {{ detailFrom.mediaType }}
              </el-descriptions-item>
              <el-descriptions-item label="offer交易摘要">
                {{ detailFrom.offerDigest }}
              </el-descriptions-item>
            </el-descriptions>
        </el-drawer>

  </div>
</template>

<script setup>
import {
  createJobApplication,
  deleteJobApplication,
  deleteJobApplicationByIds,
  updateJobApplication,
  findJobApplication,
  getJobApplicationList
} from '@/api/job_application/job_application'

// 全量引入格式化工具 请按需保留
import { formatDate } from '@/utils/format'
import {ElDialog, ElImage, ElMessage, ElMessageBox} from 'element-plus'
import { ref, reactive } from 'vue'
import { useAppStore } from "@/pinia"
import { useWalletActions,useWalletState} from "suiue";





defineOptions({
    name: 'JobApplication'
})

// 提交按钮loading
const btnLoading = ref(false)
const appStore = useAppStore()

// 控制更多查询条件显示/隐藏状态
const showAllQuery = ref(false)

// 自动化生成的字典（可能为空）以及字段
const formData = ref({
            address: '',
            name: '',
            introduction: '',
            resumeBlobId: '',
            phone: '',
            email: '',
            suiObjectId: '',
            mediaType: '',
            jobId: undefined,
            offerDigest: '',
})



// 验证规则
const rule = reactive({
})

const searchRule = reactive({
  createdAt: [
    { validator: (rule, value, callback) => {
      if (searchInfo.value.startCreatedAt && !searchInfo.value.endCreatedAt) {
        callback(new Error('请填写结束日期'))
      } else if (!searchInfo.value.startCreatedAt && searchInfo.value.endCreatedAt) {
        callback(new Error('请填写开始日期'))
      } else if (searchInfo.value.startCreatedAt && searchInfo.value.endCreatedAt && (searchInfo.value.startCreatedAt.getTime() === searchInfo.value.endCreatedAt.getTime() || searchInfo.value.startCreatedAt.getTime() > searchInfo.value.endCreatedAt.getTime())) {
        callback(new Error('开始日期应当早于结束日期'))
      } else {
        callback()
      }
    }, trigger: 'change' }
  ],
})

const elFormRef = ref()
const elSearchFormRef = ref()

// =========== 表格控制部分 ===========
const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const tableData = ref([])
const searchInfo = ref({})
// 重置
const onReset = () => {
  searchInfo.value = {}
  getTableData()
}

// 搜索
const onSubmit = () => {
  elSearchFormRef.value?.validate(async(valid) => {
    if (!valid) return
    page.value = 1
    getTableData()
  })
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  getTableData()
}

// 修改页面容量
const handleCurrentChange = (val) => {
  page.value = val
  getTableData()
}

// 查询
const getTableData = async() => {
  const table = await getJobApplicationList({ page: page.value, pageSize: pageSize.value, ...searchInfo.value })
  if (table.code === 0) {
    tableData.value = table.data.list
    total.value = table.data.total
    page.value = table.data.page
    pageSize.value = table.data.pageSize
  }
}

getTableData()

// ============== 表格控制部分结束 ===============

// 获取需要的字典 可能为空 按需保留
const setOptions = async () =>{
}

// 获取需要的字典 可能为空 按需保留
setOptions()


// 多选数据
const multipleSelection = ref([])
// 多选
const handleSelectionChange = (val) => {
    multipleSelection.value = val
}

// 删除行
const deleteRow = (row) => {
    ElMessageBox.confirm('确定要删除吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
            deleteJobApplicationFunc(row)
        })
    }

// 多选删除
const onDelete = async() => {
  ElMessageBox.confirm('确定要删除吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async() => {
      const IDs = []
      if (multipleSelection.value.length === 0) {
        ElMessage({
          type: 'warning',
          message: '请选择要删除的数据'
        })
        return
      }
      multipleSelection.value &&
        multipleSelection.value.map(item => {
          IDs.push(item.ID)
        })
      const res = await deleteJobApplicationByIds({ IDs })
      if (res.code === 0) {
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
        if (tableData.value.length === IDs.length && page.value > 1) {
          page.value--
        }
        getTableData()
      }
      })
    }

// 行为控制标记（弹窗内部需要增还是改）
const type = ref('')

// 更新行
const updateJobApplicationFunc = async(row) => {
    const res = await findJobApplication({ ID: row.ID })
    type.value = 'update'
    if (res.code === 0) {
        formData.value = res.data
        dialogFormVisible.value = true
    }
}


// 删除行
const deleteJobApplicationFunc = async (row) => {
    const res = await deleteJobApplication({ ID: row.ID })
    if (res.code === 0) {
        ElMessage({
                type: 'success',
                message: '删除成功'
            })
            if (tableData.value.length === 1 && page.value > 1) {
            page.value--
        }
        getTableData()
    }
}

// 弹窗控制标记
const dialogFormVisible = ref(false)

// 打开弹窗
const openDialog = () => {
    type.value = 'create'
    dialogFormVisible.value = true
}

// 关闭弹窗
const closeDialog = () => {
    dialogFormVisible.value = false
    formData.value = {
        address: '',
        name: '',
        introduction: '',
        resumeBlobId: '',
        phone: '',
        email: '',
        suiObjectId: '',
        mediaType: '',
        jobId: undefined,
        offerDigest: '',
    }
}
// 弹窗确定
const enterDialog = async () => {
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
                closeDialog()
                getTableData()
              }
      })
}


const detailFrom = ref({})

// 查看详情控制标记
const detailShow = ref(false)


// 打开详情弹窗
const openDetailShow = () => {
  detailShow.value = true
}


// 打开详情
const getDetails = async (row) => {
  // 打开弹窗
  const res = await findJobApplication({ ID: row.ID })
  if (res.code === 0) {
    detailFrom.value = res.data
    openDetailShow()
  }
}


// 关闭详情弹窗
const closeDetailShow = () => {
  detailShow.value = false
  detailFrom.value = {}
}

import {getJob} from "@/api/job/job.go";

const {isConnected} = useWalletState();

const grantDialogVisible = ref(false)

const openGrantDialog =  (row) => {
  if (!isConnected.value){
    ElMessage({
      type: 'error',
      message: '先连接钱包'
    })
    return
  }
  grantOfferForm.value.grantUserAddr = row.address;
  grantOfferForm.value.applicationID = row.ID;
  getJob({ id: row.jobId }).then((result)=>{
    console.log("result",result);
    if (result.code === 0) {
      grantOfferForm.value.jobBlobID = result.data.blobId;
    }else{
      ElMessage({
        type:"error",
        message: result.msg,
      })
      return
    }
  }).catch((e)=>{
    console.log(e)
    return
  })

  console.log(grantOfferForm);
  grantDialogVisible.value=true
}


import {updateDigest} from "@/api/job_application/job_application"

const grantOfferForm = ref({
  deadline: undefined, // offer的截止时间
  grantUserAddr:'', //
  jobBlobID: '',
  applicationID:0,
})

import {TransactionBlock} from "@mysten/sui.js/transactions";
const {signAndExecuteTransactionBlock} = useWalletActions()

// 给申请人发放offer
const grantOffer = async()=>{
  console.log(grantOfferForm.value)
  if (!grantOfferForm.value.deadline){
    ElMessage({
      type: 'error',
      message: '请选择日期'
    })
    return
  }
  console.log(grantOfferForm.value.deadline.getTime());
  const txb = new TransactionBlock()
  txb.moveCall({
    target: `0x5288956e80169697c8ce0e268bb6361963d69b2bc5041857d8427772baee1bbb::offer::offer`,
    arguments: [
      txb.pure.address(grantOfferForm.value.grantUserAddr),
      txb.pure.string(grantOfferForm.value.jobBlobID),
      txb.pure.u64(grantOfferForm.value.deadline.getTime()),
    ],
    typeArguments: []
  })

  await signAndExecuteTransactionBlock(txb).then((digest)=>{
    console.log(digest)
    ElMessage({
      type: 'success',
      message: '发奖Offer成功'
    })
    updateDigest({
      id: grantOfferForm.value.applicationID,
      offerDigest: digest.digest,
    }).then((res)=>{
      console.log(res);
      grantDialogVisible.value = false
    })
  })
}

</script>
