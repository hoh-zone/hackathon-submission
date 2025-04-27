"use client";
import { suiClient, useNetworkVariables } from "@/app/networkconfig";
import ChapterCard from "@/components/ChapterCard";
import { Button } from "@/components/ui/button";
import { queryChapters } from "@/contracts";
import { useWalrusBlob } from "@/hooks/useWalrusBlob";
import { IChapter, IVaribales } from "@/type";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
function Book() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // 获取动态路由参数
  const searchParams = useSearchParams();
  const book = searchParams.get("book");
  const description = searchParams.get("description");
  const avatar = searchParams.get("avatar");
  const { writeFileToWalrus } = useWalrusBlob();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [chapterFile, setChapterFile] = useState<File | null>(null);
  const { packageID, module } = useNetworkVariables() as IVaribales;
  const [chapters, setChapters] = useState<IChapter[]>([]);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  useEffect(() => {
    fetchData();
  }, []);
  async function fetchData() {
    const chapters = await queryChapters(id as string);
    setChapters([...chapters]);
    console.log("chapters", chapters);
  }
  const goToChapterDetail = (chapter: IChapter) => {
    router.push(
      `/home/book/chapter/${chapter.id}?chapter=${encodeURIComponent(
        chapter.title
      )}&blobId=${chapter.content}`
    );
  };
  const submitEvent = async () => {
    if (!title) {
      alert("Please enter a title");
      return;
    }
    if (!chapterFile) {
      alert("Please upload a cover image");
      return;
    }

    const blobInfo = await writeFileToWalrus(chapterFile);
    console.log("blobInfo====", blobInfo);
    const tx = new Transaction();
    tx.moveCall({
      package: packageID,
      module: module,
      function: "create_chapter",
      arguments: [
        tx.object(id as string),
        tx.pure.string(title),
        tx.pure.string(blobInfo!.blobId),
      ],
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
              fetchData();
              console.log("Transaction success:", result);
            }
          }
        },
        onError: (err) => {
          console.log(err);
        },
      }
    );

    setShowModal(false);
  };
  return (
    <>
      <div className="flex">
        {/* Left Section */}
        <div className="flex-2 p-5">
          <h2 className="text-xl font-semibold mb-4">Chapters</h2>
          <ChapterCard
            chapters={chapters}
            goToChapterDetail={goToChapterDetail}
          />
        </div>
        {/* Right Section */}
        <div className="flex-1 p-5">
          <Button
            variant="default"
            className="cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            Create Chapter
          </Button>
          <h1 className="text-2xl font-bold mt-4">{book}</h1>
          <p className="mt-2 mb-2 text-gray-600">
            {description || "no description"}
          </p>
          <Image
            src={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${avatar}`}
            alt="Book Cover"
            width={300}
            height={400}
          />
        </div>
      </div>
      {/* 创建chapter弹窗 */}
      <div>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)]">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-lg font-bold mb-4">Create Chapter</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter book title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Upload Chapter (TXT File)
                </label>
                <input
                  type="file"
                  className="w-full border rounded px-3 py-2"
                  accept=".txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setChapterFile(file);
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="default"
                  onClick={() => setShowModal(false)}
                  className="mr-2 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="cursor-pointer"
                  onClick={submitEvent}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Book;
