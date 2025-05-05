interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        packageID: "0x7d387a9eed33a9821a15e4aa2ac8756fd90a24494b11f4b9641df65a5bca2a78",
        stateID: "0xd7e37e0c9baa25b7c4203c0643f7d9991b2cd9a2f7b330b48b6c910bd7a58063"
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111", //TODO
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}