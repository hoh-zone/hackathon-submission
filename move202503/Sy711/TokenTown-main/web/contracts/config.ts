interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x1affef9963007b5052ee5d84f09d491466381b597d74974dab66de0f8d02a160",
        Vault:"0x3346c3e2c8ae0a802b0df967f97443b5a4cc799027224dcf4f956a4a43082e4c",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}