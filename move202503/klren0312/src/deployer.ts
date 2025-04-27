import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { modifyValueInYaml } from './yaml-tool'
import type { HexoContext, HexoDeployment } from './type'

// eslint-disable-next-line import/no-default-export
export default function deployer(
  this: HexoContext,
  deploy: HexoDeployment,
): Promise<void> {
  return new Promise(() => {
    if (!['testnet', 'mainnet'].includes(deploy.network)) {
      throw new Error('network must be testnet or mainnet')
    }
    if (deploy.epochs > 53) {
      throw new Error(
        'epochs must be less than 53. which is 53, corresponding to two years',
      )
    }
    const { public_dir: publicDir, log } = this
    // modify sites-config.yaml change env
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const defaultConfigPath = path.join(__dirname, 'sites-config.yaml')

    modifyValueInYaml(
      deploy.sites_config_path || defaultConfigPath,
      'default_context',
      deploy.network,
    )

    const cmd = spawn(deploy.site_builder_path || 'site-builder', [
      '--config',
      deploy.sites_config_path || defaultConfigPath,
      'publish',
      '--epochs',
      String(deploy.epochs),
      publicDir,
    ])
    cmd.stdout.on('data', (data) => {
      log.info(String(data))
    })
    cmd.stderr.on('data', (data) => {
      throw new Error(data)
    })
    cmd.on('close', () => {
      log.info(`Upload completed, thank you for using walrus`)
    })
  })
}
