export interface IVaribales {
  packageID: string;
  module: string;
  stateID: string;
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
  title: string;
  owner: string;
  content: string;
}

export interface IbookProps {
  book: IBook;
  goToBookDetail: (book: IBook) => void;
}
export interface IChapterProps {
  chapters: IChapter[];
  goToChapterDetail: (chapter: IChapter) => void;
}
