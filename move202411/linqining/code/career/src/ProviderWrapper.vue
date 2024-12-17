<script setup >
import App from "@/App.vue";
import {SuiueProvider} from "suiue";
</script>

<template>
  <suiue-provider :config="{
        requiredFeatures: ['sui:signMessage', 'sui:signTransactionBlock', 'sui:signAndExecuteTransactionBlock'],
        autoConnect: 'enable'
    }">
    <app>
    </app>
  </suiue-provider>

</template>