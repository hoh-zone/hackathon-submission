// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import React, { useState, useRef } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from './networkConfig';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Button, Flex, Spinner, Text, Box } from '@radix-ui/themes';
import { getAllowlistedKeyServers, SealClient } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';
import './EncryptAndUpload.css'; // 引入自定义样式

export type Data = {
  status: string;
  blobId: string;
  endEpoch: string;
  suiRefType: string;
  suiRef: string;
  suiBaseUrl: string;
  blobUrl: string;
  suiUrl: string;
  isImage: string;
};

interface WalrusUploadProps {
  policyObject: string;
  cap_id: string;
  moduleName: string;
}

type WalrusService = {
  id: string;
  name: string;
  publisherUrl: string;
  aggregatorUrl: string;
};

export function WalrusUpload({ policyObject, cap_id, moduleName }: WalrusUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<Data | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<string>('service1');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const SUI_VIEW_TX_URL = `https://suiscan.xyz/testnet/tx`;
  const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`;

  const NUM_EPOCH = 1;
  const packageId = useNetworkVariable('packageId');
  const suiClient = useSuiClient();
  const client = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers('testnet'),
    verifyKeyServers: false,
  });

  const services: WalrusService[] = [
    {
      id: 'service1',
      name: 'walrus.space',
      publisherUrl: '/publisher1',
      aggregatorUrl: '/aggregator1',
    },
    {
      id: 'service2',
      name: 'staketab.org',
      publisherUrl: '/publisher2',
      aggregatorUrl: '/aggregator2',
    },
    {
      id: 'service3',
      name: 'redundex.com',
      publisherUrl: '/publisher3',
      aggregatorUrl: '/aggregator3',
    },
    {
      id: 'service4',
      name: 'nodes.guru',
      publisherUrl: '/publisher4',
      aggregatorUrl: '/aggregator4',
    },
    {
      id: 'service5',
      name: 'banansen.dev',
      publisherUrl: '/publisher5',
      aggregatorUrl: '/aggregator5',
    },
    {
      id: 'service6',
      name: 'everstake.one',
      publisherUrl: '/publisher6',
      aggregatorUrl: '/aggregator6',
    },
  ];

  function getAggregatorUrl(path: string): string {
    const service = services.find((s) => s.id === selectedService);
    const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
    return `${service?.aggregatorUrl}/v1/${cleanPath}`;
  }

  function getPublisherUrl(path: string): string {
    const service = services.find((s) => s.id === selectedService);
    const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
    return `${service?.publisherUrl}/v1/${cleanPath}`;
  }

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    // Max 10 MiB size
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10 MiB');
      return;
    }
    // 更新文件类型限制，支持更多格式
    const allowedExtensions = ['.json', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.txt', '.md'];
    const fileExtension = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2); // Get file extension including the dot
    const isAllowedExtension = allowedExtensions.includes(`.${fileExtension.toLowerCase()}`);

    if (!isAllowedExtension) {
      alert('Only JSON, images (JPG, PNG, GIF, SVG), and text files (TXT, MD) are allowed');
      return;
    }
    setFile(file);
    setInfo(null); // Reset info when a new file is selected
  };

  const handleSubmit = () => {
    setIsUploading(true);
    if (file) {
      const reader = new FileReader();
      reader.onload = async function (event) {
        if (event.target && event.target.result) {
          const result = event.target.result;
          if (result instanceof ArrayBuffer) {
            const nonce = crypto.getRandomValues(new Uint8Array(5));
            const policyObjectBytes = fromHex(policyObject);
            const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));

            // 将文件类型与数据一起打包
            const dataWithType = {
              type: file.type,
              content: Array.from(new Uint8Array(result)) // 转换为数组以便JSON序列化
            };

            // 序列化数据包
            const serializedData = JSON.stringify(dataWithType);

            const { encryptedObject: encryptedBytes } = await client.encrypt({
              threshold: 2,
              packageId,
              id,
              data: new TextEncoder().encode(serializedData), // 加密序列化后的数据
            });

            const storageInfo = await storeBlob(encryptedBytes);
            displayUpload(storageInfo.info, file.type);
            setIsUploading(false);
          } else {
            console.error('Unexpected result type:', typeof result);
            setIsUploading(false);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error('No file selected');
    }
  };

  const displayUpload = (storage_info: any, media_type: any) => {
    let info;
    if ('alreadyCertified' in storage_info) {
      info = {
        status: 'Already certified',
        blobId: storage_info.alreadyCertified.blobId,
        endEpoch: storage_info.alreadyCertified.endEpoch,
        suiRefType: 'Previous Sui Certified Event',
        suiRef: storage_info.alreadyCertified.event.txDigest,
        suiBaseUrl: SUI_VIEW_TX_URL,
        blobUrl: getAggregatorUrl(`/v1/blobs/${storage_info.alreadyCertified.blobId}`),
        suiUrl: `${SUI_VIEW_OBJECT_URL}/${storage_info.alreadyCertified.event.txDigest}`,
        isImage: media_type.startsWith('image'),
      };
    } else if ('newlyCreated' in storage_info) {
      info = {
        status: 'Newly created',
        blobId: storage_info.newlyCreated.blobObject.blobId,
        endEpoch: storage_info.newlyCreated.blobObject.storage.endEpoch,
        suiRefType: 'Associated Sui Object',
        suiRef: storage_info.newlyCreated.blobObject.id,
        suiBaseUrl: SUI_VIEW_OBJECT_URL,
        blobUrl: getAggregatorUrl(`/v1/blobs/${storage_info.newlyCreated.blobObject.blobId}`),
        suiUrl: `${SUI_VIEW_OBJECT_URL}/${storage_info.newlyCreated.blobObject.id}`,
        isImage: media_type.startsWith('image'),
      };
    } else {
      throw Error('Unhandled successful response!');
    }
    setInfo(info);
  };

  const storeBlob = (encryptedData: Uint8Array) => {
    return fetch(`${getPublisherUrl(`/v1/blobs?epochs=${NUM_EPOCH}`)}`, {
      method: 'PUT',
      body: encryptedData,
    }).then((response) => {
      if (response.status === 200) {
        return response.json().then((info) => {
          return { info };
        });
      } else {
        alert('Error publishing the blob on Walrus, please select a different Walrus service.');
        setIsUploading(false);
        throw new Error('Something went wrong when storing the blob!');
      }
    });
  };

  async function handlePublish(wl_id: string, cap_id: string, moduleName: string) {
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${moduleName}::publish`,
      arguments: [tx.object(wl_id), tx.object(cap_id), tx.pure.string(info!.blobId)],
    });

    tx.setGasBudget(10000000);
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('res', result);
          alert('Blob attached successfully, now share the link or upload more.');
          // Reset state after successful publish
          setFile(null);
          setInfo(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear the file input
          }
        },
        onError: (error) => {
          console.error("Error publishing:", error);
          alert("Failed to associate file. Please try again.");
        }
      },
    );
  }

  return (
    <Box className="walrus-upload-container">
      <Flex direction="column" gap="4" align="stretch">
        <Flex direction="column" gap="3" className="step-section">
          <Text size="2" className="step-label">Step 1: Encrypt & Upload</Text>
          <Flex gap="3" align="center">
            <Text size="2" className="label-text">Select Walrus service:</Text>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              aria-label="Select Walrus service"
              className="custom-select"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </Flex>
          <label className={`custom-file-upload ${!!info ? 'disabled' : ''}`}>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".json,.jpg,.jpeg,.png,.gif,.svg,.txt,.md" // 更新接受的文件类型
              aria-label="Choose file to upload"
              disabled={!!info || isUploading}
            />
            <span className="upload-icon">💧</span>
            <span className="upload-text">{file ? file.name : 'Click or drag file here'}</span>
          </label>
          <Text size="1" className="hint-text">Max 10 MiB. Allowed types: JSON, images, and text files</Text>
          <Button
            onClick={handleSubmit}
            disabled={file === null || isUploading || !!info} // Keep disabled after successful upload (info is set)
            className="action-button primary-button"
            size="3"
          >
            {isUploading ? 'Uploading...' : 'Encrypt and Upload'}
            {isUploading && <Spinner size="2" className="button-spinner" />}
          </Button>
          {isUploading && (
            <Flex align="center" gap="2" className="upload-status">
              <Spinner className="water-spinner" aria-label="Uploading" />
              <Text size="2">Uploading to Walrus...</Text>
            </Flex>
          )}
        </Flex>
        {info && <hr className="divider" />}
        {info && file && (
          <Flex direction="column" gap="3" className="step-section">
            <Text size="2" className="step-label">Step 2: Associate File</Text>
            <Box className="upload-details" role="region" aria-label="Upload details">
              <Flex justify="between" align="center">
                <Text size="2">Status: {info.status}</Text>
                <Flex gap="3">
                  <a href={info.blobUrl} target="_blank" rel="noopener noreferrer" className="info-link" aria-label="View encrypted blob">Blob</a>
                  <a href={info.suiUrl} target="_blank" rel="noopener noreferrer" className="info-link" aria-label="View Sui object details">Sui Object</a>
                </Flex>
              </Flex>
              {info.isImage && file && (
                <img src={URL.createObjectURL(file)} alt="Preview" className="image-preview" />
              )}
            </Box>
            <Button
              onClick={() => handlePublish(policyObject, cap_id, moduleName)}
              disabled={!info || !file || policyObject === ''} // Keep existing disabled logic
              className="action-button secondary-button"
              size="3"
            >
              Associate File to Sui Object
            </Button>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

export default WalrusUpload;
