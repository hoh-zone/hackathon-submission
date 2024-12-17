<template>
  <div>
    <el-button @click="refresh" type="primary" style="width: 50px;margin: 10px;float: right;">加载</el-button>
  </div>
  <el-tabs type="border-card">
    <el-tab-pane label="获得证书">
      <el-row :gutter="0" >
        <el-col :span="6" v-for="(item, index) in certificates" :key="index" >
          <div style="padding: 10px">
            <el-card :body-style="{ padding: '2px' }">

              <div style="padding: 14px;">
                <div>
                  <div>
                    <span>证书:</span> <span>{{item.type.split("::")[1]}}</span>
                  </div>
                  <el-image :src="item.display.image_url" ></el-image>
                </div>
                <div>
                  <span>授予人:</span> <span>{{item.display.qualifier_name}}</span>
                </div>
                <div><span>照片:</span><el-image :src="item.display.qualifier_image_url"></el-image></div>
                <div class="bottom clearfix">
                  <el-button type="success" >
                    <el-link :href="`https://suivision.xyz/object/`+item.id" target="_blank">查看</el-link>
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </el-tab-pane>
    <el-tab-pane label="获得荣誉">
      <el-row :gutter="0" >
        <el-col :span="6" v-for="(item, index) in achievements" :key="index" >
          <div style="padding: 10px">
            <el-card :body-style="{ padding: '2px' }" shadow="always" style="padding: 10px">
              <el-image :src="item.contents.image_url" class="image" ></el-image>
              <div style="padding: 14px;">
                <div>
                  <span>荣誉:</span> <span>{{item.contents.desc}}</span>
                </div>
                <div><span>奖金:</span><span>{{item.contents.prize.value/consts.MIST_PER_SUI}}SUI</span></div>
                <div class="bottom clearfix">
                  <el-space spacer="|">
                      <el-button type="success" >
                        <el-link :href="`https://suivision.xyz/object/`+item.id" target="_blank">查看</el-link>
                      </el-button>
                      <el-button type="success" v-if="item.contents.prize.value>0" @click="withDraw(item)">
                        提取奖金
                      </el-button>
                  </el-space>
                </div>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </el-tab-pane>
  </el-tabs>


  <el-dialog title="提取奖金" v-model="withdrawDialogVisible">
    <el-tag type="success">{{formData.obj.contents.desc}}</el-tag>
    <div  style="margin-top:30px">
      <el-form :model="formData">
        <el-form-item label="金额" >
          <el-input v-model="formData.amount" autocomplete="off" :max="formData.obj.contents.prize.value/consts.MIST_PER_SUI"></el-input>
        </el-form-item>
      </el-form>
    </div>

    <div class="dialog-footer">
      <el-button @click="withdrawDialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="confirmWithdraw">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import {useWalletQuery,useWalletState,consts,useWalletActions} from "suiue";
import {ElCard, ElImage, ElRow, ElButton, ElCol, ElMessage,ElSpace} from "element-plus";
import { ref,watch } from "vue";
const {objects,loadAllObjects} = useWalletQuery();
const {isConnected} = useWalletState();


watch(isConnected,(Value)=>{
  if (Value){
    refresh()
  }
},{deep:true,immediate:false})


const certificates = ref([])

const achievements = ref([])

const refresh = ()=>{
  loadAllObjects();
  certificates.value = filteredCertificates();
  achievements.value = filteredAchievement();
}

const filteredCertificates = () => {
  const result = []
  for (const key in objects) {
    for (const obj of objects[key]) {
      if (obj.type=="0x52e42b171229db14d8cee617bd480f9ee6998a00802ff0438611e2a7393deee1::cfa::CFACertificate"){ //  证书合约
        result.push(obj)
      }
    }
  }
  console.log("Certificates",result)
  return result
}

const filteredAchievement = () => {
  const result = []
  for (const key in objects) {
    for (const obj of objects[key]) {
      if (obj.type=="0xe814d35068a021e7dfabee1610f4be0396bfe7a61606f8a270e76271c8b673ba::achievement::Achievement") {
        result.push(obj)
      }// 荣誉合约
    }
  }
  console.log("Achievement",result)
  return result
}

const withdrawDialogVisible = ref(false)
const formData = ref({
  objectID:'',
  amount:0,
  obj:{},
})

const withDraw =(obj)=>{
  console.log(obj.id)
  formData.value.obj=obj;
  formData.value.objectID = obj.id;
  formData.value.amount = obj.contents.prize.value/consts.MIST_PER_SUI;
  withdrawDialogVisible.value = true
}

import {TransactionBlock} from "@mysten/sui.js/transactions";
const {signAndExecuteTransactionBlock} = useWalletActions()

const confirmWithdraw=()=>{
  if (!isConnected.value){
    ElMessage({
      type: 'error',
      message: '先连接钱包'
    })
    return
  }
  const withdrawSuiAmount = formData.value.amount *consts.MIST_PER_SUI;
  console.log(withdrawSuiAmount)
  const txb = new TransactionBlock()
  txb.moveCall({
    target: `0xe814d35068a021e7dfabee1610f4be0396bfe7a61606f8a270e76271c8b673ba::achievement::withdraw`,
    arguments: [
      txb.object(formData.value.objectID),
      txb.pure.u64(withdrawSuiAmount),
    ],
    typeArguments: []
  })
  signAndExecuteTransactionBlock(txb).then((digest)=>{
    console.log(digest)
    ElMessage({
      type: 'success',
      message: '提取成功'
    })
  })
  withdrawDialogVisible.value = false
}




</script>
