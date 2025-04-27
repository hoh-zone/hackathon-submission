"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IChapter } from "@/type";
import { queryChapters } from "@/contracts";
import ChapterCard from "@/components/ChapterCard";
import Image from "next/image";
export default function Book() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // 获取动态路由参数
  const searchParams = useSearchParams();
  const book = searchParams.get("book");
  const description = searchParams.get("description");
  const avatar = searchParams.get("avatar");
  const [chapters, setChapters] = useState<IChapter[]>([]);
  useEffect(() => {
    fetchData();
  }, []);
  async function fetchData() {
    const chapters = await queryChapters(id as string);
    setChapters([...chapters]);
    console.log("chapters", chapters);
  }
  const goToChapterDetail = (chapter: IChapter) => {
    router.push(`/chapter/${chapter.id}?chapter=${chapter.title}&blobId=${chapter.content}`)
  }
  return (
    <>
      <div className="flex">
        {/* Left Section */}
        <div className="flex-2 p-5">
          <h2 className="text-xl font-semibold mb-4">Chapters</h2>
          <ChapterCard chapters={chapters} goToChapterDetail={goToChapterDetail}/>
        </div>
        {/* Right Section */}
        <div className="flex-1 p-5">
          <h1 className="text-2xl font-bold mt-4">{book}</h1>
          <p className="mt-2 mb-2 text-gray-600">
            {description || "no description"}
          </p>
          <Image src={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${avatar}`} alt="Book Cover" width={300} height={400} />
        </div>
      </div>
    </>
  );
}
