export interface resData<T> {
  success?: boolean;
  data: T;
  code: number;
  message: string;
}

/** ****** */
export type UserType = { [props: string]: string | number | boolean };
/** github** */
export type GithubType = {
  total_count: number;
  items: UserType[];
  incomplete_results: boolean;
};
