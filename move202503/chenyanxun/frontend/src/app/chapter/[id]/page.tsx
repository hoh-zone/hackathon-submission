"use client";
import {
  sealClient,
  suiClient,
  useNetworkVariables,
} from "@/app/networkconfig";
import { Button } from "@/components/ui/button";
import {
  queryBalance,
  queryChapterAllowlist,
  queryChapterDetail,
} from "@/contracts";
import { useToast } from "@/hooks/useToast";
import { IChapter, IChapterAllowlist, IVaribales } from "@/type";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignPersonalMessage,
} from "@mysten/dapp-kit";
import { SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function Chapter() {
  const [isPay, setIsPay] = useState(false);
  const [chapterDetail, setChapterDetail] = useState<IChapter>({} as IChapter);
  const [chapterAllowlist, setChapterAllowlist] = useState<IChapterAllowlist>(
    {} as IChapterAllowlist
  );
  const [content, setContent] = useState("");
  const currentAccount = useCurrentAccount();
  const params = useParams();
  const { errorToast } = useToast();
  const { id } = params; // 获取动态路由参数
  const { packageID, module } = useNetworkVariables() as IVaribales;
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
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
        const result = await fetch(
          `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${chapterDetail.content}`
        );
        const data = await result.text();
        setContent(data);
      }
    } else {
      // 已支付或者是上传者，直接解密
      if (
        chapterAllowlist.allowlist?.includes(currentAccount?.address ?? "") ||
        chapterDetail.owner === currentAccount?.address
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
    if (!currentAccount) {
      errorToast("Current account is null");
      return;
    }
    const balance = await queryBalance(currentAccount.address);
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
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (res) => {
          if (res.digest) {
            const result = await suiClient.waitForTransaction({
              digest: res.digest,
              options: { showEffects: true, showEvents: true },
            });
            if (result.effects?.status.status === "success") {
              getTxtContent();
              console.log("Transaction success:", result);
            }
          }
        },
        onError: (err) => {
          console.log(err);
        },
      }
    );
  };
  const constructTxBytes = async () => {
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageID}::${module}::seal_approve`,
      arguments: [tx.pure.vector("u8", fromHex(chapterDetail.book))],
    });
    return await tx.build({ client: suiClient, onlyTransactionKind: true });
  };
  // 解密
  const getTxtContent = async () => {
    const txBytes = await constructTxBytes();
    const sessionKey = new SessionKey({
      address: currentAccount?.address ?? "",
      packageId: packageID,
      ttlMin: 10,
    });
    const result = await fetch(
      `/api/readBlobWithSeal/${chapterDetail.content}`
    );
    if (!result.ok) {
      throw new Error("Network response was not ok");
    }
    const dataBuffer = new Uint8Array(await result.arrayBuffer());
    console.log("Data buffer:", dataBuffer);
    signPersonalMessage(
      {
        message: sessionKey.getPersonalMessage(),
      },
      {
        onSuccess: async (res) => {
          sessionKey.setPersonalMessageSignature(res.signature);
          try {
            const decryptedFile = await sealClient.decrypt({
              data: dataBuffer,
              sessionKey,
              txBytes,
            });
            console.log("decryptedFile:", decryptedFile);
            const textContent = new TextDecoder().decode(decryptedFile);
            setContent(textContent);
            setIsPay(true);
          } catch (err) {
            if (
              err instanceof TypeError &&
              err.message.includes("Unknown value")
            ) {
              console.error("Unsupported encryption type:", err);
            } else {
              console.error("Decryption error:", err);
            }
          }
        },
      }
    );
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
        <Button variant="default" onClick={payEvent}>
          充值 {chapterDetail.amount}MIST
        </Button>
      )}
    </div>
  );
}

export default Chapter;
