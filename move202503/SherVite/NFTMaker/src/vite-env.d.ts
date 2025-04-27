/// <reference types="vite/client" />

/// <reference types="vite/client" />
 
interface ImportMetaEnv {
    readonly VITE_DEVNET_NFT_PACKAGE_ID: string 
    readonly VITE_TESTNET_NFT_PACKAGE_ID: string 
    readonly VITE_MAINNET_NFT_PACKAGE_ID: string 
    // 其他环境变量...
  } 
   
  interface ImportMeta {
    readonly env: ImportMetaEnv 
  }