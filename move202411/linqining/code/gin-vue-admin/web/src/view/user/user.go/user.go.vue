
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

    <el-dialog title="授予奖励" v-model="grantDialogVisible">
      <el-tag type="success">{{grantForm.grantUserAddr}}</el-tag>
      <div  style="margin-top:30px">
        <el-form :model="grantForm">
          <el-form-item label="成就">
            <el-select
                v-model="grantForm.achievement" placeholder="请选择"
                filterable
                remote
                :remote-method="searchAchievement"
                :loading="loading">
              <el-option
                  v-for="item in achievementOptions"
                  :key="item.ID"
                  :label="item.name"
                  :value="item">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="金额" >
            <el-input v-model="grantForm.amount" autocomplete="off"></el-input>
          </el-form-item>
        </el-form>
      </div>

      <div class="dialog-footer">
        <el-button @click="grantDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="grantAchievement">确 定</el-button>
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
        
          <el-table-column align="left" label="用户名" prop="name" width="120" />
          <el-table-column align="left" label="钱包地址" prop="address" width="120" />
          <el-table-column align="left" label="头像" prop="avatar" width="120" />
        <el-table-column align="left" label="操作" fixed="right" :min-width="appStore.operateMinWith">
            <template #default="scope">
            <el-button  type="primary" link class="table-button" @click="getDetails(scope.row)"><el-icon style="margin-right: 5px"><InfoFilled /></el-icon>查看</el-button>
            <el-button  type="primary" link icon="edit" class="table-button" @click="updateUserFunc(scope.row)">编辑</el-button>
            <el-button   type="primary" link icon="delete" @click="deleteRow(scope.row)">删除</el-button>
              <el-button   type="primary" link icon="trophy" @click="grant(scope.row)">奖励</el-button>
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
            <el-form-item label="用户名:"  prop="name" >
              <el-input v-model="formData.name" :clearable="true"  placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="钱包地址:"  prop="address" >
              <el-input v-model="formData.address" :clearable="true"  placeholder="请输入钱包地址" />
            </el-form-item>
            <el-form-item label="头像:"  prop="avatar" >
              <el-input v-model="formData.avatar" :clearable="true"  placeholder="请输入头像" />
            </el-form-item>
          </el-form>
    </el-drawer>

    <el-drawer destroy-on-close :size="appStore.drawerSize" v-model="detailShow" :show-close="true" :before-close="closeDetailShow" title="查看">
            <el-descriptions :column="1" border>
                    <el-descriptions-item label="用户名">
                        {{ detailFrom.name }}
                    </el-descriptions-item>
                    <el-descriptions-item label="钱包地址">
                        {{ detailFrom.address }}
                    </el-descriptions-item>
                    <el-descriptions-item label="头像">
                        {{ detailFrom.avatar }}
                    </el-descriptions-item>
            </el-descriptions>
        </el-drawer>

  </div>
</template>

<script setup>
import {
  createUser,
  deleteUser,
  deleteUserByIds,
  updateUser,
  findUser,
  getUserList, getCertificate
} from '@/api/user/user.go'

// 全量引入格式化工具 请按需保留
import { getDictFunc, formatDate, formatBoolean, filterDict ,filterDataSource, returnArrImg, onDownloadFile } from '@/utils/format'
import {ElDialog, ElMessage, ElMessageBox} from 'element-plus'
import { ref, reactive } from 'vue'
import { useAppStore } from "@/pinia"
import {useWalletActions,useWalletState,consts} from "suiue";




defineOptions({
    name: 'User'
})

// 提交按钮loading
const btnLoading = ref(false)
const appStore = useAppStore()

// 控制更多查询条件显示/隐藏状态
const showAllQuery = ref(false)

// 自动化生成的字典（可能为空）以及字段
const formData = ref({
            name: '',
            address: '',
            avatar: '',
        })



// 验证规则
const rule = reactive({
               address : [{
                   required: true,
                   message: '',
                   trigger: ['input','blur'],
               },
               {
                   whitespace: true,
                   message: '不能只输入空格',
                   trigger: ['input', 'blur'],
              }
              ],
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

const grantForm = ref({
  amount:0,
  achievement:{},
  grantUserAddr:"",
})
// 授权控制标记
const grantDialogVisible = ref(false)

const {signAndExecuteTransactionBlock} = useWalletActions()
const {isConnected,address } = useWalletState();
import {TransactionBlock} from "@mysten/sui.js/transactions";
// const {objects,loadAllObjects,loadObjects} = useWalletQuery();


const grant =  (row) => {
  grantDialogVisible.value=true
  grantForm.value.grantUserAddr = row.address
  console.log(row);
}

const achievementOptions =ref([])
import {getAchievementList} from "@/api/achievement/achievement"
const searchAchievement = async ()=>{
  if (!isConnected.value){
    ElMessage({
      type: 'error',
      message: '先连接钱包'
    })
    return
  }
  await getAchievementList({"ownerAddress": address._value}).then((res)=>{
    console.log(res)
    achievementOptions.value = res.data.list;
  })
}

import {createAchievementLog} from "@/api/achievement_log/achievement_log"
const grantAchievement = async()=>{
  console.log(grantForm.value)
  const grantSuiAmount = grantForm.value.amount *consts.MIST_PER_SUI;
  console.log(grantSuiAmount)
  const txb = new TransactionBlock()
  const [coin] = txb.splitCoins(txb.gas, [txb.pure(grantSuiAmount)]);
  txb.moveCall({
    target: `0xe814d35068a021e7dfabee1610f4be0396bfe7a61606f8a270e76271c8b673ba::achievement::grant_achievement`,
    arguments: [
      txb.object(grantForm.value.achievement.objectID),
      coin,
      txb.pure.address(grantForm.value.grantUserAddr),
    ],
    typeArguments: []
  })

  await signAndExecuteTransactionBlock(txb).then((digest)=>{
    console.log(digest)
    console.log("发奖成功")
    createAchievementLog({
      digest: digest.digest,
      receiver_address: grantForm.value.grantUserAddr,
      sender_address: address._value,
      sui_amount: grantSuiAmount,
      achievement_name: grantForm.value.achievement.name,
      achievement_image: grantForm.value.achievement.image,
      achievement_id: grantForm.value.achievement.objectID,
    }).then((res)=>{
      console.log(res);
      grantDialogVisible.value = false
    })
  })
}


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
  const table = await getUserList({ page: page.value, pageSize: pageSize.value, ...searchInfo.value })
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
            deleteUserFunc(row)
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
      const res = await deleteUserByIds({ IDs })
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
const updateUserFunc = async(row) => {
    const res = await findUser({ ID: row.ID })
    type.value = 'update'
    if (res.code === 0) {
        formData.value = res.data
        dialogFormVisible.value = true
    }
}


// 删除行
const deleteUserFunc = async (row) => {
    const res = await deleteUser({ ID: row.ID })
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
        name: '',
        address: '',
        avatar: '',
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
                  res = await createUser(formData.value)
                  break
                case 'update':
                  res = await updateUser(formData.value)
                  break
                default:
                  res = await createUser(formData.value)
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
  const res = await findUser({ ID: row.ID })
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


</script>

<style>

</style>
