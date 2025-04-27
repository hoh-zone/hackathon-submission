ADMIN_ADDRESS="0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc"
CLOCK = "0x6"


## Coin Contract
**Deployment Time**: 2025-04-23
**Network**: Sui Testnet
**Deployment Transaction**: `9n5ZFJ59cteE9fHpLXRoRcpHzKXVaGdnTmk9eWQoipeH`

### Contract Address
- **Package ID**: `0x23fda431351da3c9a3878a4200c76ececd7e17b237d0332751cfde64586e187d`
- **Package Version**: 1
- **Module List**:

### TEST_BTC Token
1. **Token Metadata**:
   - Object ID: `0x5e4b3ebdf804b72f90c9f710c5652f5b3c14f4c70a7e86e7b47480418f516519`
   - Owner: Immutable
   - Decimals: 6
   - Symbol: testBTC

2. **Minting Permission**:
   - Object ID: `0xbcf71b38b9be2a0421b5712c99856382a11040ccb9899366aa8bd3141ae83d9c`
   - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

### TEST_SUI Token
1. **Token Metadata**:
   - Object ID: `0xcfe76cd54f9f7a4a3ba40dd517e31ec41ff119f6d66dee755bfc81913c26c5f3`
   - Owner: Immutable
   - Decimals: 6
   - Symbol: testSUI

2. **Minting Permission**:
   - Object ID: `0x9a6ea06c831dacd80acda3ccfe424cb2470fd990366a7aef8f21fd26302f71ee`
   - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

### Upgrade Permission
- **UpgradeCap**:
  - Object ID: `0x8eaa02c6f2c0cbb27fda7cc6b9911dfa685d3508049273f54237655d852e7fc5`
  - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`


## Insurance Contract
**Deployment Time**: 2023-05-18
**Network**: Sui Testnet
**Deployment Transaction**: `9Tgh2NFr1CyZcfAxqXNQqVE6pFxmiHoL7eaJcjeu6zYG`
**Test Results**: Successfully tested insurance policy creation, premium calculation based on risk factors, and claim processing.

**Contract Address**:
- **Package ID**: `0xbf0bbd81d95efabc7b97b62be4cdaad12a1e8f21f6df4d69a83f16594cddf281`
- **Package Version**: 1
- **Module List**: insurance_pkg

**Insurance Manager Object**:
- **PolicyManager**:
  - Object ID: `0xdadd1668f95ee3c34c2725cb7fe2499929e57a7690e6c770a9990f4c86c71b15`
  - Owner: Shared
  - Current Base Rate: 3%
  - Current Volatility Coefficient: 1.5
  - Admin: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

**Capability Objects**:
- **UpgradeCap**:
  - Object ID: `0x2b5ee4fbbc76c073d1f198d01011f2a4186ffbd43ff98ae482331b814e5bfeb0`
  - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

## Pool Contract
**Deployment Time**: 2025-04-23
**Network**: Sui Testnet
**Deployment Transaction**: `4kFX6uMiu9MWPqfwYZVoSAX57zpsCN514GKuZqGHmJKk`

### Contract Address
- **Package ID**: `0x0ab5c0d9fcb1d0f69606d944a1d3a891e5038fa7391a9eb4e5c598522020bae4`
- **Package Version**: 1
- **Module List**:

### Liquidity Pool Factory Object
1. **PoolFactory**:
   - Object ID: `0x514e028616208584dee64fccbef6e0253e4aa0cd0120b626bf23ffb6c0e2da1a`
   - Owner: Shared
   - Admin: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

### Upgrade Permission
- **UpgradeCap**:
  - Object ID: `0xe3851a6a2a0f90e1852ae3d6f63498144349957e873e6253431f17ec5591b12b`
  - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`


## Fund Contract
**Deployment Time**: 2023-05-18
**Network**: Sui Testnet
**Deployment Transaction**: `2SbdxzE3DWqwziyybBXf1cEzptThpR9Q9u6UtaKdmuMH`
**Updates**: Fixed withdraw_insurance and withdraw_bond functions, implemented direct token transfer to caller

### Contract Address
- **Package ID**: `0xe0a937e329191a1dc82a5dd325fe061d7a758eb40cd2313497bb1c56fc60d71b`
- **Package Version**: 1
- **Module List**: fund

### Finance Pool Object
1. **FinancePool**:
   - Object ID: `0xdde2a58bfeddbfa4f535ef3867b2c0d8e12b3308dfd617a0e4df38bc4f2f5e44`
   - Owner: Shared
   - Admin: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

### Permission Objects
1. **InsuranceCapability**:
   - Object ID: `0xf446b5c71d293269c5749b06319ce90d25aec8aa7922c118e1a15853e4fda2d5`
   - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

2. **BondCapability**:
   - Object ID: `0xa6c5e7a707b5ef26e373c518ca931ff55ce25a5c16250d3bde67103f87779e76`
   - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

### Upgrade Permission
- **UpgradeCap**:
  - Object ID: `0xe043269419940006d439e62c99c9c41c3130cc6e0a54d9cdbca8bfc968ca2046`
  - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

## Bond Contract
**Deployment Time**: 2023-05-18
**Network**: Sui Testnet
**Deployment Transaction**: `3EWTjZ2bVL2ZddW83oWUnrZthxCGF7VCpxE5AbnSs4m2`
**Test Results**: Successfully tested bond purchase functionality. The contract implements a one-year lock-up period for bonds with interest accrual.

**Contract Address**:
- **Package ID**: `0x7952d6ef5a0a29b993dac031270e353801c4d1e2937a49749b289ff23139260a`
- **Package Version**: 1
- **Module List**: bond_pkg

**Bond Manager Object**:
- **BondPool**:
  - Object ID: `0x60352d4d3a195f0cff29715c8ea5964203a7994f3a54fcaa8b825a85eb4167c1`
  - Owner: Shared
  - Current APY: 6%
  - Admin: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

**Capability Objects**:
- **UpgradeCap**:
  - Object ID: `0x71d3b7a32c29773d77c3f132ec019b7c73c65157ab31798ad95ee626bff042c1`
  - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`
