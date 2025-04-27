import { useState } from "react";//使用 useState 管理 NFT 的名称 (name)、描述 (description) 和图像 URL (imageUrl)
import { useSignAndExecuteTransaction, useCurrentAccount, /*useSuiClient*/ } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Container, Flex, Heading, TextField, Button, Checkbox, Text } from "@radix-ui/themes";
import ClipLoader from "react-spinners/ClipLoader";
import { useNetworkVariable, } from "./networkConfig";
import { NFTList } from "./NFTList";


interface CreateNFTProps {
  onCreated: (id: string) => void; // 可选的回调函数
}

export function CreateNFT({ onCreated }: CreateNFTProps) {
  const currentAccount = useCurrentAccount();
  // const suiClient = useSuiClient(); // 使用 Sui 客户端
  const nftPackageId = useNetworkVariable("nftPackageId"); // 从 networkConfig 获取包 ID
  const [name, setName] = useState(""); // NFT 名称
  const [description, setDescription] = useState(""); // NFT 描述
  const [imageUrl, setImageUrl] = useState(""); // 图片 URL
  const [transferTo, setTransferTo] = useState(""); // 转移目标地址
  const [agreed, setAgreed] = useState(false); // 是否同意条款
  const [isLoading, setIsLoading] = useState(false); // 加载状态
  const [refresh, setRefresh] = useState(0); // 用于刷新 NFTList
  const { mutate: signAndExecute, /*isSuccess, isPending*/ } = useSignAndExecuteTransaction();

  // 示例：使用 useSuiClient 检查钱包状态
  // const checkWalletStatus = () => {
  //   if (suiClient) {
  //     console.log("Sui 客户端已准备好，可以启动钱包或执行查询");
  //     // 在这里可以添加具体的钱包交互逻辑
  //   }
  // };

  // Mint NFT 的处理函数
  const handleMint = async () => {
    if (!currentAccount) {
      console.error("请先连接 Sui 钱包");
      alert("请先连接 Sui 钱包");
      return;
    }
    if (!agreed) {
      console.error("请同意条款");
      alert("请同意条款");
      return;
    }
    if (!name || !description || !imageUrl) {
      console.error("请填写所有必填字段");
      alert("请填写名称、描述和图片 URL");
      return;
    }



    setIsLoading(true);
    
    const tx = new Transaction();
    tx.moveCall({
      target: `${nftPackageId}::nft::mint`,
      arguments: [
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(name))), // 转换为 vector<u8>
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(description))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(imageUrl))),
      ],
    });

    try {
      const result = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (res) => resolve(res),
            onError: (err) => reject(err),
          }
        );
      });
      const newNftId = result.effects?.created?.[0]?.reference?.objectId;
      if (newNftId) {
        onCreated(newNftId); // 调用回调函数传递 NFT ID
      }
      setRefresh((prev) => prev + 1); // 刷新 NFT 列表
      setName("");
      setDescription("");
      setImageUrl("");
      alert("NFT 铸造成功！");
    } catch (error) {
      console.error("铸造 NFT 出错:", error);
      alert("铸造 NFT 失败，请检查控制台日志");
    } finally {
      setIsLoading(false);
    }
  };

  // Transfer NFT 处理函数（铸造并转移）
  const handleTransfer = async () => {
    if (!currentAccount) {
      alert("请先连接 Sui 钱包");
      return;
    }
    if (!agreed) {
      alert("请同意条款");
      return;
    }
    if (!name || !description || !imageUrl || !transferTo) {
      alert("请填写名称、描述、图片 URL 和转移地址");
      return;
    }

    setIsLoading(true);
    const tx = new Transaction();
    tx.moveCall({
      target: `${nftPackageId}::nft::transfer_nft`,
      arguments: [
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(name))), // 转换为 vector<u8>
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(description))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(imageUrl))),
        tx.pure.address(transferTo), // 转移目标地址
      ],
    });

    try {
      const result = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (res) => resolve(res),
            onError: (err) => reject(err),
          }
        );
      });
      const newNftId = result.effects?.created?.[0]?.reference?.objectId;
      if (newNftId) {
        onCreated(newNftId); // 调用回调函数传递 NFT ID
      }
      setRefresh((prev) => prev + 1); // 刷新 NFT 列表
      setName("");
      setDescription("");
      setImageUrl("");
      setTransferTo("");
      alert("NFT 铸造并转移成功！");
    } catch (error) {
      console.error("铸造并转移 NFT 出错:", error);
      alert("铸造并转移 NFT 失败，请检查控制台日志");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Flex direction="column" gap="4">
        <Heading>创建 NFT</Heading>

        {/* NFT 名称输入 */}
        <TextField.Root
          placeholder="NFT 名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* NFT 描述输入 */}
        <TextField.Root
          placeholder="NFT 描述"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* 图片 URL 输入 */}
        <TextField.Root
          placeholder="图片 URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        {/* 转移地址输入（仅用于 Transfer） */}
        <TextField.Root
          placeholder="转移到地址(仅用于 Transfer)"
          value={transferTo}
          onChange={(e) => setTransferTo(e.target.value)}
        />

        {/* 同意条款复选框 */}
        <Flex align="center" gap="2">
          <Checkbox checked={agreed} onCheckedChange={(checked) => setAgreed(!!checked)} />
          <Text>我同意相关条款</Text>
        </Flex>

        {/* Mint 按钮 */}
        <Button onClick={handleMint} disabled={isLoading || !agreed}>
          {isLoading ? <ClipLoader size={20} color="#ffffff" /> : "Mint NFT"}
        </Button>

        {/* Transfer 按钮 */}
        <Button onClick={handleTransfer} disabled={isLoading || !agreed}>
          {isLoading ? <ClipLoader size={20} color="#ffffff" /> : "Transfer NFT"}
        </Button>
      </Flex>

      {/* NFT 列表组件 */}
      <NFTList key={refresh} />
    </Container>
  );
}
// import { SuiObjectData } from "@mysten/sui/client";  //注意确认
// interface CreateNFTProps {
//   onCreated: (id:string) => void;
// } 

// //20250000000000000000000000000000000000000000000000000000000000000000000000000
// export function CreateNFT({
//   onCreated,
// }:{
//   onCreated:(id:string) => void; 
// }) {
//   const nftPackageId = useNetworkVariable("nftPackageId");
//   const suiClient = useSuiClient();
//   const { 
//     mutate: signAndExecute, 
//     isSuccess,
//     isPending,
//   } = useSignAndExecuteTransaction();

//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     imageUrl: "",
//     recipient: "",
//     mint: true,
//     transfer: false,
//   });

//   const handleSubmit = () => {
//     const tx = new Transaction();

//     //铸造NFT
    
//     tx.moveCall({ 
//       target: `${nftPackageId}::nft::create_nft`,
//       arguments: [
//         tx.pure(formData.name, "string"),
//         tx.pure(formData.description, "string"), 
//         tx.pure(formData.imageUrl, "string"),
         
//       ],
      
//     });
    
//     signAndExecute(
//       { transaction: tx },
//       {
//         onSuccess: async ({ digest }) => {
//           // 等待交易完成并获取创建的NFT ID
//           const { effects } = await suiClient.waitForTransaction({
//             digest,
//             options: { showEffects: true },
//           });
//           const newNftId = effects?.created?.[0]?.reference?.objectId!;
          
//           // 调用回调传递NFT ID
//           onCreated(newNftId);


//     // 如果需要转移 
//     if (formData.transfer  && formData.recipient && newNftId)  {
//       const transferTx = new Transaction();
//       transferTx.transferObjects(
//         [transferTx.object(newNftId)], // 使用刚创建的NFT ID
//         transferTx.pure(formData.recipient, "string")
//       );
//       await signAndExecute({ transaction: transferTx });
//     }
//   },
// }
// );
// };

 
//   return (
//     <Container size="2" p="4">
//       <Flex direction="column" gap="4">
//         <TextField.Root>
//           <TextField.Input 
//             placeholder="NFT 名称"
//             value={formData.name} 
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} 
//           />
//         </TextField.Root>
 
//         <TextField.Root>
//           <TextField.Textarea 
//             placeholder="描述"
//             value={formData.description} 
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, description: e.target.value})} 
//           />
//         </TextField.Root>
 
//         <TextField.Root>
//           <TextField.Input 
//             placeholder="图片URL"
//             type="url"
//             value={formData.imageUrl} 
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, imageUrl: e.target.value})} 
//           />
//         </TextField.Root>
 
//         <Flex gap="3">
//           <label className="flex items-center gap-2">
//             <Checkbox 
//               checked={formData.mint} 
//               onCheckedChange={(checked) => 
//                 setFormData({...formData, mint: !!checked})
//               }
//             />
//             <Text size="2">立即铸造</Text>
//           </label>
 
//           <label className="flex items-center gap-2">
//             <Checkbox 
//               checked={formData.transfer} 
//               onCheckedChange={(checked) => 
//                 setFormData({...formData, transfer: !!checked})
//               }
//             />
//             <Text size="2">直接转移</Text>
//           </label>
//         </Flex>
 
//         {formData.transfer  && (
//           <TextField.Root>
//             <TextField.Input 
//               placeholder="接收地址"
//               value={formData.recipient} 
//               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, recipient: e.target.value})} 
//             />
//           </TextField.Root>
//         )}
 

//         {isSuccess && (
//            <Text color="green" mt="2" size="2">
//              NFT 创建成功！
//            </Text>
//         )}

//         <Button 
//           onClick={handleSubmit}
//           disabled={isPending}
//         >
//           {isPending ? <ClipLoader size={16} color="currentColor" /> : "提交"}
//         </Button>
//       </Flex>
//     </Container>
//   );
// }    


//0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000






//     signAndExecute({Transaction: tx});
    
//     if (formData.mint) {
//       tx.moveCall({
//         target: `${nftPackageId}::nft::create_nft`,
//         arguments: [
//           tx.pure(formData.name),
//           tx.pure(formData.description),
//           tx.pure(formData.imageUrl),
//           tx.pure(tx.sender),    //自动填充当前发送者地址作为ctx
//         ],
//       });
//     }

//     if (formData.transfer && formData.recipient) {
//       // 这里需要先获取NFT ID，实际场景需要根据业务逻辑调整
//       // 示例：假设mint后立即transfer（实际需先获取objectId�?
//       tx.moveCall({
//         target: `${nftPackageId}::nft::transfer_nft`,
//         arguments: [
//           tx.object(nftId), // 需替换为实际NFT的objectId
//           tx.pure(formData.recipient),
//         ],
//       });
//     }

//     signAndExecute({ transaction: tx });
//   };

//   return (
//     <Container>
//       <Form>
//         <Input
//           label="NFT名称"
//           value={formData.name}
//           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
//         />
//         <Textarea
//           label="描述"
//           value={formData.description}
//           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
//         />
//         <Input
//           label="图片URL"
//           value={formData.imageUrl}
//           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, imageUrl: e.target.value })}
//         />
//         <Checkbox
//           checked={formData.mint}
//           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, mint: e.checked })}
//         >铸造NFT</Checkbox>
//         <Checkbox
//           checked={formData.transfer}
//           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, transfer: e.checked })}
//         >转账给地址</Checkbox>
//         {formData.transfer && (
//           <Input
//             label="目标地址"
//             value={formData.recipient}
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, recipient: e.target.value })}
//           />
//         )}
//         <Button
//           onClick={handleSubmit}
//           disabled={isPending}
//         >
//           {isPending ? <ClipLoader size={20} /> : "创建/转账NFT"}
//         </Button>
//       </Form>
//     </Container>
//   );
// }
