import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, Tabs } from "@radix-ui/themes";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { useState } from "react";
import { CreateNFT } from "./CreateNFT";
import { NFTList } from "./NFTList";
import { NFTDetail } from "./NFTDetail"; // 新增导入



function App() {
  const currentAccount = useCurrentAccount();
  const [nftId, setNft] = useState(() => {
    const hash = window.location.hash.slice(1);
    return isValidSuiObjectId(hash) ? hash : null;
  });
  return (
    <>
      <Flex 
        position="sticky"
        px="4"
        py="2"
        justify="between"
        align="center"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
          backgroundColor: "var(--color-background)",
        }}
      >
        <Heading size="3">NFT 演示应用</Heading>
        <ConnectButton />
      </Flex>
 
      <Container size="3" mt="5" px="4">
        {currentAccount ? (
          <Tabs.Root defaultValue="create">
            <Tabs.List>
              <Tabs.Trigger value="create">创建 NFT</Tabs.Trigger>
              <Tabs.Trigger value="view">我的 NFT</Tabs.Trigger>
            </Tabs.List>
 
            <Box pt="3">
              <Tabs.Content value="create">
                <CreateNFT 
                  onCreated={(id) => {
                  window.location.hash = id; // 更新URL哈希
                  setNft(id); // 更新状态
                }}
                />
              </Tabs.Content>
              <Tabs.Content value="view">
                <NFTList /> {/* 显示用户持有的NFT列表 */}
                {nftId && (         //二次修改增加NFTList
                  <Box mt="3">
                    <button 
                      onClick={() => {
                        window.location.hash = ""; // 清除URL哈希
                        setNft(null); // 重置nftId状态
                      }}
                      style={{ color: "var(--gray-11)", cursor: "pointer" }}
                    >
                      返回NFT列表
                    </button>
                  </Box>
                )}
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        ) : (
          <Flex justify="center" py="8">
            <Box style={{textAlign:"center"}}>
              <Heading mb="2">请连接钱包</Heading>
              <ConnectButton />
            </Box>
          </Flex>
        )}
        {nftId && <NFTDetail nftId={nftId} />}
      </Container>
    </>
  );
}
 
export default App;