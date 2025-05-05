import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, PaginatedObjectsResponse } from '@mysten/sui/client';
import { CONTRACT_CONFIG, NETWORKS, DEFAULT_NETWORK, USE_MOCK_DATA } from '../config/config';
import { BillboardNFT, AdSpace, PurchaseAdSpaceParams, UpdateNFTContentParams, RenewNFTParams, CreateAdSpaceParams, RemoveGameDevParams } from '../types';

// 模拟的游戏开发者列表（仅用于测试）
export const MOCK_GAME_DEVS: string[] = [
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
];

// 创建 SUI 客户端
export const createSuiClient = (network = DEFAULT_NETWORK) => {
  return new SuiClient({ url: NETWORKS[network].fullNodeUrl });
};

// 获取所有可用的广告位
export async function getAvailableAdSpaces(): Promise<AdSpace[]> {
  // 如果使用模拟数据，返回模拟的广告位
  if (USE_MOCK_DATA) {
    console.log('使用模拟广告位数据');
    // 模拟数据
    const mockAdSpaces: AdSpace[] = [
      {
        id: '0x123',
        name: '首页顶部广告位',
        description: '网站首页顶部横幅广告位，高曝光量',
        imageUrl: 'https://example.com/ad-space-1.jpg',
        price: '100000000', // 0.1 SUI
        duration: 30, // 30天
        dimension: {
          width: 1200,
          height: 300,
        },
        owner: null,
        available: true,
        location: '首页顶部',
      },
      {
        id: '0x456',
        name: '侧边栏广告位',
        description: '网站所有页面侧边栏广告位',
        imageUrl: 'https://example.com/ad-space-2.jpg',
        price: '50000000', // 0.05 SUI
        duration: 30, // 30天
        dimension: {
          width: 300,
          height: 600,
        },
        owner: null,
        available: true,
        location: '所有页面侧边栏',
      },
    ];

    return mockAdSpaces;
  }

  // 实际从链上获取数据
  try {
    console.log('从链上获取可用广告位数据');

    // 直接从区块链获取广告位数据
    const client = createSuiClient();

    // 获取工厂对象，包含ad_spaces列表
    const factoryObject = await client.getObject({
      id: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
      options: {
        showContent: true,
        showDisplay: true,
        showType: true,
      }
    });

    console.log('获取到工厂对象:', factoryObject);

    // 从工厂对象中直接解析广告位列表
    if (factoryObject.data?.content?.dataType === 'moveObject') {
      const fields = factoryObject.data.content.fields as any;
      console.log('工厂对象字段:', fields);

      // 检查广告位列表字段
      if (fields && fields.ad_spaces) {
        console.log('广告位列表数据结构:', JSON.stringify(fields.ad_spaces, null, 2));

        // 获取广告位条目
        let adSpaceEntries = [];
        if (Array.isArray(fields.ad_spaces)) {
          adSpaceEntries = fields.ad_spaces;
          console.log('获取到广告位条目数组:', adSpaceEntries.length);

          // 如果广告位数组为空，提前返回空状态
          if (adSpaceEntries.length === 0) {
            console.log('广告位列表为空数组，返回空状态提示');
            return [{
              id: '0x0',
              name: '您还没有创建广告位',
              description: '您尚未创建任何广告位，点击"创建广告位"按钮开始创建您的第一个广告位。',
              imageUrl: 'https://via.placeholder.com/300x250?text=创建您的第一个广告位',
              price: '0',
              duration: 365,
              dimension: { width: 0, height: 0 },
              owner: null,
              available: false,
              location: '',
              isExample: true, // 标记为示例数据
              price_description: ''
            }];
          }
        } else {
          console.log('广告位数据不是数组，尝试从调试输出中提取');
          adSpaceEntries = [fields.ad_spaces];
        }

        // 获取所有广告位ID
        const allAdSpacePromises = [];

        // 遍历所有广告位条目
        for (const entry of adSpaceEntries) {
          try {
            // 获取广告位ID
            let adSpaceId: string | null = null;

            console.log('处理广告位条目:', JSON.stringify(entry, null, 2));

            // 处理不同的数据结构情况
            if (entry.ad_space_id) {
              // 直接包含ad_space_id的情况
              if (typeof entry.ad_space_id === 'string') {
                adSpaceId = entry.ad_space_id;
              } else if (entry.ad_space_id.id) {
                adSpaceId = entry.ad_space_id.id;
              }
            } else if (entry.fields) {
              // 包含在fields字段中的情况
              if (entry.fields.ad_space_id) {
                if (typeof entry.fields.ad_space_id === 'string') {
                  adSpaceId = entry.fields.ad_space_id;
                } else if (entry.fields.ad_space_id.id) {
                  adSpaceId = entry.fields.ad_space_id.id;
                }
              }
            }

            console.log('提取的广告位ID:', adSpaceId);

            if (adSpaceId) {
              // 异步获取广告位详情
              allAdSpacePromises.push(getAdSpaceById(adSpaceId).then(adSpace => {
                if (adSpace) {
                  console.log('成功获取广告位详情:', adSpace.id, '可用状态:', adSpace.available);
                  return adSpace;
                }
                return null;
              }));
            }
          } catch (err) {
            console.error('处理广告位条目出错:', err);
          }
        }

        // 等待所有广告位查询完成
        console.log('等待广告位查询完成...');
        const adSpacesResults = await Promise.all(allAdSpacePromises);
        const allAdSpaces = adSpacesResults.filter(Boolean) as AdSpace[];

        console.log('获取到所有广告位数量:', allAdSpaces.length);

        // 过滤出可用的广告位
        const availableAdSpaces = allAdSpaces.filter(adSpace => adSpace.available);

        console.log('可用广告位数量:', availableAdSpaces.length);

        if (availableAdSpaces.length === 0) {
          console.log('没有可用的广告位');
          // 如果没有可用的广告位，返回友好提示
          return [{
            id: '0x0',
            name: '暂无可用广告位',
            description: '目前没有可用的广告位，请稍后再来查看，或联系游戏开发者创建新的广告位。',
            imageUrl: 'https://via.placeholder.com/300x250?text=暂无可用广告位',
            price: '0',
            duration: 365, // 改为365天
            dimension: { width: 300, height: 250 },
            owner: null,
            available: false,
            location: '无',
            isExample: true, // 标记这是示例数据
            price_description: '价格为每日租赁价格'
          }];
        }

        // 获取每个广告位的创建者信息
        for (const adSpace of availableAdSpaces) {
          try {
            // 从工厂对象中查找对应的广告位条目，获取创建者信息
            const matchingEntry = adSpaceEntries.find((entry: any) => {
              // 从条目中提取广告位ID
              let entryAdSpaceId = null;
              if (entry.ad_space_id) {
                if (typeof entry.ad_space_id === 'string') {
                  entryAdSpaceId = entry.ad_space_id;
                } else if (entry.ad_space_id.id) {
                  entryAdSpaceId = entry.ad_space_id.id;
                }
              } else if (entry.fields && entry.fields.ad_space_id) {
                if (typeof entry.fields.ad_space_id === 'string') {
                  entryAdSpaceId = entry.fields.ad_space_id;
                } else if (entry.fields.ad_space_id.id) {
                  entryAdSpaceId = entry.fields.ad_space_id.id;
                }
              }

              // 比较ID
              return entryAdSpaceId === adSpace.id;
            });

            // 如果找到匹配的条目且有创建者信息，则添加到广告位对象
            if (matchingEntry && matchingEntry.creator) {
              (adSpace as any).creator = matchingEntry.creator;
              console.log(`为广告位 ${adSpace.id} 添加创建者信息:`, matchingEntry.creator);
            } else if (matchingEntry && matchingEntry.fields && matchingEntry.fields.creator) {
              (adSpace as any).creator = matchingEntry.fields.creator;
              console.log(`为广告位 ${adSpace.id} 添加创建者信息:`, matchingEntry.fields.creator);
            }
          } catch (err) {
            console.error(`为广告位 ${adSpace.id} 添加创建者信息时出错:`, err);
          }
        }

        // 规范化广告位数据
        return availableAdSpaces.map(adSpace => ({
          ...adSpace,
          name: adSpace.name || `广告位 ${adSpace.id.substring(0, 8)}`,
          description: adSpace.description || `位于 ${adSpace.location || '未知位置'} 的广告位`,
          imageUrl: adSpace.imageUrl || `https://via.placeholder.com/${adSpace.dimension.width}x${adSpace.dimension.height}?text=${encodeURIComponent(adSpace.name || 'AdSpace')}`,
          duration: 365, // 确保都是365天
          price_description: '价格为每日租赁价格'
        }));
      }
    }

    // 如果无法从链上获取数据，返回友好提示
    console.log('从链上未能获取到广告位数据');
    return [{
      id: '0x0',
      name: '数据加载失败',
      description: '无法从区块链获取广告位数据，请刷新页面重试。',
      imageUrl: 'https://via.placeholder.com/300x250?text=数据加载失败',
      price: '0',
      duration: 30,
      dimension: { width: 300, height: 250 },
      owner: null,
      available: false,
      location: '无',
      isExample: true // 标记这是示例数据
    }];
  } catch (error) {
    console.error('获取可用广告位失败:', error);
    // 出错时返回友好提示
    return [{
      id: '0x0',
      name: '数据加载失败',
      description: '加载广告位数据时发生错误，请刷新页面重试。',
      imageUrl: 'https://via.placeholder.com/300x250?text=加载失败',
      price: '0',
      duration: 30,
      dimension: { width: 300, height: 250 },
      owner: null,
      available: false,
      location: '无',
      isExample: true // 标记这是示例数据
    }];
  }
}

export async function getUserNFTs(owner: string): Promise<BillboardNFT[]> {
  // 如果使用模拟数据，返回模拟的NFT
  if (USE_MOCK_DATA) {
    console.log('使用模拟NFT数据');
    // 模拟数据
    const mockNFTs: BillboardNFT[] = [
      {
        id: '0x789',
        adSpaceId: '0x123',
        owner: owner,
        brandName: '示例品牌',
        contentUrl: 'https://example.com/ad-content-1.jpg',
        projectUrl: 'https://example.com',
        leaseStart: new Date(Date.now() - 86400000 * 10).toISOString(), // 10天前
        leaseEnd: new Date(Date.now() + 86400000 * 20).toISOString(), // 20天后
        isActive: true
      }
    ];

    return mockNFTs;
  }

  // 实际从链上获取数据
  try {
    console.log('从链上获取用户NFT数据，所有者地址:', owner);

    if (!owner || !owner.startsWith('0x')) {
      console.error('所有者地址无效:', owner);
      return [];
    }

    // 生成一个唯一的请求ID，用于日志跟踪
    const requestId = new Date().getTime().toString();
    console.log(`[${requestId}] 开始获取用户NFT数据`);

    const client = createSuiClient();

    // 从Factory对象中查询相关NFT信息
    const factoryObject = await client.getObject({
      id: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
      options: {
        showContent: true,
        showDisplay: true,
        showType: true,
      }
    });

    console.log(`[${requestId}] 获取到Factory对象:`, factoryObject.data?.objectId);

    // 构建NFT类型字符串，用于过滤
    const nftTypeStr = `${CONTRACT_CONFIG.PACKAGE_ID}::nft::AdBoardNFT`;
    console.log(`[${requestId}] 使用类型过滤:`, nftTypeStr);

    // 使用分页方式获取所有NFT对象
    let hasNextPage = true;
    let cursor: string | null = null;
    const pageSize = 50; // 每页获取的数量（Sui SDK的最大限制是50）
    const allNftObjects: any[] = [];

    // 循环获取所有页面的数据
    while (hasNextPage) {
      console.log(`[${requestId}] 获取页面数据，cursor:`, cursor);

      // 使用类型过滤直接查询用户拥有的NFT对象
      const ownedObjects: PaginatedObjectsResponse = await client.getOwnedObjects({
        owner,
        filter: {
          StructType: nftTypeStr
        },
        options: {
          showContent: true,
          showDisplay: true,
          showType: true,
        },
        cursor,
        limit: pageSize
      });

      console.log(`[${requestId}] 当前页获取到对象数量:`, ownedObjects.data?.length || 0);

      // 添加当前页的对象到结果集
      if (ownedObjects.data && ownedObjects.data.length > 0) {
        allNftObjects.push(...ownedObjects.data);
      }

      // 检查是否有下一页
      if (ownedObjects.hasNextPage && ownedObjects.nextCursor) {
        cursor = ownedObjects.nextCursor;
        console.log(`[${requestId}] 存在下一页，nextCursor:`, cursor);
      } else {
        hasNextPage = false;
        console.log(`[${requestId}] 已获取所有页面数据`);
      }
    }

    console.log(`[${requestId}] 获取到用户拥有的NFT对象总数:`, allNftObjects.length);

    // 如果没有找到任何对象，直接返回空数组
    if (allNftObjects.length === 0) {
      console.log(`[${requestId}] 用户没有拥有任何NFT对象`);
      return [];
    }

    // 转换为前端使用的NFT数据结构
    const nfts: BillboardNFT[] = [];

    for (const nftObj of allNftObjects) {
      try {
        if (!nftObj.data?.content || nftObj.data.content.dataType !== 'moveObject') {
          console.warn(`[${requestId}] NFT对象不是moveObject类型:`, nftObj.data?.objectId);
          continue;
        }

        // 类型断言为含有fields的对象
        const moveObject = nftObj.data.content as { dataType: 'moveObject', fields: Record<string, any> };
        if (!moveObject.fields) {
          console.warn(`[${requestId}] NFT对象没有fields字段:`, nftObj.data?.objectId);
          continue;
        }

        const fields = moveObject.fields;
        console.log(`[${requestId}] NFT对象字段:`, nftObj.data.objectId, Object.keys(fields));

        // 记录完整字段内容以便调试
        console.log(`[${requestId}] NFT字段详细内容:`, JSON.stringify(fields, null, 2));

        // 提取广告位ID - 适配不同字段名称
        let adSpaceId = '';
        if (fields.ad_space_id) {
          adSpaceId = typeof fields.ad_space_id === 'string' ? fields.ad_space_id :
                    (fields.ad_space_id.id ? fields.ad_space_id.id : '');
        } else if (fields.ad_space) {
          // 适配可能的替代字段名称
          adSpaceId = typeof fields.ad_space === 'string' ? fields.ad_space :
                    (fields.ad_space.id ? fields.ad_space.id :
                     (typeof fields.ad_space === 'object' ? JSON.stringify(fields.ad_space) : ''));
        }

        console.log(`[${requestId}] 提取的广告位ID:`, adSpaceId);

        // 提取到期时间 - 适配不同字段名称
        let expiryTimestamp = 0;
        if (fields.expiry_timestamp) {
          expiryTimestamp = parseInt(fields.expiry_timestamp);
        } else if (fields.expiry) {
          expiryTimestamp = parseInt(fields.expiry);
        } else if (fields.expire_timestamp) {
          expiryTimestamp = parseInt(fields.expire_timestamp);
        } else if (fields.lease_end) {
          // 合约中使用的lease_end字段
          expiryTimestamp = parseInt(fields.lease_end);
        }

        console.log(`[${requestId}] 提取的到期时间:`, expiryTimestamp);

        // 提取创建时间 - 适配不同字段名称
        let createdTimestamp = 0;
        if (fields.created_timestamp) {
          createdTimestamp = parseInt(fields.created_timestamp);
        } else if (fields.created) {
          createdTimestamp = parseInt(fields.created);
        } else if (fields.create_timestamp) {
          createdTimestamp = parseInt(fields.create_timestamp);
        } else if (fields.lease_start) {
          // 合约中使用的lease_start字段
          createdTimestamp = parseInt(fields.lease_start);
        }

        console.log(`[${requestId}] 提取的创建时间:`, createdTimestamp);

        // 提取其他字段 - 适配不同字段名称
        const brandName = fields.brand_name || fields.brand || '';
        const contentUrl = fields.content_url || fields.content || fields.url || '';
        const projectUrl = fields.project_url || fields.project || fields.website || '';

        console.log(`[${requestId}] 提取的品牌名称:`, brandName);
        console.log(`[${requestId}] 提取的内容URL:`, contentUrl);
        console.log(`[${requestId}] 提取的项目URL:`, projectUrl);

        // 如果无法获取创建时间，使用当前时间减去30天作为默认值
        if (createdTimestamp === 0) {
          createdTimestamp = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
          console.log(`[${requestId}] 使用默认创建时间:`, createdTimestamp);
        }

        // 如果无法获取到期时间，使用当前时间加上30天作为默认值
        if (expiryTimestamp === 0) {
          expiryTimestamp = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);
          console.log(`[${requestId}] 使用默认到期时间:`, expiryTimestamp);
        }

        // 计算租赁开始和结束日期
        const now = Date.now();
        const leaseStart = new Date(createdTimestamp * 1000).toISOString();
        const leaseEnd = new Date(expiryTimestamp * 1000).toISOString();

        // 判断NFT是否有效
        const isActive = expiryTimestamp * 1000 > now;

        // 构建NFT对象
        const nft: BillboardNFT = {
          id: nftObj.data.objectId,
          adSpaceId: adSpaceId,
          owner: owner,
          brandName: brandName,
          contentUrl: contentUrl,
          projectUrl: projectUrl,
          leaseStart: leaseStart,
          leaseEnd: leaseEnd,
          isActive: isActive
        };

        console.log(`[${requestId}] 成功解析NFT:`, nftObj.data.objectId, 'adSpaceId:', adSpaceId);
        nfts.push(nft);
      } catch (err) {
        console.error(`[${requestId}] 解析NFT时出错:`, nftObj.data?.objectId, err);
      }
    }

    console.log(`[${requestId}] 成功获取用户NFT数量:`, nfts.length);
    return nfts;
  } catch (error) {
    console.error('获取用户NFT失败:', error);
    return [];
  }
}

// 获取单个广告位详情
export async function getAdSpaceDetails(adSpaceId: string): Promise<AdSpace | null> {
  // 如果使用模拟数据，返回模拟的广告位详情
  if (USE_MOCK_DATA) {
    console.log('使用模拟广告位详情数据');
    // 模拟获取数据的延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 根据ID返回不同的模拟数据
    if (adSpaceId === '0x123') {
      return {
        id: '0x123',
        name: '首页顶部广告位',
        description: '网站首页顶部横幅广告位，高曝光量',
        imageUrl: 'https://example.com/ad-space-1.jpg',
        price: '100000000', // 0.1 SUI
        duration: 30, // 30天
        dimension: {
          width: 1200,
          height: 300,
        },
        owner: null,
        available: true,
        location: '首页顶部',
      };
    } else if (adSpaceId === '0x456') {
      return {
        id: '0x456',
        name: '侧边栏广告位',
        description: '网站所有页面侧边栏广告位',
        imageUrl: 'https://example.com/ad-space-2.jpg',
        price: '50000000', // 0.05 SUI
        duration: 30, // 30天
        dimension: {
          width: 300,
          height: 600,
        },
        owner: null,
        available: true,
        location: '所有页面侧边栏',
      };
    }

    return null;
  }

  // 实际从链上获取数据
  try {
    console.log('从链上获取广告位详情数据, ID:', adSpaceId);

    // 获取广告位基本信息
    const adSpace = await getAdSpaceById(adSpaceId);
    if (!adSpace) {
      console.error('未找到广告位:', adSpaceId);
      return null;
    }

    // 获取工厂对象，以获取广告位的创建者信息
    try {
      const client = createSuiClient();

      // 获取工厂对象
      const factoryObject = await client.getObject({
        id: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
        options: {
          showContent: true,
          showDisplay: true,
          showType: true,
        }
      });

      // 从工厂对象中寻找对应广告位的创建者信息
      if (factoryObject.data?.content?.dataType === 'moveObject') {
        const fields = factoryObject.data.content.fields as any;

        // 解析广告位条目
        if (fields && fields.ad_spaces) {
          let adSpaceEntries = [];
          if (Array.isArray(fields.ad_spaces)) {
            adSpaceEntries = fields.ad_spaces;
          } else {
            adSpaceEntries = [fields.ad_spaces];
          }

          // 寻找匹配的广告位条目
          const matchingEntry = adSpaceEntries.find((entry: any) => {
            // 提取广告位ID
            let entryAdSpaceId = null;
            if (entry.ad_space_id) {
              if (typeof entry.ad_space_id === 'string') {
                entryAdSpaceId = entry.ad_space_id;
              } else if (entry.ad_space_id.id) {
                entryAdSpaceId = entry.ad_space_id.id;
              }
            } else if (entry.fields && entry.fields.ad_space_id) {
              if (typeof entry.fields.ad_space_id === 'string') {
                entryAdSpaceId = entry.fields.ad_space_id;
              } else if (entry.fields.ad_space_id.id) {
                entryAdSpaceId = entry.fields.ad_space_id.id;
              }
            }

            return entryAdSpaceId === adSpaceId;
          });

          // 如果找到匹配的条目，添加创建者信息
          if (matchingEntry) {
            // 提取创建者信息
            if (matchingEntry.creator) {
              (adSpace as any).creator = matchingEntry.creator;
              console.log(`为广告位详情添加创建者信息:`, matchingEntry.creator);
            } else if (matchingEntry.fields && matchingEntry.fields.creator) {
              (adSpace as any).creator = matchingEntry.fields.creator;
              console.log(`为广告位详情添加创建者信息:`, matchingEntry.fields.creator);
            }
          }
        }
      }
    } catch (error) {
      console.error('获取广告位创建者信息失败:', error);
      // 即使获取创建者信息失败，也返回广告位基本信息
    }

    return adSpace;
  } catch (error) {
    console.error('获取广告位详情失败:', error);
    return null;
  }
}

// 获取单个NFT详情
export async function getNFTDetails(nftId: string): Promise<BillboardNFT | null> {
  // 如果使用模拟数据，返回模拟的NFT详情
  if (USE_MOCK_DATA) {
    console.log('使用模拟NFT详情数据');
    // 模拟获取数据的延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 根据ID返回不同的模拟数据
    if (nftId === '0x789') {
      return {
        id: nftId,
        adSpaceId: '0x123',
        owner: '0x456',
        brandName: '示例品牌',
        contentUrl: 'https://example.com/ad-content-1.jpg',
        projectUrl: 'https://example.com',
        leaseStart: new Date(Date.now() - 86400000 * 10).toISOString(), // 10天前
        leaseEnd: new Date(Date.now() + 86400000 * 20).toISOString(), // 20天后
        isActive: true
      };
    }

    return null;
  }

  // 实际从链上获取数据
  try {
    // 生成一个唯一的请求ID，用于日志跟踪
    const requestId = new Date().getTime().toString();
    console.log(`[${requestId}] 从链上获取NFT详情, ID: ${nftId}`);

    if (!nftId || !nftId.startsWith('0x')) {
      console.error(`[${requestId}] NFT ID格式无效:`, nftId);
      return null;
    }

    const client = createSuiClient();

    // 获取NFT对象
    const nftObject = await client.getObject({
      id: nftId,
      options: {
        showContent: true,
        showDisplay: true,
        showType: true,
        showOwner: true
      }
    });

    console.log(`[${requestId}] 获取到NFT对象:`, nftObject.data?.objectId);
    console.log(`[${requestId}] NFT对象类型:`, nftObject.data?.type);

    // 检查对象是否存在且是NFT类型
    if (!nftObject.data || !nftObject.data.content) {
      console.error(`[${requestId}] NFT对象不存在或内容为空:`, nftObject);
      return null;
    }

    // 检查对象类型是否为AdBoardNFT
    const typeStr = nftObject.data.type || '';
    console.log(`[${requestId}] 正在检查NFT类型: "${typeStr}"`);

    // 支持多种可能的类型名称
    const isNftType = typeStr.includes(`${CONTRACT_CONFIG.PACKAGE_ID}::nft::AdBoardNFT`) ||
                      typeStr.includes(`${CONTRACT_CONFIG.PACKAGE_ID}::nft_billboard::AdBoardNFT`) ||
                      typeStr.includes(`::nft::AdBoardNFT`);

    console.log(`[${requestId}] NFT类型检查结果:`, isNftType ? "✓" : "✗");

    if (!isNftType || nftObject.data.content.dataType !== 'moveObject') {
      console.error(`[${requestId}] 对象不是AdBoardNFT类型:`, {
        type: typeStr,
        contentType: nftObject.data.content.dataType
      });
      return null;
    }

    // 提取NFT字段
    const moveObject = nftObject.data.content as { dataType: 'moveObject', fields: Record<string, any> };
    const fields = moveObject.fields;

    console.log(`[${requestId}] NFT字段:`, Object.keys(fields || {}));
    console.log(`[${requestId}] NFT完整字段内容:`, JSON.stringify(fields, null, 2));

    // 提取广告位ID
    let adSpaceId = '';
    if (fields.ad_space_id) {
      adSpaceId = typeof fields.ad_space_id === 'string' ? fields.ad_space_id :
                  (fields.ad_space_id.id ? fields.ad_space_id.id : '');
    }

    // 提取所有者地址
    let owner = '';
    if (nftObject.data.owner && typeof nftObject.data.owner === 'object') {
      const ownerObj = nftObject.data.owner as any;
      owner = ownerObj.AddressOwner || ownerObj.ObjectOwner || '';
      console.log(`[${requestId}] NFT所有者:`, owner);
    }

    // 提取品牌名称
    const brandName = fields.brand_name || '';
    console.log(`[${requestId}] 品牌名称:`, brandName);

    // 提取内容URL
    const contentUrl = fields.content_url || '';
    console.log(`[${requestId}] 内容URL:`, contentUrl);

    // 提取存储来源和blobId
    const storageSource = fields.storage_source || '';
    const blobId = fields.blob_id || '';
    console.log(`[${requestId}] 存储来源:`, storageSource, '，Blob ID:', blobId);

    // 提取项目URL
    const projectUrl = fields.project_url || '';

    // 提取租期时间
    const leaseStart = fields.lease_start ? Number(fields.lease_start) * 1000 : Date.now();
    const leaseEnd = fields.lease_end ? Number(fields.lease_end) * 1000 : (Date.now() + 30 * 24 * 60 * 60 * 1000);

    console.log(`[${requestId}] 租期:`, {
      start: new Date(leaseStart).toLocaleString(),
      end: new Date(leaseEnd).toLocaleString()
    });

    // 判断NFT是否有效/活跃
    const isActive = leaseEnd > Date.now() && (fields.is_active === true || fields.is_active === undefined);
    console.log(`[${requestId}] NFT是否活跃:`, isActive ? "是" : "否");

    // 提取价格信息
    const price = fields.price || fields.amount || '';

    // 提取创建时间/最后续约时间
    const creationTime = fields.creation_time ? new Date(Number(fields.creation_time) * 1000).toISOString() :
                        new Date(leaseStart).toISOString();

    const lastRenewalTime = fields.last_renewal_time ? new Date(Number(fields.last_renewal_time) * 1000).toISOString() :
                           fields.renewal_time ? new Date(Number(fields.renewal_time) * 1000).toISOString() : undefined;

    // 提取初始创建者地址
    const originalOwner = fields.original_owner || fields.creator || '';

    // 尝试获取关联的广告位信息
    let gameId = '';
    let location = '';
    let size = { width: 300, height: 250 };

    if (adSpaceId) {
      try {
        const adSpace = await getAdSpaceById(adSpaceId);
        if (adSpace) {
          gameId = adSpace.name.replace(' 广告位', '');
          location = adSpace.location;
          size = adSpace.dimension;
        }
      } catch (error) {
        console.log(`[${requestId}] 获取关联广告位信息失败:`, error);
      }
    }

    // 构建NFT对象
    const nft: BillboardNFT = {
      id: nftId,
      adSpaceId,
      owner,
      brandName,
      contentUrl,
      projectUrl,
      leaseStart: new Date(leaseStart).toISOString(),
      leaseEnd: new Date(leaseEnd).toISOString(),
      isActive,
      creationTime,
      lastRenewalTime,
      price,
      originalOwner,
      size,
      gameId,
      location,
      storageSource: storageSource as 'walrus' | 'external' | undefined,
      blobId
    };

    console.log(`[${requestId}] 成功解析NFT: ${nftId}`);
    return nft;
  } catch (error) {
    console.error('获取NFT详情失败:', error);
    return null;
  }
}

// 创建购买广告位交易
export function createPurchaseAdSpaceTx(params: PurchaseAdSpaceParams): Transaction {
  const tx = new Transaction();

  if (USE_MOCK_DATA) {
    console.log('使用模拟交易数据');
    return tx;
  }

  console.log('构建购买广告位交易', params);

  // 获取Clock对象
  const clockObj = tx.object(CONTRACT_CONFIG.CLOCK_ID);

  // @ts-ignore
  // 创建SUI支付对象
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(params.price)]);

  // 准备blob_id参数
  const blobIdBytes = params.blobId
    ? tx.pure.string(params.blobId)
    : tx.pure.string('');

  // 调用合约的purchase_ad_space函数
  // @ts-ignore
  tx.moveCall({
    target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::purchase_ad_space`,
    arguments: [
      tx.object(CONTRACT_CONFIG.FACTORY_OBJECT_ID),
      tx.object(params.adSpaceId),
      payment,
      tx.pure.string(params.brandName),
      tx.pure.string(params.contentUrl),
      tx.pure.string(params.projectUrl),
      tx.pure.u64(params.leaseDays),
      clockObj,
      tx.pure.u64(params.startTime || 0),
      blobIdBytes,
      tx.pure.string(params.storageSource || 'none')
    ],
  });

  return tx;
}

// 创建更新广告内容交易
export function createUpdateAdContentTx(params: UpdateNFTContentParams): Transaction {
  const tx = new Transaction();

  if (USE_MOCK_DATA) {
    console.log('使用模拟交易数据');
    return tx;
  }

  console.log('构建更新广告内容交易');

  // 准备blob_id参数
  const blobIdBytes = params.blobId
    ? tx.pure.string(params.blobId)
    : tx.pure.string('');

  // 调用合约的update_ad_content函数
  // @ts-ignore
  tx.moveCall({
    target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::update_ad_content`,
    arguments: [
      tx.object(params.nftId), // nft
      tx.pure.string(params.contentUrl), // content_url
      blobIdBytes, // blob_id
      tx.pure.string(params.storageSource || 'none'), // storage_source
      tx.object(CONTRACT_CONFIG.CLOCK_ID) // clock
    ],
  });

  return tx;
}

// 创建续租交易
export function createRenewLeaseTx(params: RenewNFTParams): Transaction {
  const tx = new Transaction();

  if (USE_MOCK_DATA) {
    console.log('使用模拟交易数据');
    return tx;
  }

  console.log('构建续租交易，参数:', params);

  // 确保价格是字符串，并检查是否需要转换单位
  let priceAmount = params.price;
  if (Number(priceAmount) < 1000000) {
    priceAmount = (Number(priceAmount) * 1000000000).toString();
    console.log('价格单位转换:', params.price, '->', priceAmount);
  }

  // @ts-ignore
  // 创建SUI支付对象
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceAmount)]);

  // 调用合约的renew_lease函数
  // @ts-ignore
  tx.moveCall({
    target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::renew_lease`,
    arguments: [
      tx.object(CONTRACT_CONFIG.FACTORY_OBJECT_ID), // factory
      tx.object(params.adSpaceId), // ad_space
      tx.object(params.nftId), // nft
      payment, // payment
      tx.pure.u64(params.leaseDays), // lease_days
      tx.object(CONTRACT_CONFIG.CLOCK_ID) // clock
    ],
  });

  return tx;
}

// 创建广告位的交易
export function createAdSpaceTx(params: CreateAdSpaceParams): Transaction {
  const tx = new Transaction();

  if (USE_MOCK_DATA) {
    console.log('使用模拟交易数据');
    return tx;
  }

  // 获取必要的对象
  const factoryObj = tx.object(CONTRACT_CONFIG.FACTORY_OBJECT_ID);

  // 调用合约的create_ad_space函数
  // @ts-ignore
  tx.moveCall({
    target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::create_ad_space`,
    arguments: [
      factoryObj,                 // Factory 对象
      tx.pure.string(params.gameId),     // 游戏ID
      tx.pure.string(params.location),   // 位置信息
      tx.pure.string(params.size),       // 尺寸信息
      tx.pure.u64(params.price),      // 价格 - 使用u64类型
      tx.object(CONTRACT_CONFIG.CLOCK_ID) // Clock对象
    ],
  });

  return tx;
}

// 注册游戏开发者的交易
export function registerGameDevTx(params: { factoryId: string, developer: string }): Transaction {
  const tx = new Transaction();

  // 调用合约的 register_game_dev 函数
  // @ts-ignore
  tx.moveCall({
    target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::register_game_dev`,
    arguments: [
      tx.object(params.factoryId),  // Factory 对象
      tx.pure.address(params.developer) // 开发者地址
    ],
  });

  return tx;
}

// 更新平台分成比例的交易
export function updatePlatformRatioTx(params: { factoryId: string, ratio: number }): Transaction {
  const tx = new Transaction();

  // 调用合约的 update_platform_ratio 函数
  // @ts-ignore
  tx.moveCall({
    target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::update_platform_ratio`,
    arguments: [
      tx.object(params.factoryId), // Factory 对象
      tx.pure.u8(params.ratio)    // 新的平台分成比例 - 使用u8类型匹配合约参数
    ],
  });

  return tx;
}

// 更新广告位价格的交易
export function updateAdSpacePriceTx(params: { adSpaceId: string, price: string }): Transaction {
  const tx = new Transaction();

  // 调用合约的 update_ad_space_price 函数
  // @ts-ignore
  tx.moveCall({
    target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::update_ad_space_price`,
    arguments: [
      tx.object(params.adSpaceId), // AdSpace 对象
      tx.pure.u64(params.price) // 新的价格 - 使用u64类型
    ],
  });

  return tx;
}

// 计算广告位租赁价格
export async function calculateLeasePrice(adSpaceId: string, leaseDays: number): Promise<string> {
  if (USE_MOCK_DATA) {
    console.log('使用模拟价格计算');
    // 模拟价格计算 (仅测试用)
    const mockPrice = 100000000 * leaseDays; // 0.1 SUI * 天数
    return mockPrice.toString();
  }

  console.log('计算广告位租赁价格，广告位ID:', adSpaceId, '租赁天数:', leaseDays);

  // 验证租赁天数在有效范围内
  if (leaseDays <= 0 || leaseDays > 365) {
    throw new Error('租赁天数必须在1-365天之间');
  }

  try {
    // 获取广告位信息
    const adSpace = await getAdSpaceById(adSpaceId);

    if (!adSpace) {
      throw new Error(`未找到广告位: ${adSpaceId}`);
    }

    console.log('广告位基础价格:', adSpace.price);

    // 使用几何级数公式计算租赁价格，与合约保持一致
    const dailyPrice = BigInt(adSpace.price);  // Y - 一天的租赁价格
    const ratio = BigInt(977000); // a - 比例因子，这里设为0.977000
    const base = BigInt(1000000); // 用于表示小数的基数
    const minDailyFactor = BigInt(500000); // 最低日因子(1/2)

    // 如果只租一天，直接返回每日价格
    if (leaseDays === 1) {
      return dailyPrice.toString();
    }

    // 计算租赁总价
    let totalPrice = dailyPrice; // 第一天的价格
    let factor = base; // 初始因子为1.0

    // 从第二天开始计算
    for (let i = 1; i < leaseDays; i++) {
      // 计算当前因子
      factor = (factor * ratio) / base;

      // 如果因子低于最低值，则使用最低值
      if (factor < minDailyFactor) {
        // 增加(租赁天数-i)天的最低价格
        const remainingDays = BigInt(leaseDays - i);
        totalPrice = totalPrice + ((dailyPrice * minDailyFactor * remainingDays) / base);
        break;
      }

      // 否则增加当前因子对应的价格
      totalPrice = totalPrice + ((dailyPrice * factor) / base);
    }

    console.log('几何级数计算的总租赁价格:', totalPrice.toString(), '(', formatSuiAmount(totalPrice.toString()), 'SUI)');

    return totalPrice.toString();
  } catch (error) {
    console.error('计算租赁价格失败:', error);
    throw new Error(`计算租赁价格失败: ${error}`);
  }
}

// 格式化SUI金额
export function formatSuiAmount(amount: string): string {
  console.log('格式化SUI金额:', amount);

  if (!amount) {
    console.warn('SUI金额为空');
    return '0';
  }

  try {
    // 将字符串转换为数字
    const amountInMist = BigInt(amount);
    console.log('转换为BigInt后的金额:', amountInMist.toString());

    // 转换为SUI单位 (1 SUI = 10^9 MIST)
    const amountInSui = Number(amountInMist) / 1000000000;
    console.log('转换为SUI单位后的金额:', amountInSui);

    // 检查结果是否为NaN
    if (isNaN(amountInSui)) {
      console.warn('SUI金额格式化后为NaN');
      return '0';
    }

    // 格式化为最多9位小数
    return amountInSui.toFixed(9);
  } catch (error) {
    console.error('格式化SUI金额时出错:', error);

    // 尝试直接将字符串解析为数字
    try {
      const numAmount = Number(amount) / 1000000000;
      if (!isNaN(numAmount)) {
        console.log('使用Number直接解析成功:', numAmount);
        return numAmount.toFixed(9);
      }
    } catch (e) {
      console.error('尝试直接解析也失败:', e);
    }

    return '0';
  }
}

// 更新NFT内容
export async function updateNFTContent(params: UpdateNFTContentParams): Promise<boolean> {
  try {
    console.log('更新NFT内容');
    // 这里是真实代码，应该调用合约更新NFT内容
    // 由于实际代码需要根据合约结构实现，这里只是一个示例框架

    // TODO: 实现实际的合约调用逻辑

    return true; // 返回true作为示例
  } catch (error) {
    console.error('更新NFT内容失败:', error);
    return false;
  }
}

// 辅助函数：详细比较两个地址
export function compareAddresses(address1: string, address2: string): boolean {
  // 规范化两个地址
  const normalizedAddr1 = address1.toLowerCase();
  const normalizedAddr2 = address2.toLowerCase();

  const isEqual = normalizedAddr1 === normalizedAddr2;

  // 如果不相等，分析原因
  if (!isEqual) {
    // 长度比较
    if (normalizedAddr1.length !== normalizedAddr2.length) {
      console.log(`地址长度不同: ${normalizedAddr1.length} vs ${normalizedAddr2.length}`);
    }

    // 前缀比较
    if (!normalizedAddr1.startsWith('0x') || !normalizedAddr2.startsWith('0x')) {
      console.log(`地址前缀问题: "${normalizedAddr1.substring(0, 2)}" vs "${normalizedAddr2.substring(0, 2)}"`);
    }

    // 逐字符比较，找到第一个不同的位置
    for (let i = 0; i < Math.min(normalizedAddr1.length, normalizedAddr2.length); i++) {
      if (normalizedAddr1[i] !== normalizedAddr2[i]) {
        console.log(`地址第${i+1}个字符不同: "${normalizedAddr1[i]}" vs "${normalizedAddr2[i]}"`);
        console.log(`地址不同部分: "${normalizedAddr1.substring(i, i+10)}..." vs "${normalizedAddr2.substring(i, i+10)}..."`);
        break;
      }
    }
  }

  return isEqual;
}

export async function getGameDevsFromFactory(factoryId: string): Promise<string[]> {
  console.log('获取工厂中的游戏开发者列表, 工厂ID:', factoryId);

  if (USE_MOCK_DATA) {
    console.log('使用模拟游戏开发者数据');
    return MOCK_GAME_DEVS;
  }

  try {
    const suiClient = createSuiClient();

    // 获取Factory对象
    const factoryObj = await suiClient.getObject({
      id: factoryId,
      options: {
        showContent: true,
      }
    });

    if (factoryObj.data && factoryObj.data.content && 'fields' in factoryObj.data.content) {
      const fields = factoryObj.data.content.fields as any;

      if (fields.game_devs && Array.isArray(fields.game_devs)) {
        console.log('获取到开发者列表:', fields.game_devs);
        return fields.game_devs;
      } else {
        console.log('Factory对象中无游戏开发者列表或格式不正确');
        return [];
      }
    } else {
      console.error('无法获取Factory对象内容');
      return [];
    }
  } catch (error) {
    console.error('获取游戏开发者列表失败:', error);
    return [];
  }
}

// 获取平台分成比例
export async function getPlatformRatio(factoryId: string): Promise<number> {
  console.log('获取平台分成比例, 工厂ID:', factoryId);

  if (USE_MOCK_DATA) {
    console.log('使用模拟平台分成比例数据');
    return 10; // 模拟分成比例为10%
  }

  try {
    const suiClient = createSuiClient();

    // 获取Factory对象
    const factoryObj = await suiClient.getObject({
      id: factoryId,
      options: {
        showContent: true,
      }
    });

    if (factoryObj.data && factoryObj.data.content && 'fields' in factoryObj.data.content) {
      const fields = factoryObj.data.content.fields as any;

      if ('platform_ratio' in fields) {
        const ratio = Number(fields.platform_ratio);
        console.log('获取到平台分成比例:', ratio);
        return ratio;
      } else {
        console.log('Factory对象中无平台分成比例字段或格式不正确');
        return 10; // 默认为10%
      }
    } else {
      console.error('无法获取Factory对象内容');
      return 10; // 默认为10%
    }
  } catch (error) {
    console.error('获取平台分成比例失败:', error);
    return 10; // 默认为10%
  }
}

// 从Factory中获取所有广告位
export async function getAllAdSpacesFromFactory(factoryId: string, developerAddress?: string): Promise<AdSpace[]> {
  try {
    // 生成一个唯一的请求ID，用于日志跟踪
    const requestId = new Date().getTime().toString();
    // 规范化开发者地址
    const normalizedDevAddress = developerAddress ? developerAddress.toLowerCase() : '';

    console.log(`[${requestId}] 从Factory获取所有广告位数据，开发者: ${normalizedDevAddress || '未指定'}`);
    const client = createSuiClient();

    // 获取工厂对象
    const factoryObject = await client.getObject({
      id: factoryId,
      options: {
        showContent: true,
        showDisplay: true,
        showType: true,
      }
    });

    // 从工厂对象中直接获取广告位列表和创建者信息
    if (factoryObject.data?.content?.dataType === 'moveObject') {
      const fields = factoryObject.data.content.fields as any;
      console.log(`[${requestId}] Factory对象字段列表:`, Object.keys(fields || {}));

      // 添加更详细的调试信息，打印整个对象结构
      try {
        console.log(`[${requestId}] Factory原始字段:`, fields);

        // 尝试检查raw数据结构
        if (factoryObject.data?.bcs) {
          console.log(`[${requestId}] Factory BCS数据存在`);
        }

        // 检查Fields键值
        if (fields) {
          console.log(`[${requestId}] Factory Fields键列表:`, Object.keys(fields));

          // 针对ad_spaces特别检查
          if (fields.ad_spaces) {
            const adSpacesType = typeof fields.ad_spaces;
            console.log(`[${requestId}] ad_spaces类型: ${adSpacesType}`);

            if (adSpacesType === 'object') {
              if (Array.isArray(fields.ad_spaces)) {
                console.log(`[${requestId}] ad_spaces是数组，长度:`, fields.ad_spaces.length);

                // 打印数组中第一个元素的结构
                if (fields.ad_spaces.length > 0) {
                  console.log(`[${requestId}] 第一个ad_space结构:`, fields.ad_spaces[0]);
                  console.log(`[${requestId}] 第一个ad_space键列表:`, Object.keys(fields.ad_spaces[0]));
                }
              } else {
                console.log(`[${requestId}] ad_spaces是非数组对象:`, fields.ad_spaces);
                console.log(`[${requestId}] ad_spaces键列表:`, Object.keys(fields.ad_spaces));
              }
            }
          }
        }
      } catch (debugError) {
        console.error(`[${requestId}] 调试信息生成出错:`, debugError);
      }

      // 检查并打印ad_spaces的详细内容
      if (fields && fields.ad_spaces) {
        console.log(`[${requestId}] ad_spaces类型:`, typeof fields.ad_spaces);
        console.log(`[${requestId}] ad_spaces是否数组:`, Array.isArray(fields.ad_spaces));
        console.log(`[${requestId}] ad_spaces详细内容:`, JSON.stringify(fields.ad_spaces));

        // 特殊处理ad_spaces的格式
        const adSpacesEntries = Array.isArray(fields.ad_spaces) ? fields.ad_spaces :
          (typeof fields.ad_spaces === 'object' ? [fields.ad_spaces] : []);

        console.log(`[${requestId}] 处理后的ad_spaces条目总数:`, adSpacesEntries.length);

        // 详细记录每个条目的类型和结构
        adSpacesEntries.forEach((entry: any, index: number) => {
          console.log(`[${requestId}] 条目[${index}]类型:`, typeof entry);
          console.log(`[${requestId}] 条目[${index}]内容:`, entry);

          // 检查创建者字段的存在方式
          let creator = null;
          let adSpaceId = null;

          if (entry.creator) {
            creator = entry.creator;
          } else if (entry.fields && entry.fields.creator) {
            creator = entry.fields.creator;
          }

          // 检查广告位ID的存在方式
          if (entry.ad_space_id) {
            adSpaceId = typeof entry.ad_space_id === 'string' ? entry.ad_space_id :
              (entry.ad_space_id.id ? entry.ad_space_id.id : JSON.stringify(entry.ad_space_id));
          } else if (entry.fields && entry.fields.ad_space_id) {
            adSpaceId = typeof entry.fields.ad_space_id === 'string' ? entry.fields.ad_space_id :
              (entry.fields.ad_space_id.id ? entry.fields.ad_space_id.id : JSON.stringify(entry.fields.ad_space_id));
          }

          console.log(`[${requestId}] 条目[${index}]创建者:`, creator);
          console.log(`[${requestId}] 条目[${index}]广告位ID:`, adSpaceId);
        });

        // 详细记录每个条目的创建者地址，便于调试
        console.log(`[${requestId}] ==== 广告位创建者地址列表 ====`);
        adSpacesEntries.forEach((entry: any, index: number) => {
          // 特殊处理不同格式的创建者字段
          let creator = null;
          if (entry.creator) {
            creator = entry.creator;
          } else if (entry.fields && entry.fields.creator) {
            creator = entry.fields.creator;
          }

          if (creator) {
            const creatorStr = typeof creator === 'string' ? creator :
              (typeof creator === 'object' ? JSON.stringify(creator) : String(creator));
            console.log(`[${requestId}] 条目[${index}] 创建者: ${creatorStr}`);
          } else {
            console.log(`[${requestId}] 条目[${index}] 创建者字段不存在或格式不正确:`, entry);
          }
        });

        // 过滤出当前开发者创建的广告位，适应多种可能的格式
        const devAdSpaceEntries = adSpacesEntries.filter((entry: any) => {
          // 如果未指定开发者地址，则返回所有广告位
          if (!normalizedDevAddress) {
            return true;
          }

          // 提取创建者字段，考虑多种可能的结构
          let creator = null;
          if (entry.creator) {
            creator = entry.creator;
          } else if (entry.fields && entry.fields.creator) {
            creator = entry.fields.creator;
          }

          if (!creator) {
            console.log(`[${requestId}] 跳过无效条目 (无法找到创建者字段):`, entry);
            return false;
          }

          // 规范化创建者地址为小写
          const entryCreator = typeof creator === 'string' ? creator.toLowerCase() :
            (typeof creator === 'object' ? JSON.stringify(creator).toLowerCase() : String(creator).toLowerCase());

          console.log(`[${requestId}] 详细比较:
            - 原始创建者数据: ${typeof creator === 'object' ? JSON.stringify(creator) : creator}
            - 处理后的创建者: ${entryCreator}
            - 规范化的查询地址: ${normalizedDevAddress}
            - 地址类型: ${typeof creator}
          `);

          // 测试特定地址的匹配情况
          if (normalizedDevAddress === "0x0020a8a7006d0f1eee952994192f67e41afabbb971678ac44eb068955193c6a4") {
            console.log(`[${requestId}] 正在与已知地址0x0020a...进行比较`);
            if (entryCreator.includes("0x0020a8a7006d0f1eee952994192f67e41afabbb971678ac44eb068955193c6a4")) {
              console.log(`[${requestId}] 特殊匹配成功!`);
              return true;
            }
          }

          // 尝试多种可能的匹配方式
          const exactMatch = entryCreator === normalizedDevAddress;
          const containsMatch = entryCreator.includes(normalizedDevAddress) || normalizedDevAddress.includes(entryCreator);

          console.log(`[${requestId}] 匹配结果:
            - 完全匹配: ${exactMatch}
            - 包含匹配: ${containsMatch}
          `);

          return exactMatch || containsMatch;
        });

        // 其余代码保持不变
        console.log(`[${requestId}] 开发者创建的广告位条目数:`, devAdSpaceEntries.length);

        if (devAdSpaceEntries.length === 0) {
          console.log(`[${requestId}] 开发者没有创建过广告位`);
          // 返回一个友好的提示广告位
          return [{
            id: '0x0',
            name: '您还没有创建广告位',
            description: '您尚未创建任何广告位，点击"创建广告位"按钮开始创建您的第一个广告位。',
            imageUrl: 'https://via.placeholder.com/300x250?text=创建您的第一个广告位',
            price: '0',
            duration: 30,
            dimension: { width: 0, height: 0 },
            owner: null,
            available: false,
            location: '',
            isExample: true, // 标记这是示例数据
            price_description: ''
          }];
        }

        // 获取开发者创建的广告位详细信息
        const devAdSpaces: AdSpace[] = [];

        for (const entry of devAdSpaceEntries) {
          try {
            console.log(`[${requestId}] 开始处理广告位条目:`, entry);

            // 确保能够访问到广告位ID
            if (!entry.fields && !entry.ad_space_id) {
              console.error(`[${requestId}] 广告位条目缺少ad_space_id字段和fields字段:`, JSON.stringify(entry));
              continue;
            }

            // 提取广告位ID
            let adSpaceId = null;

            // 检查不同位置的ad_space_id
            if (entry.fields && entry.fields.ad_space_id) {
              if (typeof entry.fields.ad_space_id === 'string') {
                adSpaceId = entry.fields.ad_space_id;
                console.log(`[${requestId}] 从fields.ad_space_id字符串获取到ID:`, adSpaceId);
              } else if (entry.fields.ad_space_id.id) {
                adSpaceId = entry.fields.ad_space_id.id;
                console.log(`[${requestId}] 从fields.ad_space_id.id获取到ID:`, adSpaceId);
              } else {
                // 序列化复杂对象并提取ID
                const objStr = JSON.stringify(entry.fields.ad_space_id);
                console.log(`[${requestId}] 复杂的fields.ad_space_id:`, objStr);

                // 尝试匹配任何0x开头的十六进制ID
                const idMatch = objStr.match(/"(0x[a-fA-F0-9]+)"/);
                if (idMatch && idMatch[1]) {
                  adSpaceId = idMatch[1];
                  console.log(`[${requestId}] 从复杂对象中提取到ID:`, adSpaceId);
                }
              }
            } else if (entry.ad_space_id) {
              // 直接从entry获取
              if (typeof entry.ad_space_id === 'string') {
                adSpaceId = entry.ad_space_id;
              } else if (entry.ad_space_id.id) {
                adSpaceId = entry.ad_space_id.id;
              } else {
                const objStr = JSON.stringify(entry.ad_space_id);
                const idMatch = objStr.match(/"(0x[a-fA-F0-9]+)"/);
                if (idMatch && idMatch[1]) {
                  adSpaceId = idMatch[1];
                }
              }
            }

            if (!adSpaceId) {
              console.error(`[${requestId}] 无法提取广告位ID:`, JSON.stringify(entry));
              continue;
            }

            console.log(`[${requestId}] 成功提取广告位ID:`, adSpaceId);

            // 获取广告位详情
            const adSpace = await getAdSpaceById(adSpaceId);

            if (adSpace) {
              // 添加创建者信息到广告位，以便调试
              (adSpace as any).creator = entry.creator;

              devAdSpaces.push(adSpace);
              console.log(`[${requestId}] 成功添加广告位:`, adSpace.id);
            } else {
              // 如果直接获取失败，尝试原有的方式
              console.log(`[${requestId}] 直接获取广告位失败，尝试原有方式:`, adSpaceId);

              // 获取广告位对象，使用相同的选项强制刷新
              const adSpaceObject = await client.getObject({
                id: adSpaceId,
                options: {
                  showContent: true,
                  showDisplay: true,
                  showBcs: false,
                  showOwner: true,
                  showPreviousTransaction: true,
                  showStorageRebate: true,
                }
              });

              if (adSpaceObject.data?.content?.dataType === 'moveObject') {
                const adSpaceFields = adSpaceObject.data.content.fields as any;
                console.log(`[${requestId}] 广告位对象字段:`, Object.keys(adSpaceFields || {}));
                console.log(`[${requestId}] 广告位详细数据:`, adSpaceFields);

                // 安全地获取尺寸信息
                let width = 300, height = 250;
                const aspectRatio = adSpaceFields.size || "16:9";

                // 处理比例格式 (例如: "16:9")
                if (adSpaceFields.size && typeof adSpaceFields.size === 'string') {
                  if (adSpaceFields.size.includes(':')) {
                    // 新的比例格式
                    const [w, h] = adSpaceFields.size.split(':').map(Number);
                    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                      // 设置基于比例的预览尺寸
                      const baseSize = 300;
                      if (w >= h) {
                        width = baseSize;
                        height = Math.round(baseSize * (h / w));
                      } else {
                        height = baseSize;
                        width = Math.round(baseSize * (w / h));
                      }
                    }
                  } else if (adSpaceFields.size.includes('x')) {
                    // 兼容旧的像素格式
                    const sizeParts = adSpaceFields.size.split('x');
                    if (sizeParts.length === 2) {
                      width = parseInt(sizeParts[0]) || 300;
                      height = parseInt(sizeParts[1]) || 250;
                    }
                  }
                }

                // 构建广告位数据
                const adSpace: AdSpace = {
                  id: adSpaceId,
                  name: adSpaceFields.game_id ? `${adSpaceFields.game_id} 广告位` : `广告位 ${adSpaceId.substring(0, 8)}`,
                  description: adSpaceFields.location ? `位于 ${adSpaceFields.location} 的广告位` : '广告位详情',
                  imageUrl: `https://via.placeholder.com/${width}x${height}?text=${adSpaceFields.game_id || 'AdSpace'}`,
                  price: adSpaceFields.fixed_price || '0',
                  duration: 30, // 默认30天
                  dimension: {
                    width,
                    height,
                  },
                  aspectRatio, // 添加比例字段
                  owner: null, // 初始没有所有者
                  available: adSpaceFields.is_available !== undefined ? adSpaceFields.is_available : true,
                  location: adSpaceFields.location || '未知位置',
                };

                // 添加创建者信息到广告位，以便调试
                (adSpace as any).creator = entry.creator;

                devAdSpaces.push(adSpace);
                console.log(`[${requestId}] 成功添加广告位:`, adSpace.id);
              } else {
                console.warn(`[${requestId}] 获取的广告位不是Move对象类型:`, adSpaceObject.data?.content?.dataType);
              }
            }
          } catch (err) {
            console.error(`[${requestId}] 获取单个广告位详情失败:`, err);
            // 继续处理下一个广告位
          }
        }

        console.log(`[${requestId}] 完成广告位数据加载，共找到 ${devAdSpaces.length} 个广告位`);

        if (devAdSpaces.length === 0) {
          console.log(`[${requestId}] 获取到的有效广告位数量为0，返回提示广告位`);
          return [{
            id: '0x0',
            name: '无可用广告位',
            description: '无法获取您创建的广告位详细信息，请确保合约数据正确。',
            imageUrl: 'https://via.placeholder.com/300x250?text=无可用广告位',
            price: '0',
            duration: 30,
            dimension: { width: 0, height: 0 },
            owner: null,
            available: false,
            location: '',
            isExample: true,
            price_description: ''
          }];
        }

        return devAdSpaces;
      }
    }

    console.warn(`[${requestId}] 未能找到游戏开发者列表，工厂对象结构:`, factoryObject);
    return [];
  } catch (error) {
    console.error('获取游戏开发者列表失败:', error);
    return [];
  }
}

// 通过ID直接获取广告位信息
export async function getAdSpaceById(adSpaceId: string): Promise<AdSpace | null> {
  try {
    console.log('开始获取广告位详情, ID:', adSpaceId);

    // 如果是无效ID或示例ID
    if (!adSpaceId || adSpaceId === '0x0') {
      console.log('无效的广告位ID');
      return null;
    }

    const client = createSuiClient();

    // 获取广告位对象
    const adSpaceObject = await client.getObject({
      id: adSpaceId,
      options: {
        showContent: true,
        showDisplay: true,
        showType: true,
        showOwner: true
      }
    });

    // 检查广告位对象是否存在
    if (!adSpaceObject.data || !adSpaceObject.data.content) {
      console.error('广告位对象不存在或内容为空:', adSpaceObject);
      return null;
    }

    console.log('获取到广告位对象');

    // 检查对象类型是否为AdSpace
    const typeStr = adSpaceObject.data.type || '';
    const isAdSpaceType = typeStr.includes(`${CONTRACT_CONFIG.PACKAGE_ID}::ad_space::AdSpace`);

    if (!isAdSpaceType || adSpaceObject.data.content.dataType !== 'moveObject') {
      console.error('对象不是AdSpace类型:', {
        type: typeStr,
        contentType: adSpaceObject.data.content.dataType
      });
      return null;
    }

    // 提取广告位字段
    const moveObject = adSpaceObject.data.content as { dataType: 'moveObject', fields: Record<string, any> };
    const fields = moveObject.fields;

    console.log('广告位字段:', fields);

    // 提取尺寸信息 - 从size字段解析
    let width = 300, height = 250;
    const aspectRatio = fields.size || "16:9";

    // 处理比例格式 (例如: "16:9")
    if (fields.size && typeof fields.size === 'string') {
      if (fields.size.includes(':')) {
        // 新的比例格式
        const [w, h] = fields.size.split(':').map(Number);
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          // 设置基于比例的预览尺寸
          const baseSize = 300;
          if (w >= h) {
            width = baseSize;
            height = Math.round(baseSize * (h / w));
          } else {
            height = baseSize;
            width = Math.round(baseSize * (w / h));
          }
        }
      } else if (fields.size.includes('x')) {
        // 兼容旧的像素格式
        const sizeParts = fields.size.split('x');
        if (sizeParts.length === 2) {
          width = parseInt(sizeParts[0]) || 300;
          height = parseInt(sizeParts[1]) || 250;
        }
      }
    }

    // 提取价格信息 - 使用fixed_price字段
    const price = fields.fixed_price || '0';

    // 提取租期天数 - 保持默认30天
    const duration = 30;

    // 提取状态信息 - 使用is_available字段
    const available = fields.is_available === true;

    // 提取位置信息
    const location = fields.location || '未指定';

    // 提取game_id信息并构建名称
    const gameId = fields.game_id || '';
    const name = gameId ? `${gameId} 广告位` : `广告位 ${adSpaceId.substring(0, 8)}`;

    // 提取描述信息
    const description = fields.location ? `位于 ${fields.location} 的广告位` : '广告位详情';

    // 获取NFT ID列表
    let nft_ids: string[] = [];
    // 从工厂对象中获取广告位的NFT ID列表
    const factoryObject = await client.getObject({
      id: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
      options: {
        showContent: true,
      }
    });

    if (factoryObject.data?.content?.dataType === 'moveObject') {
      const factoryFields = factoryObject.data.content.fields as any;
      if (factoryFields && factoryFields.ad_spaces) {
        const adSpaceEntries = Array.isArray(factoryFields.ad_spaces)
          ? factoryFields.ad_spaces
          : [factoryFields.ad_spaces];

        // 查找匹配的广告位条目
        const matchingEntry = adSpaceEntries.find((entry: any) => {
          const entryFields = entry.fields || entry;
          const entryAdSpaceId = entryFields.ad_space_id?.id || entryFields.ad_space_id;
          return entryAdSpaceId === adSpaceId;
        });

        if (matchingEntry) {
          const entryFields = matchingEntry.fields || matchingEntry;
          if (entryFields.nft_ids && Array.isArray(entryFields.nft_ids)) {
            // 提取NFT ID列表
            nft_ids = entryFields.nft_ids.map((nftIdObj: any) => {
              return typeof nftIdObj === 'string' ? nftIdObj : (nftIdObj.id || '');
            }).filter(Boolean);
            console.log(`从工厂对象中获取到广告位[${adSpaceId}]的NFT ID列表:`, nft_ids);
          }
        }
      }
    }

    // 构建广告位对象
    const adSpace: AdSpace = {
      id: adSpaceId,
      name,
      description,
      imageUrl: '', // 广告位没有实际图片
      price,
      duration,
      dimension: {
        width,
        height
      },
      aspectRatio, // 添加比例字段
      owner: null, // 暂不处理所有者
      available,
      location,
      nft_ids // 添加NFT ID列表
    };

    console.log('成功解析广告位详情:', adSpace.id, adSpace.name);

    // 尝试获取广告位的创建者信息
    try {
      // 从工厂对象中查找对应的广告位条目，获取创建者信息
      const factoryObject = await client.getObject({
        id: CONTRACT_CONFIG.FACTORY_OBJECT_ID,
        options: {
          showContent: true,
        }
      });

     // 从工厂对象中寻找对应广告位的创建者信息
     if (factoryObject.data?.content?.dataType === 'moveObject') {
       const fields = factoryObject.data.content.fields as any;

       // 解析广告位条目
       if (fields && fields.ad_spaces) {
         let adSpaceEntries = [];
         if (Array.isArray(fields.ad_spaces)) {
           adSpaceEntries = fields.ad_spaces;
         } else {
           adSpaceEntries = [fields.ad_spaces];
         }

         // 寻找匹配的广告位条目
         const matchingEntry = adSpaceEntries.find((entry: any) => {
           // 提取广告位ID
           let entryAdSpaceId = null;
           if (entry.ad_space_id) {
             if (typeof entry.ad_space_id === 'string') {
               entryAdSpaceId = entry.ad_space_id;
             } else if (entry.ad_space_id.id) {
               entryAdSpaceId = entry.ad_space_id.id;
             }
           } else if (entry.fields && entry.fields.ad_space_id) {
             if (typeof entry.fields.ad_space_id === 'string') {
               entryAdSpaceId = entry.fields.ad_space_id;
             } else if (entry.fields.ad_space_id.id) {
               entryAdSpaceId = entry.fields.ad_space_id.id;
             }
           }

           return entryAdSpaceId === adSpaceId;
         });

         // 如果找到匹配的条目，添加创建者信息
         if (matchingEntry) {
           // 提取创建者信息
           if (matchingEntry.creator) {
             (adSpace as any).creator = matchingEntry.creator;
             console.log(`为广告位详情添加创建者信息:`, matchingEntry.creator);
           } else if (matchingEntry.fields && matchingEntry.fields.creator) {
             (adSpace as any).creator = matchingEntry.fields.creator;
             console.log(`为广告位详情添加创建者信息:`, matchingEntry.fields.creator);
           }
         }
       }
     }
    } catch (error) {
      console.error('获取广告位创建者信息失败:', error);
      // 即使获取创建者信息失败，也返回广告位基本信息
    }

    return adSpace;
  } catch (error) {
    console.error('通过ID获取广告位失败:', error);
    return null;
  }
}

// 获取游戏开发者创建的广告位列表
export async function getCreatedAdSpaces(developerAddress: string): Promise<AdSpace[]> {
  return getAllAdSpacesFromFactory(CONTRACT_CONFIG.FACTORY_OBJECT_ID, developerAddress);
}

// 移除游戏开发者的交易
export function removeGameDevTx(params: RemoveGameDevParams): Transaction {
  const tx = new Transaction();

  // @ts-ignore
  // 调用合约的 remove_game_dev 函数
  // @ts-ignore
  tx.moveCall({
    target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::remove_game_dev`,
    arguments: [
      tx.object(params.factoryId),  // Factory 对象
      tx.pure.address(params.developer) // 开发者地址
    ],
  });

  return tx;
}

// 创建删除广告位的交易
export function deleteAdSpaceTx(params: { factoryId: string, adSpaceId: string }): Transaction {
  const tx = new Transaction();

  // @ts-ignore
  tx.moveCall({
    target: `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULE_NAME}::delete_ad_space`,
    arguments: [
      tx.object(params.factoryId),
      tx.object(params.adSpaceId)
    ],
  });

  return tx;
}