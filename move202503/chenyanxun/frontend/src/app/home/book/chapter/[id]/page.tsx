"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function Chapter() {
  const [content, setContent] = useState("");
  const searchParams = useSearchParams();
  const chapter = searchParams.get("chapter") as string;
  const blobId = searchParams.get("blobId") as string;
  useEffect(() => {
    fetchData();
    async function fetchData() {
      const result = await fetch(
        `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`
      );
      const data = await result.text();
      setContent(data);
    }
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold mt-4">{chapter}</h1>
      <div className="mt-10">
        {content.split("\n").map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    </>
  );
}

export default Chapter;
