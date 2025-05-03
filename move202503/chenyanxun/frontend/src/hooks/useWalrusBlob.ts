import { sealClient } from "@/app/networkconfig";
import { useToast } from "./useToast";
export interface UploadedBlobInfo {
  blobId: string;
  endEpoch: number;
  suiRef: string;
  status: string;
}

export function useWalrusBlob() {
  const { errorToast } = useToast();
  /**
   * 不加密
   * @param File
   * @returns
   */
  const writeFileToWalrus = async (File: File) => {
    try {
      const formData = new FormData();
      formData.append("file", File);
      const response = await fetch("/api/writeBlob", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        errorToast("Failed to fetch blob data");
        return;
      }
      const result = await response.json();
      const data = result.data;
      console.log("Blob data:", data);

      let blobInfo: UploadedBlobInfo;
      if ("alreadyCertified" in data) {
        blobInfo = {
          status: "Already certified",
          blobId: data.alreadyCertified.blobId,
          endEpoch: data.alreadyCertified.endEpoch,
          suiRef: data.alreadyCertified.event.txDigest,
        };
      } else if ("newlyCreated" in data) {
        blobInfo = {
          status: "Newly created",
          blobId: data.newlyCreated.blobObject.blobId,
          endEpoch: data.newlyCreated.blobObject.storage.endEpoch,
          suiRef: data.newlyCreated.blobObject.id,
        };
      } else {
        errorToast("Unexpected response format");
        throw new Error("Unexpected response format");
      }
      return blobInfo;
    } catch (error) {
      errorToast("Error in storeBlob");
      throw error;
    }
  };
  /**
   * 用seal加密
   * @param File
   * @returns
   */
  const writeFileToWalrusWithSeal = async (
    File: File,
    packageId: string,
    encryptId: string
  ) => {
    try {
      const encryptedData = new Uint8Array(await File.arrayBuffer());
      const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
        threshold: 2,
        packageId,
        id: encryptId,
        data: encryptedData,
      });
      const base64Data = Buffer.from(encryptedBytes).toString("base64");
      const response = await fetch(
        `/api/writeBlobWithSeal?data=${encodeURIComponent(base64Data)}`
      );
      console.log("===response", response);
      if (!response.ok) {
        errorToast("Failed to fetch blob data");
        return;
      }
      const result = await response.json();
      console.log("result===", result);
      const data = result.data;
      console.log("Blob data:", data);
      let blobInfo: UploadedBlobInfo;
      if ("alreadyCertified" in data) {
        blobInfo = {
          status: "Already certified",
          blobId: data.alreadyCertified.blobId,
          endEpoch: data.alreadyCertified.endEpoch,
          suiRef: data.alreadyCertified.event.txDigest,
        };
      } else if ("newlyCreated" in data) {
        blobInfo = {
          status: "Newly created",
          blobId: data.newlyCreated.blobObject.blobId,
          endEpoch: data.newlyCreated.blobObject.storage.endEpoch,
          suiRef: data.newlyCreated.blobObject.id,
        };
      } else {
        errorToast("Unexpected response format");
        throw new Error("Unexpected response format");
      }
      return blobInfo;
    } catch (error) {
      errorToast("Error in storeBlob");
      throw error;
    }
  };
  return {
    writeFileToWalrus,
    writeFileToWalrusWithSeal,
  };
}
