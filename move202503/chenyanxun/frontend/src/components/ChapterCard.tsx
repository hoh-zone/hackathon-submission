import { IChapterProps } from "@/type";
import { Button } from "./ui/button";

export default function CharterCard({
  chapters,
  goToChapterDetail,
  deleteChapter,
}: IChapterProps) {
  return (
    <>
      <div className="divide-y divide-gray-300">
        {chapters.map((chapter) => {
          return (
            <div
              className="py-2 flex justify-between items-center cursor-pointer"
              key={chapter.id}
              onClick={() => goToChapterDetail(chapter)}
            >
              <span className="text-lg">{chapter.title}</span>
              <div>
                <span>{chapter.amount} MIST</span>
                {deleteChapter && (
                  <Button
                    variant="default"
                    size="sm"
                    className="ml-4 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChapter(chapter);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
