interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0xbc78a9140025d4f9bcfd01c6a392ed851b523ad2b8403a25cde4f4c7245811ca",
        DemoPool:"0xd561b734acee218ac4ba50d05bb75f441f47d8e546c0556aa8d608298cf76d33",
        State:"0x5a865c349ae2dc63e5b157e596da098a3e94bce2ab8befbf9d4e97cb3d815118",
        AdminList:"0x17f538eb3cba660d1c5f4fb6f4f43a6b1204bb862f04e02f08fb37e751b438cc",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}