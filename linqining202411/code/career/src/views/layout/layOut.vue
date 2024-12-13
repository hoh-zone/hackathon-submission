<script setup >
import { useWalletState} from "suiue"
import { ref } from 'vue'
import 'vfonts/Lato.css'
import {NModal, NButton, NGrid, NGridItem, NFlex, NText} from "naive-ui";
import {useWalletQuery} from "suiue";
import {loginByAddress} from "@/api/user";
import router from "@/router";


const {isConnected, address, connect, disconnect, wallets} = useWalletState();
const {domain} = useWalletQuery()

const showModal = ref(false)

const showTag = ref(1)

const showHomeTag=()=>{
  showTag.value=1
}
const showCompanyTag=()=>{
  showTag.value=2
}
const showProfileTag=()=>{
  showTag.value=3
}

const toggleModal = () => {
  showModal.value = !showModal.value
}

if (!address._value||!isConnected){
  console.log("not connect")
  router.push({ path: '/login'})
}else{
  console.log("loginedaddress",address._value)
}

const connectSuccess = ()=>{
  toggleModal();
  // TODO 仅demo展示，安全风险
  loginByAddress({"address":address._value}).then(res=>{
    console.log(res);
  }).catch(err=>{
    console.log(err);
  })
}

var mouseIn = false
</script>

<style >
@import "../../style/home/style.css";
</style>
<style rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/5.0.0/normalize.min.css"></style>
<template>
  <!-- partial:index.partial.html -->
  <div class="job">
    <div class="header">
      <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path xmlns="http://www.w3.org/2000/svg" d="M512 503.5H381.7a48 48 0 01-45.3-32.1L265 268.1l-9-25.5 2.7-124.6L338.2 8.5l23.5 67.1L512 503.5z" fill="#0473ff" data-original="#28b446" />
          <path xmlns="http://www.w3.org/2000/svg" fill="#0473ff" data-original="#219b38" d="M361.7 75.6L265 268.1l-9-25.5 2.7-124.6L338.2 8.5z" />
          <path xmlns="http://www.w3.org/2000/svg" d="M338.2 8.5l-82.2 234-80.4 228.9a48 48 0 01-45.3 32.1H0l173.8-495h164.4z" fill="#0473ff" data-original="#518ef8" />
        </svg>
        Milao
      </div>
      <div class="header-menu">
        <router-link to="home" :class="{active:showTag==1}" @click="showHomeTag">首页</router-link>
        <router-link to="company"  :class="{active:showTag==2}" @click="showCompanyTag">公司</router-link>
        <router-link to="profile" :class="{active:showTag==3}" @click="showProfileTag">我的</router-link>
      </div>
      <div class="user-settings">
        <div class="dark-light">
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
        </div>
        <div class="user-menu">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-square">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
        </div>
        <img class="user-profile" src="../../assets/img/tx.png" alt="">
        <div class="user-name">
<!--          钱包{{isConnected}}<n-connect-button>钱包</n-connect-button>-->
            <n-button
                v-bind="$attrs"
                @mouseenter="mouseIn = true"
                @mouseleave="mouseIn = false"
                @click="isConnected ? disconnect() : toggleModal()"
                style="width: 128px"
                >
                <template v-if="!mouseIn">
                  <span style="text-overflow: ellipsis; overflow: hidden ">
                      {{ isConnected ? (domain ? domain : address) : "connect" }}
                  </span>
                </template>
                <template v-else>
                  <span> {{ isConnected ? "disconnect" : "connect" }} </span>
                </template>
            </n-button>
          <n-modal
              v-if="showModal"
              transform-origin="center"
              bordered
              preset="card"
              title="Connect Wallet"
              :closable="true"
              v-model:show="showModal"
              :mask-closable="false"
              :close-on-esc="true"
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

          </div>
      </div>
    </div>
    <div class="wrapper">
      <router-view/>
    </div>
  </div>
    <walletContent/>
</template>

<script>
export default {
  name: 'layOut',
  components: {},
  methods: {}
}
</script>