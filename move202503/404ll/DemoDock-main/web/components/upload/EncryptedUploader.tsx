import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@radix-ui/themes";
import { Check } from "lucide-react";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import { useSuiClient } from "@mysten/dapp-kit";
import {getEncryptedObject,SUI_VIEW_OBJECT_URL} from "@/contracts/query"

interface BlobInfo {
  fileName: string;
  blobId: string;
  suiUrl: string;
}

interface EncryptedUploaderProps {
  policyObject: string;
  onUploadComplete?: (results: BlobInfo[]) => void;
}

const services = [
  { id: "service1", name: "walrus.space", publisherUrl: "/publisher1", aggregatorUrl: "/aggregator1" },
  { id: "service2", name: "staketab.org", publisherUrl: "/publisher2", aggregatorUrl: "/aggregator2" },
  { id: "service3", name: "redundex.com", publisherUrl: "/publisher3", aggregatorUrl: "/aggregator3" },
  { id: "service4", name: "nodes.guru", publisherUrl: "/publisher4", aggregatorUrl: "/aggregator4" },
  { id: "service5", name: "banansen.dev", publisherUrl: "/publisher5", aggregatorUrl: "/aggregator5" },
  { id: "service6", name: "everstake.one", publisherUrl: "/publisher6", aggregatorUrl: "/aggregator6" },
];

export default function EncryptedUploader({ policyObject, onUploadComplete }: EncryptedUploaderProps) {

  const [selectedService, setSelectedService] = useState(services[0].id);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [infos, setInfos] = useState<BlobInfo[]>([]);


  const getPublisherUrl = (path: string) => {
    const srv = services.find((s) => s.id === selectedService);
    const cleanPath = path.replace(/^\/+/g, '').replace(/^v1\//, '');
    return `${srv?.publisherUrl}/v1/${cleanPath}`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    const valid = selected.filter((file) => file.size <= 100 * 1024 * 1024);
    if (valid.length !== selected.length) {
      alert("部分文件超过 100MB，已被忽略。");
    }
    setFiles(valid);
  };

  const uploadAllFiles = async () => {
    setUploading(true);
    const results: BlobInfo[] = [];
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const nonce = crypto.getRandomValues(new Uint8Array(5));
        const policyObjectBytes = fromHex(policyObject);
        const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
        
        // 修改这里：添加 await 关键字
        const encryptedObject = await getEncryptedObject(id, arrayBuffer);
        const response = await fetch(getPublisherUrl(`/v1/blobs?epochs=1`), {
          method: "PUT",
          body: encryptedObject,
        });
        
        if (response.status !== 200) throw new Error("Walrus 上传失败");
        const { info } = await response.json();
        const blobId = info.newlyCreated?.blobObject.blobId || info.alreadyCertified?.blobId;
        const suiUrl = info.newlyCreated?.blobObject.id
          ? `${SUI_VIEW_OBJECT_URL}/${info.newlyCreated.blobObject.id}`
          : "";
        results.push({ fileName: file.name, blobId, suiUrl });
      } catch (e) {
        console.error("文件上传错误", e);
      }
    }
    setInfos(results);
    setUploading(false);
    onUploadComplete?.(results);
  };

  return (
    <div className="space-y-4">
      <Label>选择 Walrus 服务</Label>
      <select
        value={selectedService}
        onChange={(e) => setSelectedService(e.target.value)}
        className="border p-2 rounded w-full"
      >
        {services.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <Label>上传文件（支持任意类型，最大 100MB）</Label>
      <input type="file"  onChange={handleFileSelect} />
      <Button onClick={uploadAllFiles} disabled={files.length === 0}>上传并加密</Button>

      {uploading && (
        <div className="flex items-center gap-2 mt-2">
          <Spinner className="animate-spin" aria-label="正在上传" />
          <span>正在上传加密文件...</span>
        </div>
      )}

      {infos.length > 0 && (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">上传成功</AlertTitle>
          <AlertDescription>
            已上传 {infos.length} 个文件。
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}