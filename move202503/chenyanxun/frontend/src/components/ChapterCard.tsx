import { IChapterProps } from "@/type";

export default function CharterCard({
  chapters,
  goToChapterDetail,
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
            </div>
          );
        })}
      </div>
    </>
  );
}
