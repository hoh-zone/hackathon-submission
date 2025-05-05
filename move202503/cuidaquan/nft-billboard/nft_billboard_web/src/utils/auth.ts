import { SuiClient } from '@mysten/sui/client';
import { UserRole } from '../types';
import { CONTRACT_CONFIG } from '../config/config';
import { getGameDevsFromFactory } from './contract';
import { compareAddresses } from './contract';

/**
 * 检查用户是否拥有平台管理员权限
 * @param client SuiClient实例
 * @param address 用户钱包地址（用于发送交易）
 * @returns 是否拥有管理员权限
 */
export async function checkIsAdmin(client: SuiClient, address: string): Promise<boolean> {
  try {
    // 验证合约配置
    if (!CONTRACT_CONFIG.PACKAGE_ID || !CONTRACT_CONFIG.MODULE_NAME || !CONTRACT_CONFIG.FACTORY_OBJECT_ID) {
      console.error('合约配置无效:', {
        packageId: CONTRACT_CONFIG.PACKAGE_ID,
        moduleName: CONTRACT_CONFIG.MODULE_NAME,
        factoryId: CONTRACT_CONFIG.FACTORY_OBJECT_ID
      });
      throw new Error('合约配置无效');
    }

    // 验证地址格式
    if (!address?.startsWith('0x')) {
      console.error('钱包地址格式无效:', address);
      throw new Error('钱包地址格式无效');
    }

    console.log('准备检查管理员权限:', {
      factoryId: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
      address
    });

    // 获取工厂对象的数据
    const factoryObject = await client.getObject({
      id: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
      options: {
        showContent: true
      }
    });

    // 检查对象是否存在
    if (!factoryObject.data) {
      console.error('工厂对象不存在或无法访问');
      return false;
    }

    // 获取对象内容以检查管理员
    const content = factoryObject.data.content;
    if (!content || content.dataType !== 'moveObject') {
      console.error('工厂对象不是Move对象或内容为空');
      return false;
    }

    // 访问对象中的字段
    const fields = (content as { fields: Record<string, any> }).fields;
    
    // 检查管理员字段
    const admin = fields.admin;
    if (!admin) {
      console.warn('对象中找不到管理员字段');
      return false;
    }

    // 规范化地址格式进行比较
    const isAdmin = admin.toLowerCase() === address.toLowerCase();
    
    console.log('管理员权限检查结果:', {
      isAdmin,
      adminAddress: admin
    });
    
    return isAdmin;
  } catch (error) {
    console.error('检查管理员权限失败:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      address
    });
    return false;
  }
}

/**
 * 检查用户是否拥有游戏开发者权限
 * @param client SuiClient实例
 * @param address 用户钱包地址（用于发送交易）
 * @returns 是否拥有游戏开发者权限
 */
export async function checkIsGameDev(address: string | undefined): Promise<boolean> {
  try {
    if (!address) {
      console.warn('检查游戏开发者权限失败: 地址为空');
      return false;
    }

    console.log('准备检查是否为游戏开发者，用户地址:', address);
    // 规范化地址为小写形式
    const normalizedAddress = address.toLowerCase();
    
    // 从工厂对象获取游戏开发者列表
    const gameDevs = await getGameDevsFromFactory(CONTRACT_CONFIG.FACTORY_OBJECT_ID);
    console.log(`获取到 ${gameDevs.length} 个游戏开发者地址:`, gameDevs);
    
    // 详细比较每个开发者地址
    console.log(`==== 开始详细比较地址 ====`);
    let isGameDev = false;
    for (const devAddress of gameDevs) {
      console.log(`比较用户地址与开发者地址:`);
      console.log(`- 用户: ${normalizedAddress}`);
      console.log(`- 开发者: ${devAddress}`);
      
      const matched = compareAddresses(normalizedAddress, devAddress);
      console.log(`- 匹配结果: ${matched ? '✓ 匹配' : '✗ 不匹配'}`);
      
      if (matched) {
        isGameDev = true;
        break;
      }
    }
    console.log(`==== 地址比较结束 ====`);
    
    console.log(`用户 ${normalizedAddress} ${isGameDev ? '是' : '不是'} 游戏开发者`);
    return isGameDev;
  } catch (error) {
    console.error('检查游戏开发者权限时出错:', error);
    return false;
  }
}

/**
 * 检查用户角色
 * @param address 用户钱包地址
 * @param client 可选的 SuiClient 实例
 * @returns 用户角色
 */
export async function checkUserRole(address: string, client?: SuiClient): Promise<UserRole> {
  console.log('=== 开始检查用户角色 ===');
  console.log('钱包地址:', address);
  console.log('合约配置:', {
    PACKAGE_ID: CONTRACT_CONFIG.PACKAGE_ID,
    MODULE_NAME: CONTRACT_CONFIG.MODULE_NAME,
    FACTORY_OBJECT_ID: CONTRACT_CONFIG.FACTORY_OBJECT_ID
  });

  try {
    // 如果没有提供 client，创建一个默认的
    const suiClient = client || new SuiClient({ url: 'https://fullnode.mainnet.sui.io' });
    
    // 首先检查是否是管理员
    console.log('正在检查管理员权限...');
    const isAdmin = await checkIsAdmin(suiClient, address);
    console.log('管理员检查结果:', isAdmin);
    
    if (isAdmin) {
      console.log('用户是管理员');
      return UserRole.ADMIN;
    }
    
    // 然后检查是否是游戏开发者
    console.log('正在检查游戏开发者权限...');
    const isGameDev = await checkIsGameDev(address);
    console.log('游戏开发者检查结果:', isGameDev);
    
    if (isGameDev) {
      console.log('用户是游戏开发者');
      return UserRole.GAME_DEV;
    }
    
    // 默认为普通用户
    console.log('用户是普通用户');
    return UserRole.USER;
  } catch (error) {
    console.error('检查用户角色时发生错误:', error);
    console.log('默认返回普通用户角色');
    return UserRole.USER;
  } finally {
    console.log('=== 用户角色检查完成 ===');
  }
}