# buzzing core-move

## publish buzzing token

```shell
pnpm run cli publish -p buzzing
```

## create market

```shell
pnpm run cli buzzing create-market -q "Will you give me 100 dollars ?"
```

## create tokens and pool

```shell
pnpm run cli buzzing create-token
```

## faucet platform token

```shell
pnpm run cli buzzing faucet
```

## buy yes

pnpm run cli buzzing swap-token -m 0x65bf45955c1f5669ed9d38cca98ce236422e2ce485af25fa8cfb0ff39ae3f593 --yes --buy

## buy no

pnpm run cli buzzing swap-token -m 0x65bf45955c1f5669ed9d38cca98ce236422e2ce485af25fa8cfb0ff39ae3f593 --no --buy

## sell yes

pnpm run cli buzzing swap-token -m 0x65bf45955c1f5669ed9d38cca98ce236422e2ce485af25fa8cfb0ff39ae3f593 --yes --sell

## sell no

pnpm run cli buzzing swap-token -m 0x65bf45955c1f5669ed9d38cca98ce236422e2ce485af25fa8cfb0ff39ae3f593 --no --sell

## report market

need to have oracle cap

pnpm run cli buzzing report-market -m 0x65bf45955c1f5669ed9d38cca98ce236422e2ce485af25fa8cfb0ff39ae3f593 -r yes

## redeem token

pnpm run cli buzzing redeem-token -m 0xfb3fb0ea86ddddaf0b7b53f36d84c545ab139b2e2713bd4a22c2b1405b9e8b92 -v 0x2734ce24eb65e2728835318f96e5e1e4ce95b94da78371f22b10a8e50a84bde7


## tips

- Sui 本地包依赖

文件: [move/buzzing/Move.toml](move/buzzing/Move.toml)

```toml
Sui = { local = "../../../sui/crates/sui-framework/packages/sui-framework/" }
```

- token 模版依赖

文件: [src/tools/moveCodeBuilder.ts](src/tools/moveCodeBuilder.ts)

```ts
[dependencies]
Sui = { local = "../../../sui/crates/sui-framework/packages/sui-framework/" }
buzzing = { local = "../buzzing" }
```
