interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x4b7ff889cd0a22729f07bf7df6b828fe9565f8a5a216c1f0ed2ea00d188241ba",
        Vault:"0x683e2bf44826ddf9096c3ce119d9d958436c1601f9ce292886483a6a61e45505",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}