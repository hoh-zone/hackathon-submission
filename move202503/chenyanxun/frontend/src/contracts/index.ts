import { suiClient } from "@/app/networkconfig";
import { IBook, IChapter } from "@/type";
export const queryBooks = async (id: string, accountID: string) => {
  const { data } = await suiClient.getObject({
    id: id,
    options: {
      showContent: true,
    },
  });
  const content = data?.content as {
    dataType: string;
    fields?: {
      id: { id: string };
      books: string[];
    };
  };
  if (!content.fields?.books) {
    return [];
  }
  const book_objects = await suiClient.multiGetObjects({
    ids: content.fields?.books,
    options: {
      showContent: true,
    },
  });
  const books_result: IBook[] = book_objects
    .map((book) => {
      if (!book.data?.content) {
        throw new Error("Library content not found");
      }
      const book_detail = book.data.content as unknown as {
        dataType: string;
        fields: {
          id: { id: string };
          title: string;
          avatar: string;
          owner: string;
          description: string;
          chapters: string[];
        };
      };
      return {
        id: book_detail.fields?.id.id,
        title: book_detail.fields?.title,
        avatar: book_detail.fields?.avatar,
        description: book_detail.fields.description,
        owner: book_detail.fields?.owner,
        chapters: book_detail.fields?.chapters,
      };
    })
    .filter((book) => (accountID ? book.owner === accountID : true));
  return books_result;
};

export const queryChapters = async (id: string) => {
  const { data } = await suiClient.getObject({
    id: id,
    options: {
      showContent: true,
    },
  });
  const content = data?.content as {
    dataType: string;
    fields?: {
      id: { id: string };
      chapters: string[];
    };
  };
  if (!content.fields?.chapters) {
    return [];
  }
  const chapter_objects = await suiClient.multiGetObjects({
    ids: content.fields?.chapters,
    options: {
      showContent: true,
    },
  });
  const chapters_result: IChapter[] = chapter_objects.map((chapter) => {
    if (!chapter.data?.content) {
      throw new Error("Library content not found");
    }
    const chapter_detail = chapter.data.content as unknown as {
      dataType: string;
      fields: {
        id: { id: string };
        title: string;
        owner: string;
        content: string;
      };
    };
    return {
      id: chapter_detail.fields?.id.id,
      title: chapter_detail.fields?.title,
      owner: chapter_detail.fields?.owner,
      content: chapter_detail.fields?.content,
    };
  });
  return chapters_result;
};
