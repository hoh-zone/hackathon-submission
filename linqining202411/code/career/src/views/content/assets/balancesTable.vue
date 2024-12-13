<script setup >
import {useWalletQuery} from "suiue";
import {ref, watchEffect} from "vue";
import {NIcon,NTable}  from "naive-ui";

const {balances, client} = useWalletQuery()
const coin_datas = ref([] )

watchEffect(async () => {
    const result = []
    for (const key in balances) {
        const balance = balances[key]
        const metadata = await client.getCoinMetadata({
            coinType: balance.type
        })
        result.push({
            icon: metadata?.iconUrl,
            name: metadata?.name,
            symbol: metadata?.symbol,
            type: balance.type,
            balance: (parseFloat(balance.totalBalance) / Math.pow(10, metadata?.decimals || 0)).toFixed(2),
            objCount: balance.coinObjectCount
        })
    }
    coin_datas.value = result
})
</script>

<template>
    <n-table style="width: 100%">
        <thead>
        <tr>
            <th>ICON</th>
            <th>NAME</th>
            <th>SYMBOL</th>
            <th>TYPE</th>
            <th>BALANCE</th>
            <th>OBJS</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="balance in coin_datas" :key="balance.type">
            <td><n-icon><img :src="balance.icon ?? ''" alt="" /></n-icon></td>
            <td>{{ balance.name }}</td>
            <td>{{ balance.symbol }}</td>
            <td>{{ balance.type }}</td>
            <td>{{ balance.balance }}</td>
            <td>{{ balance.objCount }}</td>
        </tr>
        </tbody>

    </n-table>
</template>

<style scoped></style>