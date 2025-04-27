import { StoreInfoForParese, StoreInfo, DAppInfo } from "@/types";
import { currentNetConfig, suiClient } from "@/utils/sui"
import { SuiParsedData } from "@mysten/sui/client";

const loadStoreInfo = async () => {
  const response = await suiClient.getObject({
    id: currentNetConfig.storeInfo,
    options: {
      showContent: true,
    }
  });
  if (!response.data?.content) {
    throw new Error("Object content not found!");
  }
  const parseResult = response.data.content as SuiParsedData;
  if (!('fields' in parseResult)) {
    throw new Error("Invalid DAppInfo not found!");
  }
  const parsedObj = parseResult.fields as StoreInfoForParese;

  const promises = parsedObj.dApps.map(obj => loadDappInfo(obj));
  const dAppArray = await Promise.all(promises);

  const result: StoreInfo = {
    admins: parsedObj.admins,
    dApps: dAppArray,
  };
  return result;
}

const loadDappInfo = async (dappObj: string) => {
  const response = await suiClient.getObject({
    id: dappObj,
    options: {
      showContent: true,
    }
  });
  if (!response.data?.content) {
    throw new Error("Object content not found!");
  }
  const parseResult = response.data.content as SuiParsedData;
  if (!('fields' in parseResult)) {
    throw new Error("Invalid DAppInfo not found!");
  }
  const parsedObj = parseResult.fields as DAppInfo;
  return parsedObj;
}

export { loadStoreInfo }