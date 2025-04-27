export interface HexoContext {
  readonly log: { info: (...args: Array<unknown>) => void }
  readonly public_dir: string
}

export interface HexoDeployment {
  readonly network: 'mainnet' | 'testnet'
  readonly epochs: number
  readonly site_builder_path: string
  readonly sites_config_path: string
}

interface HexoDeployer {
  (this: HexoContext, deploy: HexoDeployment): Promise<void>
}

interface HexoDeployerExtender {
  readonly register: (name: string, deployer: HexoDeployer) => Promise<void>
}

export interface HexoExtender {
  readonly deployer: HexoDeployerExtender
}
