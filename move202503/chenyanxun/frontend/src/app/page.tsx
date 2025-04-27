"use client";
import { queryBooks } from "@/contracts";
import { IBook, IVaribales } from "@/type";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useNetworkVariables } from "./networkconfig";
import BookCard from "@/components/BookCard";
export default function Index() {
  const [books, setBooks] = useState<IBook[]>([]);
  const { stateID } = useNetworkVariables() as IVaribales;
  const router = useRouter();
  const goToBookDetail = (book:IBook) => {
    router.push(`/book/${book.id}?book=${book.title}&description=${book.description}&avatar=${book.avatar}`);
  };

  useEffect(() => {
    fetchData();
  }, []);
  async function fetchData() {
    const books = await queryBooks(stateID, "");
    setBooks([...books]);
    console.log("books", books);
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {books.map((book) => (
          <BookCard book={book} key={book.id} goToBookDetail={goToBookDetail} />
        ))}
      </div>
    </>
  );
}
