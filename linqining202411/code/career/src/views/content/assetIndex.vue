<script setup >
// import balancesTable from "./assets/balancesTable.vue"
import NftList from "@/views/content/assets/nftList.vue";
import {NCard,NTabs,NTabPane} from "naive-ui";
</script>

<template>
  <n-card content-style="padding: 0; min-height: 320px">
    <n-tabs
        type="line"
        size="medium"
        animated
        :tabs-padding="20"
    >
<!--      <n-tab-pane name="BALANCES">-->
<!--        <balances-table/>-->
<!--      </n-tab-pane>-->
      <n-tab-pane name="证书">
        <nft-list/>
      </n-tab-pane>
    </n-tabs>
  </n-card>
</template>
