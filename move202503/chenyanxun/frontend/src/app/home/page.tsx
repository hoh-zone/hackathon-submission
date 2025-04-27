"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { suiClient, useNetworkVariables } from "@/app/networkconfig";
import { IBook, IVaribales } from "@/type";
import { queryBooks } from "@/contracts";
import BookCard from "@/components/BookCard";
import { useWalrusBlob } from "@/hooks/useWalrusBlob";
function Home() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { writeFileToWalrus } = useWalrusBlob();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { packageID, module, stateID } = useNetworkVariables() as IVaribales;
  const [books, setBooks] = useState<IBook[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const goToBookDetail = (book: IBook) => {
    router.push(
      `/home/book/${book.id}?book=${encodeURIComponent(book.title)}&description=${
        book.description
      }&avatar=${book.avatar}`
    );
  };
  useEffect(() => {
    fetchData();
  }, [account?.address]);
  async function fetchData() {
    if (!account?.address) {
      console.error("Account address is undefined");
      return;
    }
    const books = await queryBooks(stateID, account.address);
    setBooks([...books]);
    console.log("books", books);
  }

  const submitEvent = async () => {
    if (!title) {
      alert("Please enter a title");
      return;
    }
    if (!coverImage) {
      alert("Please upload a cover image");
      return;
    }
    if (!description) {
      alert("Please enter a description");
      return;
    }
    const blobInfo = await writeFileToWalrus(coverImage);
    console.log(blobInfo);
    if (blobInfo && blobInfo.blobId) {
      const tx = new Transaction();
      tx.moveCall({
        package: packageID,
        module: module,
        function: "create_book",
        arguments: [
          tx.object(stateID),
          tx.pure.string(title),
          tx.pure.string(blobInfo.blobId),
          tx.pure.string(description),
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
      setTitle("");
      setCoverImage(null);
      setDescription("");
      setShowModal(false);
    }
  };
  return (
    <>
      <div className="flex items-center justify-between border-b pb-2">
        <div className="font-bold">My Books</div>
        <Button
          variant="default"
          className="cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          Create Book
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-4 pt-4 pb-4">
        {books.map((book) => {
          return (
            <BookCard
              book={book}
              key={book.id}
              goToBookDetail={goToBookDetail}
            />
          );
        })}
      </div>
      {/* 创建book弹窗 */}
      <div>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)]">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-lg font-bold mb-4">Create Book</h2>
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
                  Cover Image
                </label>
                <input
                  type="file"
                  className="w-full border rounded px-3 py-2"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    // Max 10 MiB size
                    if (file && file.size > 10 * 1024 * 1024) {
                      alert("File size must be less than 10 MiB");
                      return;
                    }
                    setCoverImage(file);
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter book description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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

export default Home;
