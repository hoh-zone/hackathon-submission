import { GithubType, resData } from '../interface';
import request from '../request';

/* **** */
export const getUserList = (searchName: string) =>
  request<resData<GithubType>>({
    url: `/api/search/users?q=${searchName}`,
    method: 'get',
  });
