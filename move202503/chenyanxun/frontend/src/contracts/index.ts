import { suiClient } from "@/app/networkconfig";
import { IBook, IChapter, IChapterAllowlist } from "@/type";
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
        book: string;
        owner: string;
        amount: string;
        content: string;
        allowlist_id: string;
      };
    };
    return {
      id: chapter_detail.fields?.id.id,
      book: chapter_detail.fields?.book,
      title: chapter_detail.fields?.title,
      owner: chapter_detail.fields?.owner,
      amount: chapter_detail.fields?.amount,
      content: chapter_detail.fields?.content,
      allowlist_id: chapter_detail.fields?.allowlist_id,
    };
  });
  return chapters_result;
};

export const queryChapterDetail = async (id: string) => {
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
      allowlist_id: string;
      amount: string;
      book: string;
      content: string;
      owner: string;
      title: string;
    };
  };

  const chapters_result: IChapter = {
    id: content.fields?.id.id ?? "",
    book: content.fields?.book ?? "",
    title: content.fields?.title ?? "",
    owner: content.fields?.owner ?? "",
    amount: content.fields?.amount ?? "",
    content: content.fields?.content ?? "",
    allowlist_id: content.fields?.allowlist_id ?? "",
  };
  return chapters_result;
};

export const queryChapterAllowlist = async (id: string) => {
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
      chapter_id: string;
      amount: string;
      owner: string;
      allowlist: string[];
    };
  };

  const chapters_result: IChapterAllowlist = {
    id: content.fields?.id.id ?? "",
    chapter_id: content.fields?.chapter_id ?? "",
    amount: content.fields?.amount ?? "",
    owner: content.fields?.owner ?? "",
    allowlist: content.fields?.allowlist ?? [],
  };
  return chapters_result;
}
// query all coin
export const queryAllCoin = async (address: string) => {
  let cursor: string | null | undefined = null;
  let hasNextPage = true;
  const coinArr = [];
  while (hasNextPage) {
    const coinObjects = await suiClient.getCoins({
      owner: address,
      coinType: "0x2::sui::SUI",
      cursor,
      limit: 50,
    });
    if (!coinObjects?.data) {
      break;
    }
    hasNextPage = coinObjects.hasNextPage;
    cursor = coinObjects.nextCursor;
    coinArr.push(...coinObjects.data);
  }
  return coinArr;
};
// 查询coin balance
export const queryBalance = async (address: string) => {
  const result = await suiClient.getBalance({
    owner: address,
  });
  return result;
};