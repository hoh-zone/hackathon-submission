"use client";
import { useNetworkVariables } from "@/app/networkconfig";
import { Button } from "@/components/ui/button";
import {
  queryBalance,
  queryChapterAllowlist,
  queryChapterDetail,
} from "@/contracts";
import { useCrypto } from "@/hooks/useCrypto";
import { useToast } from "@/hooks/useToast";
import { useZkproof } from "@/hooks/useZkproof";
import { IChapter, IChapterAllowlist, IVaribales } from "@/type";
import { Transaction } from "@mysten/sui/transactions";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function Chapter() {
  const [isPay, setIsPay] = useState(false);
  const [chapterDetail, setChapterDetail] = useState<IChapter>({} as IChapter);
  const [chapterAllowlist, setChapterAllowlist] = useState<IChapterAllowlist>(
    {} as IChapterAllowlist
  );
  const [content, setContent] = useState("");
  const account = localStorage.getItem("address");
  const { zktx } = useZkproof();
  const params = useParams();
  const { decryptFile } = useCrypto();
  const { errorToast } = useToast();
  const { id } = params; // 获取动态路由参数
  const { packageID, module } = useNetworkVariables() as IVaribales;
  useEffect(() => {
    if (typeof id === "string") {
      getChapterDetail(id);
      async function getChapterDetail(id: string) {
        // 查询章节详情
        const chapter = await queryChapterDetail(id);
        console.log("chapterdetail===", chapter);
        setChapterDetail(chapter);
        // 查询章节白名单
        const allowlist = await queryChapterAllowlist(chapter.allowlist_id);
        console.log("allowlist===", allowlist);
        setChapterAllowlist(allowlist);
      }
    }
  }, [id]);
  useEffect(() => {
    if (Number(chapterDetail.amount) === 0) {
      // 未加密
      setIsPay(true);
      fetchData();
      async function fetchData() {
        try {
          const result = await fetch(
            `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${chapterDetail.content}`
          );
          const data = await result.text();
          setContent(data);
          setIsPay(true);
        } catch (error) {
          errorToast(
            error instanceof Error ? error.message : "readWalrus is error"
          );
        }
      }
    } else {
      // 已支付或者是上传者，直接解密
      if (
        chapterAllowlist.allowlist?.includes(account ?? "") ||
        chapterDetail.owner === account
      ) {
        setIsPay(true);
        getTxtContent();
      } else {
        // 非上传者，未支付
        setIsPay(false);
      }
    }
  }, [chapterAllowlist]);
  // 充值
  const payEvent = async () => {
    if (!account) {
      errorToast("Current account is null");
      return;
    }
    const balance = await queryBalance(account);
    if (Number(balance.totalBalance) < Number(chapterDetail.amount)) {
      errorToast("coin is not enough");
      return;
    }
    const tx = new Transaction();
    const [splitcoin] = tx.splitCoins(tx.gas, [
      tx.pure.u64(chapterAllowlist.amount),
    ]);
    tx.moveCall({
      package: packageID,
      module: module,
      function: "add_allowlist",
      arguments: [tx.object(chapterAllowlist.id), splitcoin],
    });
    const result = await zktx(tx, account);
    if (result?.digest) {
      getTxtContent();
    }
  };
  // 解密
  const getTxtContent = async () => {
    try {
      const result = await fetch(
        `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${chapterDetail.content}`
      );
      const dataBuffer = new Uint8Array(await result.arrayBuffer());
      console.log("Data buffer:", dataBuffer);

      const decryptedFile = await decryptFile(dataBuffer, "123456");
      console.log("decryptedFile:", decryptedFile);
      const textContent = new TextDecoder().decode(decryptedFile);
      setContent(textContent);
      setIsPay(true);
    } catch (error) {
      errorToast(
        error instanceof Error ? error.message : "readWalrus is error"
      );
    }
  };
  const getContent = () => {
    return (
      <>
        {content ? (
          <div>
            <h1 className="text-2xl font-bold mt-4">{chapterDetail.title}</h1>
            <div className="mt-10">
              {content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div>loading...</div>
        )}
      </>
    );
  };
  return (
    <div>
      {isPay ? (
        getContent()
      ) : (
        <Button variant="default" className="cursor-pointer" onClick={payEvent}>
          充值 {chapterDetail.amount}MIST
        </Button>
      )}
    </div>
  );
}

export default Chapter;
