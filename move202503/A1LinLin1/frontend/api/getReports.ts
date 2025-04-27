// src/api/getReports.ts
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// 查询特定 address 拥有的所有 AuditReport 对象
export async function getAuditReportsByOwner(ownerAddress: string) {
  const objects = await client.getOwnedObjects({
    owner: ownerAddress,
    filter: {
      StructType:
        '0xf8ef5aa78daa393b1d58301c7924d85074c0656d269ba92b17d0d03c5dce684d::ReportStore::AuditReport',
    },
    options: {
      showContent: true,
    },
  });

  return objects.data;
}

