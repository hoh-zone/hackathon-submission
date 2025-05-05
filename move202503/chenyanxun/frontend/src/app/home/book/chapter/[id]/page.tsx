"use client";
import {
  sealClient,
  suiClient,
  useNetworkVariables,
} from "@/app/networkconfig";
import { queryChapterDetail } from "@/contracts";
import { IChapter, IVaribales } from "@/type";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function Chapter() {
  const [isPay, setIsPay] = useState(false);
  const [chapterDetail, setChapterDetail] = useState<IChapter>({} as IChapter);
  const [content, setContent] = useState("");
  const currentAccount = useCurrentAccount();
  const params = useParams();
  const { id } = params; // 获取动态路由参数
  const { packageID, module } = useNetworkVariables() as IVaribales;
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  useEffect(() => {
    if (typeof id === "string") {
      getChapterDetail(id);
      async function getChapterDetail(id: string) {
        const result = await queryChapterDetail(id);
        console.log("chapterdetail===", result);
        setChapterDetail(result);
      }
    }
  }, [id]);
  useEffect(() => {
    if (Number(chapterDetail.amount) === 0) {
      // 未加密
      fetchData();
      async function fetchData() {
        const result = await fetch(
          `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${chapterDetail.content}`
        );
        const data = await result.text();
        setContent(data);
        setIsPay(true);
      }
    } else {
      // 加密
      if(chapterDetail.content) {
        getTxtContent();
      }
    }
  }, [chapterDetail]);

  const constructTxBytes = async (tx: Transaction) => {
    try{
      tx.moveCall({
        target: `${packageID}::${module}::seal_approve`,
        arguments: [tx.pure.vector("u8", fromHex(chapterDetail.book))],
      });
      return await tx.build({ client: suiClient, onlyTransactionKind: true });
    }catch(err) {
      console.log("==err", err)
    }
  };
  // 解密
  const getTxtContent = async () => {
    const tx = new Transaction();
    const txBytes = await constructTxBytes(tx);
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
        <h1 className="text-2xl font-bold mt-4">{chapterDetail.title}</h1>
        <div className="mt-10">
          {content.split("\n").map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </>
    );
  };
  return <div>{isPay ? getContent() : <div>loading...</div>}</div>;
}

export default Chapter;
