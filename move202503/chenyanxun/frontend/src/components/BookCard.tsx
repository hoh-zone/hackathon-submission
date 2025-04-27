import { Card, CardContent, CardTitle } from "./ui/card";
import Image from "next/image";
import { IbookProps } from "@/type";
function BookCard({ book, goToBookDetail }: IbookProps) {
  return (
    <>
      <Card
        key={book.id}
        className="cursor-pointer flex flex-row"
        onClick={() => goToBookDetail(book)}
      >
        <CardContent className="flex justify-between">
          <Image
            src={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${book.avatar}`}
            alt="Photo by Drew Beamer"
            width={150}
            height={200}
          />
          <div className="flex flex-col justify-between p-4 pr-0">
            <CardTitle className="text-lg font-bold line-clamp-3">
              {book.title}
            </CardTitle>
            <div className="text-sm text-gray-600 line-clamp-4">
              {book.description || "No description available."}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
export default BookCard;
