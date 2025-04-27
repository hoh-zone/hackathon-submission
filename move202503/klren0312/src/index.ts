import walrusDeployer from './deployer'
import type { HexoExtender } from './type'

declare global {
  const hexo: {
    readonly extend: HexoExtender
  }
}

hexo.extend.deployer.register('walrus', walrusDeployer)
