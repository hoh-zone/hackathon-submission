"use client";
import { queryChapterDetail } from "@/contracts";
import { useCrypto } from "@/hooks/useCrypto";
import { useToast } from "@/hooks/useToast";
import { IChapter } from "@/type";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
function Chapter() {
  const [isPay, setIsPay] = useState(false);
  const [chapterDetail, setChapterDetail] = useState<IChapter>({} as IChapter);
  const [content, setContent] = useState("");
  const params = useParams();
  const { id } = params; // 获取动态路由参数
  const { decryptFile } = useCrypto();
  const { errorToast } = useToast();
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
      // 加密
      getTxtContent();
    }
  }, [chapterDetail]);

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
