// src/utils.ts
import { provider, PACKAGE_ID, Address } from './suiClient';
import { fromBcs, getMovePackage, getObjectFields, parseRawHandle } from '@mysten/sui/client';

export interface AuditReport {
  objectId: string;
  version: number;
  codeHash: string;
  resultSummary: string;
}

export async function fetchAuditReports(owner: Address): Promise<AuditReport[]> {
  // 1. 拿到所有归属于当前地址的对象
  const { data } = await provider.getOwnedObjects({ owner });
  // 2. 过滤出 ReportStore::AuditReport 类型
  const reportObjs = data.filter(o =>
    o.type === `${PACKAGE_ID}::ReportStore::AuditReport`
  );
  if (reportObjs.length === 0) return [];

  // 3. 批量查询它们的详情
  const ids = reportObjs.map(o => o.objectId);
  const details = await provider.getObjectBatch(ids, { showContent: true });
  
  // 4. 解析 fields
  return details
    .filter(o => 'data' in o && o.data?.content?.type === `${PACKAGE_ID}::ReportStore::AuditReport`)
    .map(o => {
      const fields = o.data!.content!.fields as any;
      return {
        objectId: o.data!.objectId,
        version: o.data!.version,
        codeHash: fields.code_hash as string,
        resultSummary: fields.result_summary as string,
      } satisfies AuditReport;
    });
}

