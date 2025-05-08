ADMIN_ADDRESS="0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc"
CLOCK = "0x6"


## Coin Contract
**Deployment Time**: 2025-04-26
**Network**: Sui Testnet
**Deployment Transaction**: `776WLVrHp9cpcVnhRgYGkLPGq1FoeL2ZXiefy5m8qFnL`

### Contract Address
- **Package ID**: `0xcbc842eb9ab052ca43a54d8576ba0b5225f761312a2ef0b828720e46b366b08c`
- **Package Version**: 1
- **Module List**: test_btc, test_sui

### TEST_BTC Token
1. **Token Metadata**:
   - Object ID: `0xdff5ba6bc703534e5a9f3e99ab35cb2005a9ea403003d21a4140bfd1c1a5eda4`
   - Owner: Immutable
   - Decimals: 6 (预设值)
   - Symbol: TEST_BTC

2. **Minting Permission**:
   - Object ID: `0xd347cf88fb1b658b1dc19f4006f4019de7e937906d96fb5907e331110e65f4aa`
   - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

### TEST_SUI Token
1. **Token Metadata**:
   - Object ID: `0x0a9b0d1cecfc11630a23271ab973a2b7f763c4c5767e48914b6832c4ff1951e4`
   - Owner: Immutable
   - Decimals: 6 (预设值)
   - Symbol: TEST_SUI

2. **Minting Permission**:
   - Object ID: `0x8f716d56de4206576f1543f64fecbe566eaf93d35624b986b0753488ed3e323b`
   - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

### Upgrade Permission
- **UpgradeCap**:
  - Object ID: `0x13444172fcf34637d81d781fc8b4041d21e637d37c53e88913261e4b92403de9`
  - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`


## Insurance Contract
**Deployment Time**: 2025-05-07
**Network**: Sui Testnet
**Deployment Transaction**: `AyKMSPikDEQS5TUo1VZSreneAH9BgtfqkSqETitkDF8b`
**Test Results**: Successfully tested insurance policy creation, premium calculation based on risk factors, and claim processing.

**Contract Address**:
- **Package ID**: `0x05183e162f06e7544a050619766660fd78544d1449ad64db8b91eee3634a1a03`
- **Package Version**: 1
- **Module List**: insurance, insurance_nft

**Insurance Manager Object**:
- **PolicyManager**:
  - Object ID: `0xcea4b3dd911bc8541a71273029613f0c54bb1a4042f8d2972677c5eac3eb6d7c`
  - Owner: Shared
  - Current Base Rate: 3% (预设值)
  - Current Volatility Coefficient: 1.5 (预设值)
  - Admin: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

**Capability Objects**:
- **UpgradeCap**:
  - Object ID: `0x0cae252ff41b66f67c317375c3e902c3666a67e9b143a251c480ba6c8448754b`
  - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

## Pool Contract
**Deployment Time**: 2025-04-26
**Network**: Sui Testnet
**Deployment Transaction**: `4G1FXwxccNDZQMEdzBShAc7k5wUUBP7owsoRrD8m9gEr`

### Contract Address
- **Package ID**: `0x3fcb8ffa7daf76e8ebcff614db0a2dc73d5bfc4059da4c2cab3e85dfe4e3c7f3`
- **Package Version**: 1
- **Module List**: move_swap

### Liquidity Pool Factory Object
1. **PoolFactory**:
   - Object ID: 未在日志中显示
   - Owner: Shared (预设值)
   - Admin: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

### Upgrade Permission
- **UpgradeCap**:
  - Object ID: `0x6bfc3e9ab9414731e6efacea2543513ef0e1400795152df9489ac1820c24b1fb`
  - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`


## Fund Contract
**Deployment Time**: 2025-05-07
**Network**: Sui Testnet
**Deployment Transaction**: `9znpJjtyG6F7AapvJGjL32mrZ9czhkqSSK2Q5s93C3mg`
**Updates**: Fixed withdraw_insurance and withdraw_bond functions, implemented direct token transfer to caller

### Contract Address
- **Package ID**: `0xb06eebfd464eb39734a984d9f2df2a32fe852a63aec77a0ca7518a6eaa6d2f65`
- **Package Version**: 1
- **Module List**: fund

### Finance Pool Object
1. **FinancePool**:
   - Object ID: `0x0ade79ff8ca2fbff17da7711e89ee526c5344815c480826686da9d896f1d52eb`
   - Owner: Shared
   - Admin: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

### Permission Objects
1. **InsuranceCapability**:
   - Object ID: `0x49939fb29bd049f5262f6c95e3042c8db7d396a5185a60cbfc9984a228acde97`
   - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

2. **BondCapability**:
   - Object ID: `0x2803bc4e7f9da724a8b92421da2219be3cbf39380675fcf082e332103bb72c9c`
   - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

### Upgrade Permission
- **UpgradeCap**:
  - Object ID: `0xe5e140f63403ce400133c88cead473f14169b949c9b8650cd0dbd7001d1da897`
  - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

## Bond Contract
**Deployment Time**: 2025-05-07
**Network**: Sui Testnet
**Deployment Transaction**: `AzxBdikFm8n9yQQqSiGrsvdS2zmRxKg396GKWT1xwYW1`
**Test Results**: Successfully tested bond purchase functionality. The contract implements a one-year lock-up period for bonds with interest accrual.

**Contract Address**:
- **Package ID**: `0x51726d9454c6e8a65424e92ebb5f6137bab935c5a9ce941eb2a380035685e537`
- **Package Version**: 1
- **Module List**: bond_pkg

**Bond Manager Object**:
- **BondPool**:
  - Object ID: `0xfbff0f4f2502546fbd446577e318c452378ca51f6d854c07745dd7b06ae18c04`
  - Owner: Shared
  - Current APY: 6% (预设值)
  - Admin: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`

**Capability Objects**:
- **UpgradeCap**:
  - Object ID: `0x5e984dec3c745692f25edf278f6efa71c85d27cc2be998408fe5e39a9097c21f`
  - Owner: `0x7d87c83c2f71bb9388262c06f0eec7b57ee651bf1892a7a6fd6f1b1b931ac7fc`
