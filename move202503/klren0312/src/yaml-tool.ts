// 导入文件系统模块
import fs from 'node:fs'
import yaml from 'js-yaml'
// 从 YAML 文件中读取数据
function readYamlFile(filePath: any) {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const data = yaml.load(fileContents)
    return data
  } catch (error: any) {
    console.error(`Error reading YAML file: ${error.message}`)
    return null
  }
}
// 将数据写入 YAML 文件
function writeYamlFile(filePath: any, data: any) {
  try {
    const yamlData = yaml.dump(data)
    fs.writeFileSync(filePath, yamlData, 'utf8')
  } catch (error: any) {
    console.error(`Error writing YAML file: ${error.message}`)
  }
}
// 修改 YAML 文件中的某个值
export function modifyValueInYaml(
  filePath: string,
  keyPath: string,
  newValue: string,
): void {
  const data = readYamlFile(filePath) as Record<string, any>
  if (!data) return
  // 根据 keyPath 修改值
  const keys = keyPath.split('.')
  let current: Record<string, any> = data
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  const lastKey = keys.at(-1)
  if (lastKey) {
    current[lastKey] = newValue
  }
  writeYamlFile(filePath, data)
}
