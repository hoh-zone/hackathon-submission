"use client";
import { suiClient, useNetworkVariables } from "@/app/networkconfig";
import ChapterCard from "@/components/ChapterCard";
import { Button } from "@/components/ui/button";
import { queryChapters } from "@/contracts";
import { UploadedBlobInfo, useWalrusBlob } from "@/hooks/useWalrusBlob";
import { IChapter, IVaribales } from "@/type";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/useToast";
function Book() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // 获取动态路由参数
  const searchParams = useSearchParams();
  const book = searchParams.get("book");
  const description = searchParams.get("description");
  const avatar = searchParams.get("avatar");
  const { writeFileToWalrus, writeFileToWalrusWithSeal } = useWalrusBlob();
  const { errorToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showWattingModal, setShowWattingModal] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
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
    router.push(`/home/book/chapter/${chapter.id}`);
  };
  const deleteChapter = (chapter: IChapter) => {
    if (confirm("Are you sure delete this chapter?")) {
      setShowWattingModal(true);
      const tx = new Transaction();
      tx.moveCall({
        package: packageID,
        module: module,
        function: "delete_chapter",
        arguments: [tx.object(chapter.book), tx.object(chapter.id)],
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
                setShowWattingModal(false);
                fetchData();
                console.log("Transaction success:", result);
              }
            }
          },
          onError: (err) => {
            console.log(err);
            setShowWattingModal(false);
          },
        }
      );
    } else {
      // 用户点击"取消"执行的代码
      console.log("操作已取消");
    }
  }
  const submitEvent = async () => {
    if (!title) {
      errorToast("Please enter a title");
      return;
    }
    if (!chapterFile) {
      errorToast("Please upload a cover image");
      return;
    }
    setShowWattingModal(true);
    let blobInfo: UploadedBlobInfo | undefined;
    if (price === 0) {
      blobInfo = await writeFileToWalrus(chapterFile);
      console.log("blobInfo====不加密", blobInfo);
    } else {
      blobInfo = await writeFileToWalrusWithSeal(
        chapterFile,
        packageID,
        id as string
      );
      console.log("blobInfo====加密", blobInfo);
    }
    if (blobInfo && blobInfo.blobId) {
      const tx = new Transaction();
      const latestObject = await suiClient.getObject({
        id: id as string,
        options: { showContent: true },
      });
      console.log("===latestObject", latestObject);
      tx.moveCall({
        package: packageID,
        module: module,
        function: "create_chapter",
        arguments: [
          tx.objectRef({
            objectId: latestObject.data?.objectId ?? "",
            version: latestObject.data?.version ?? "",
            digest: latestObject.data?.digest ?? ""
          }),
          // tx.object(`${latestObject.data?.objectId ?? ""}?version=${latestObject.data?.version ?? ""}`),
          tx.pure.string(title),
          tx.pure.string(blobInfo.blobId),
          tx.pure.u64(price),
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
                setShowWattingModal(false);
                setShowModal(false);
                setTitle("");
                setPrice(0);
                setChapterFile(null);
                fetchData();
                console.log("Transaction success:", result);
              }
            }
          },
          onError: (err) => {
            console.log(err);
            setShowWattingModal(false);
          },
        }
      );
    } else {
      setShowWattingModal(false);
    }
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
            deleteChapter={deleteChapter}
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
                  Price (MIST)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter book title"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Upload Chapter (TXT File)
                </label>
                <input
                  type="file"
                  className="w-full border rounded px-3 py-2"
                  accept=""
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
      {showWattingModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.1)]">
          <div className="p-6 rounded-lg w-96 flex flex-col items-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-500 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <h2 className="text-lg font-bold mb-2">Processing...</h2>
          </div>
        </div>
      )}
    </>
  );
}

export default Book;
