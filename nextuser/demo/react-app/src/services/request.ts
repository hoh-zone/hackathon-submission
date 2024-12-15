import axios, { ResDataType } from './ajax';

export async function getData(id: string): Promise<ResDataType> {
  const url = `/v1/api/xxx/${id}`
  const data = (await axios.get(url)) as ResDataType
  return data
}




