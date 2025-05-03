import { Card, CardContent, CardTitle } from "./ui/card";
import Image from "next/image";
import { IbookProps } from "@/type";
import { Button } from "./ui/button";
function BookCard({ book, goToBookDetail, deleteBook }: IbookProps) {
  return (
    <>
      <Card
        key={book.id}
        className="cursor-pointer flex flex-row"
        onClick={() => goToBookDetail(book)}
      >
        <CardContent className="w-full flex justify-between relative">
          <Image
            src={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${book.avatar}`}
            alt="Photo by Drew Beamer"
            width={150}
            height={200}
            priority={true}
          />
          <div className="flex-1 flex flex-col justify-start p-4 pr-0">
            <CardTitle className="text-lg font-bold line-clamp-3">
              {book.title}
            </CardTitle>
            <div className="text-sm text-gray-600 mt-2">
              Serialized in {book.chapters.length} chapters
            </div>
            <div className="text-sm text-gray-600 mt-2 line-clamp-4">
              {book.description || "No description available."}
            </div>
            {deleteBook && (
                <Button
                variant="default"
                size="sm"
                className="absolute bottom-0 right-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBook(book);
                }}
                >
                Delete
                </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
export default BookCard;
