// src/suiClient.ts
import { SuiClient } from '@mysten/sui/client';

export const RPC_URL = import.meta.env.VITE_SUI_RPC_URL;
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID as string;

// 这里把实例命名为 provider，供其他模块直接使用
export const provider = new SuiClient({ url: RPC_URL });

// 如果你还想保留 client 名，也可以这样再导出
export const client = provider;

// 如之前说明，地址类型直接用 string 即可
export type Address = string;

