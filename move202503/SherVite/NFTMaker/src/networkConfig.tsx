import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_NFT_PACKAGE_ID,
  TESTNET_NFT_PACKAGE_ID,
  MAINNET_NFT_PACKAGE_ID,
} from "./constants.ts";
import { createNetworkConfig } from "@mysten/dapp-kit";
// import { Flex, Button } from "@radix-ui/themes"; // 新增导入 
// 1. 从环境变量读取包ID（推荐方式）
// const DEVNET_NFT_PACKAGE_ID = import.meta.env.VITE_DEVNET_NFT_PACKAGE_ID; 
// const TESTNET_NFT_PACKAGE_ID = import.meta.env.VITE_TESTNET_NFT_PACKAGE_ID; 
// const MAINNET_NFT_PACKAGE_ID = import.meta.env.VITE_MAINNET_NFT_PACKAGE_ID; 



const { networkConfig, useNetworkVariable, useNetworkVariables } = 
  createNetworkConfig({ 
    devnet: { 
      url: getFullnodeUrl("devnet"), 
      variables: { 
        nftPackageId: DEVNET_NFT_PACKAGE_ID, 
      }, 
    }, 
    testnet: { 
      url: getFullnodeUrl("testnet"), 
      variables: { 
        nftPackageId: TESTNET_NFT_PACKAGE_ID, 
      }, 
    }, 
    mainnet: {
       url: getFullnodeUrl("mainnet"), 
       variables: { 
        nftPackageId: MAINNET_NFT_PACKAGE_ID, 
      }, 
    }, 
  }); 
  
  export { useNetworkVariable, useNetworkVariables, networkConfig };






// // 2. 完整网络配置 
// export const { 
//   networkConfig, 
//   useNetworkVariable 
// } = createNetworkConfig({
//   devnet: {
//     url: getFullnodeUrl("devnet"), // 使用官方SDK自动获取节点URL 
//     variables: {
//       nftPackageId: DEVNET_NFT_PACKAGE_ID,
//       // 可添加其他合约ID 
//     },
//   },
//   testnet: {
//     url: getFullnodeUrl("testnet"),
//     variables: {
//       nftPackageId: TESTNET_NFT_PACKAGE_ID,
//     },
//   },
//   mainnet: {
//     url: getFullnodeUrl("mainnet"),
//     variables: {
//       nftPackageId: MAINNET_NFT_PACKAGE_ID,
//     },
//   },
// });

// 导出
// 网络切换组件 



// // 新增网络切换组件（可放在导航栏）
// export function NetworkSwitcher() { // 添加 export 
//   const { activeNetwork, setActiveNetwork } = useNetwork();
//   const networks = ["devnet", "testnet", "mainnet"] as const;
//   // return (
//   //   <Button.Group>
//   //     <Button onClick={() => setActiveNetwork("devnet")}>Devnet</Button>
//   //     <Button onClick={() => setActiveNetwork("testnet")}>Testnet</Button>
//   //     <Button onClick={() => setActiveNetwork("mainnet")}>Mainnet</Button>
//   //   </Button.Group>
//   // );
//   return (
//     <Flex gap="2" align="center">
//       {networks.map((network)  => (
//         <Button 
//           key={network}
//           size="1"
//           variant={activeNetwork === network ? "solid" : "soft"}
//           onClick={() => setActiveNetwork(network)}
//         >
//           {network.charAt(0).toUpperCase()  + network.slice(1)} 
//         </Button>
//       ))}
//     </Flex>
//   );
// }