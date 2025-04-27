export interface UploadedBlobInfo {
  blobId: string;
  endEpoch: number;
  suiRef: string;
  status: string;
}

export function useWalrusBlob() {
  const writeFileToWalrus = async (File: File) => {
    try {
      const formData = new FormData();
      formData.append("file", File);

      const response = await fetch("/api/writeBlob", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Failed to fetch blob data");
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
        throw new Error("Unexpected response format");
      }
      return blobInfo;
    } catch (error) {
      console.error("Error in storeBlob:", error);
      throw error;
    }
  };
  return {
    writeFileToWalrus
  };
}
