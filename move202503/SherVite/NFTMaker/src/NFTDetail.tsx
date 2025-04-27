import { useSuiClientQuery } from "@mysten/dapp-kit";
import { Text, Heading, Box } from "@radix-ui/themes";
// import type { SuiObjectData } from "@mysten/sui/client";

interface NFTDetailProps {
  nftId: string;
}

export function NFTDetail({ nftId }: NFTDetailProps) {
  // 使用 SuiClient 查询 NFT 对象数据
  const { data, isPending, error } = useSuiClientQuery("getObject", {
    id: nftId,
    options: {
      showContent: true, // 获取对象内容（包含 Move 结构体数据）
      showType: true,
    },
  });

  if (isPending) return <Text>Loading NFT details...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  if (!data.data) return <Text>NFT not found</Text>;

  // 解析 Move 结构体字段（假设 NFT 结构体包含 name、description、image_url 等字段）
  const nftFields = data.data.content?.dataType === "moveObject" 
    ? (data.data.content.fields as {
        name: string;
        description: string;
        image_url: string;
        // 按实际 NFT 结构体补充字段
      }) 
    : null;

  return (
    <Box mt="4" p="4" style={{ border: "1px solid var(--gray-a6)" }} className="radix-rounded-md" >
      <Heading size="4">NFT Details: {nftId}</Heading>
      {nftFields && (
        <Box>
          <Text weight="medium" mt="2">Name: {nftFields.name}</Text>
          <Text weight="medium" mt="1" color="gray">Description: {nftFields.description}</Text>
          <Box mt="3" style={{ maxWidth: "300px" }}>
            <img 
              src={nftFields.image_url} 
              alt={nftFields.name} 
              style={{ width: "100%", height: "200px", objectFit: "cover" }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}