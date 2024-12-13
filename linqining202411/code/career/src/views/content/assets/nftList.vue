<script setup>
import {useWalletQuery} from "suiue";

import {computed} from "vue";
import {NText,NImage,NGrid,NGridItem,NFlex} from "naive-ui";


const {objects,loadAllObjects} = useWalletQuery();
loadAllObjects();
console.log("nft objects",objects)
const datas = computed(() => {
    const result = []
    for (const key in objects) {
        for (const obj of objects[key]) {

            if (!obj.display) {
                continue
            }
            console.log(obj.type.toString())
            if (!obj.type.toString().includes("CFACertificate")){
                continue
            }
            let newObj = {}
            Object.assign(newObj, obj.display)
            result.push(newObj)
        }
    }
    return result
})

</script>

<template>
    <n-grid :cols="3" x-gap="8" y-gap="8">
        <n-grid-item v-for="obj in datas" :key="obj.id">
            <n-flex vertical align="center">
                <n-image width="100%" :src="obj.image_url"/>
                <n-text>{{ obj.name }}</n-text>
            </n-flex>
        </n-grid-item>
    </n-grid>

</template>

<style scoped>

</style>