import { useSuiClientQuery,useCurrentAccount } from "@mysten/dapp-kit";
import { Flex, Box, Text, Button } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig"; // 添加导入
import type { SuiObjectData,  SuiObjectResponse } from "@mysten/sui/client"; // 关键导入

// 定义 MoveObject 接口（如果 SDK 未提供，可以手动声明）
// interface MoveObject {
//   dataType: 'moveObject';
//   type: string;
//   hasPublicTransfer: boolean;
//   fields: Record<string, any>;
// }
// 定义NFT字段的接口
interface NFTFields {
  name?: string;
  description?: string;
  image_url?: string;
  [key: string]: any; // 允许其他动态字段
}


// 新增：扩展 SuiObjectData 类型
interface ExtendedSuiObjectData extends SuiObjectData {
  dataType?: string;          // MoveObject 的标志属性
  fields?: Record<string, any>; // MoveObject 的字段
}
//   // 类型守卫函数
// function isMoveObject(data: SuiObjectData): data is MoveObject {
//   return (data as MoveObject).dataType === "moveObject";
// }
// 扩展SuiObjectData类型以支持字段访问

// 新增：类型保护函数
function isMoveObject(data: ExtendedSuiObjectData): boolean {
  return data.dataType === "moveObject";
}


// 组件定义
export function NFTList() {
  const currentAccount = useCurrentAccount();  
  const nftPackageId = useNetworkVariable("nftPackageId"); // 从网络配置获取（类型安全）

  // 处理未连接钱包的情况
  if (!currentAccount) {
    return (
      <Box py="5" style={{ textAlign: "center" }}>
        <Text color="gray">请先连接钱包</Text>
      </Box>
    );
  }

  // 1. 修改过滤器为你的NFT类型 
  const { data, isLoading } = useSuiClientQuery<"getOwnedObjects">(
    "getOwnedObjects", {
    owner: currentAccount?.address || "",
    filter: { StructType: `${nftPackageId}::nft::NFT`}, // 替换为你的packageId 
    options: { showContent: true, showType: true},  // 确保返回字段数据 
    },);
 
    // 显示加载中的提示
    if (isLoading) {
      return (
        <Box py="5" style={{ textAlign: "center" }}>
          <Text>加载中...</Text>
        </Box>
      );
    }  

    // 从 data.data 中获取 SuiObjectResponse[]，并设置默认值为空数组
    const ownedObjects: SuiObjectResponse[] = data?.data || [];
   // 过滤掉没有数据或有错误的响应
  const nfts = ownedObjects?.filter((obj) => {
    if (obj.error) {
      console.error(`NFT加载失败: ${obj.error}`);
      return false;
    }
    return obj.data;
  });    
  

  // 处理没有NFT的情况
  if (nfts.length === 0) {
    return (
      <Box py="5" style={{ textAlign: "center" }}>
        <Text color="gray">没有找到任何 NFT</Text>
      </Box>
    );
  } 

// 渲染NFT列表
  return (
    <Flex wrap="wrap" gap="4" p="4">
      {nfts.map((obj)  => {
        // 修改：使用 ExtendedSuiObjectData 类型
        const nftData = obj.data as ExtendedSuiObjectData; // 已过滤，确保 data 存在
        if (!isMoveObject(nftData)) {
          return null; // 跳过非 Move 对象的 NFT
        }
        const fields = nftData.fields as NFTFields;
        const description = fields?.description || '';
        
        return (
          <Flex 
            key={nftData.objectId}   // 使用 nftData.objectId
            direction="column" 
            gap="3" 
            width="240px" 
            style={{ 
              border: '1px solid var(--gray-a6)',
              borderRadius: 'var(--radius-3)',
              padding: 'var(--space-3)'
            }}
          >
            //图片处理
            <Box style={{ aspectRatio: '1/1', overflow: 'hidden' }}> 
              <img 
                src={fields?.image_url || '/placeholder-nft.png'} 
                onError={(e) => (e.currentTarget.src = "/placeholder-nft.png")}
                alt={fields?.name || "NFT"}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
            //信息简化
            <Text weight="bold">{fields?.name || '未命名 NFT'}</Text>
            const description = fields?.description || '';
            <Text size="2" color="gray">
              {description.slice(0, 30)}
              {description.length > 30 ? '...' : ''}
            </Text>
            {/* 查看详情按钮 */}        
            <Button size="1" asChild variant="soft">
              <a 
                href={`https://suiexplorer.com/object/${nftData.objectId}?network=devnet`} 
                target="_blank"
                rel="noopener noreferrer"
              >
                在浏览器查看 
              </a>
            </Button>
          </Flex>
        );
      })}
    </Flex>
  );
}