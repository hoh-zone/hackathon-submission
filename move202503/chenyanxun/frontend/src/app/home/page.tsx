"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariables } from "@/app/networkconfig";
import { IBook, IVaribales } from "@/type";
import { queryBooks } from "@/contracts";
import BookCard from "@/components/BookCard";
import { useWalrusBlob } from "@/hooks/useWalrusBlob";
import { useToast } from "@/hooks/useToast";
import { useZkproof } from "@/hooks/useZkproof";
function Home() {
  const router = useRouter();
  const account = localStorage.getItem("address");
  const { writeFileToWalrus } = useWalrusBlob();
  const { errorToast } = useToast();
  const { zktx } = useZkproof();
  const { packageID, module, stateID } = useNetworkVariables() as IVaribales;
  const [books, setBooks] = useState<IBook[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showWattingModal, setShowWattingModal] = useState(false);
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const goToBookDetail = (book: IBook) => {
    router.push(
      `/home/book/${book.id}?book=${encodeURIComponent(
        book.title
      )}&description=${book.description}&avatar=${book.avatar}`
    );
  };
  useEffect(() => {
    fetchData();
  }, [account]);
  const fetchData = async () => {
    if (!account) {
      errorToast("Account is undefined");
      return;
    }
    const books = await queryBooks(stateID, account);
    setBooks([...books]);
    console.log("books", books);
  };
  const deleteBook = async (book: IBook) => {
    if (!account) {
      errorToast("Account is undefined");
      return;
    }
    if (confirm("Are you sure delete this book?")) {
      setShowWattingModal(true);
      const tx = new Transaction();
      tx.moveCall({
        package: packageID,
        module: module,
        function: "delete_book",
        arguments: [tx.object(stateID), tx.object(book.id)],
      });
      const executeRes = await zktx(tx, account);
      console.log("executeRes===", executeRes);
      if (executeRes?.digest) {
        fetchData();
      }
      setShowWattingModal(false);
    } else {
      // 用户点击"取消"执行的代码
      console.log("操作已取消");
    }
  };
  const submitEvent = async () => {
    if (!title) {
      errorToast("Please enter a title");
      return;
    }
    if (!coverImage) {
      errorToast("Please upload a cover image");
      return;
    }
    if (!description) {
      errorToast("Please enter a description");
      return;
    }
    setShowWattingModal(true);
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
      const executeRes = await zktx(tx, account!);
      console.log("executeRes===", executeRes);
      if (executeRes?.digest) {
        setShowWattingModal(false);
        setTitle("");
        setCoverImage(null);
        setDescription("");
        setShowModal(false);
        fetchData();
      }
    } else {
      errorToast("walrus upload error");
      setShowWattingModal(false);
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
              deleteBook={deleteBook}
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
                      errorToast("File size must be less than 10 MiB");
                      return;
                    }
                    setCoverImage(file);
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
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

export default Home;
