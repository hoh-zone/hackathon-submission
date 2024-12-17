<script setup>
import {NModal, NButton, NGrid, NGridItem, NFlex, NText,NA} from "naive-ui";
import {ref} from "vue";
import {useWalletState} from "suiue";
import {loginByAddress} from "@/api/user";
import router from "@/router/index"
const showModal = ref(true)

const {address, connect, wallets} = useWalletState();

const connectSuccess = ()=>{
  // TODO 仅demo展示，安全风险
  loginByAddress({"address":address.value}).then(res=>{
    console.log(res);
  }).catch(err=>{
    console.log(err);
  })
  router.push({"path":"/home"})
}

</script>
<template>
  <n-modal
      transform-origin="center"
      bordered
      preset="card"
      title="Connect Wallet"
      :closable="true"
      v-model:show="showModal"
      :mask-closable="false"
      style="min-width: 480px; max-width: 860px; width: 40vw"
  >
    <template #header-extra >
      <n-a href="https://github.com/SuiFansCN/suiue" target="blank">Suiue by suifans</n-a>
    </template>

    <n-grid
        :cols="3"
        :x-gap="24"
        :y-gap="24"
    >
      <n-grid-item v-for="wallet in wallets" :key="JSON.stringify(wallet.chains)">
        <n-button @click="connect(wallet).then(connectSuccess())" style="height: 114px; width: 100%">
          <n-flex style="height: 100%; width: 100%;" vertical size="large">
            <img style="width: 58px; margin: auto" :src="wallet.icon" :alt="wallet.name">
            <n-text>{{ wallet.name }}</n-text>
          </n-flex>
        </n-button>
      </n-grid-item>
    </n-grid>
  </n-modal>
</template>
