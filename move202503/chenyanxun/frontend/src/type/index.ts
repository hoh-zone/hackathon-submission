export interface IVaribales {
  packageID: string;
  module: string;
  stateID: string;
  coinPool: string;
  admin: string;
}
export interface IBook {
  id: string;
  title: string;
  avatar: string;
  description: string;
  owner: string;
  chapters: string[];
}

export interface IChapter {
  id: string;
  owner: string;
  book: string;
  title: string;
  amount: string;
  content: string;
  allowlist_id: string;
}

export interface IChapterAllowlist {
  id: string;
  chapter_id: string;
  amount: string;
  owner: string;
  allowlist: string[];
}

export interface IbookProps {
  book: IBook;
  goToBookDetail: (book: IBook) => void;
  deleteBook?: (book: IBook) => void;
}
export interface IChapterProps {
  chapters: IChapter[];
  goToChapterDetail: (chapter: IChapter) => void;
  deleteChapter?: (chapter: IChapter) => void;
}
