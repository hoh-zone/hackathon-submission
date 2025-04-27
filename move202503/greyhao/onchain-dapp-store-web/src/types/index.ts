
export type StoreInfoForParese = {
  admins: string[],
  dApps: string[],
}

export type DAppInfo = {
  id: { id: string },
  approve_admins: string[],
  reject_admins: string[],
  desc: string,
  icon: string,
  name: string,
  submit_address: string,
  submit_timestamp: string,
  url: string,
}

export type StoreInfo = {
  admins: string[],
  dApps: DAppInfo[],
}
