interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x360612683ee1926b0837cdbe47522bb1e14c347d3b43b2ba7748f4aeef170441",
        Vault:"0xc05291d3a3b3a53c486795cdf5438c11aba63e5eb4e91b54717e5923f8a5e7be",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}