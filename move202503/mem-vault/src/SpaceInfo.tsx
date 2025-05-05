// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState, useCallback } from 'react';
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignPersonalMessage,
  useSuiClient,
} from '@mysten/dapp-kit';
import { useNetworkVariable } from './networkConfig';
import { AlertDialog, Button, Card, Dialog, Flex, Grid, Heading, Text, Box, Link as RadixLink, Separator, Spinner } from '@radix-ui/themes';
import { coinWithBalance, Transaction } from '@mysten/sui/transactions';
import { fromHex, SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { SealClient, SessionKey, getAllowlistedKeyServers } from '@mysten/seal';
import { useParams } from 'react-router-dom';
import { downloadAndDecrypt, getObjectExplorerLink, MoveCallConstructor } from './utils';
import { ExternalLinkIcon, GitHubLogoIcon, TwitterLogoIcon, GlobeIcon, InfoCircledIcon, LockClosedIcon, DownloadIcon } from '@radix-ui/react-icons';

const TTL_MIN = 10;
export interface FeedData {
  id: string;
  fee: string;
  ttl: string;
  owner: string;
  name: string;
  blobIds: string[];
  subscriptionId?: string;
}

const formatTtl = (ttlMs?: string): string => {
  if (!ttlMs) return 'N/A';
  const ttlNum = parseInt(ttlMs);
  if (isNaN(ttlNum) || ttlNum <= 0) return 'N/A';
  const minutes = Math.floor(ttlNum / 60 / 1000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
};

const formatFee = (feeMist?: string): string => {
  if (!feeMist) return 'N/A';
  const feeNum = parseInt(feeMist);
  if (isNaN(feeNum)) return 'N/A';
  const sui = feeNum / 1_000_000_000;
  return `${sui.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SUI`;
};

// 改进的组件，可以显示多种文件类型
const FileDisplay: React.FC<{ url: string; index: number }> = ({ url, index }) => {
  const [fileData, setFileData] = useState<any>(null);
  const [fileType, setFileType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 首先确定文件类型
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        setFileType(contentType);

        // 基于内容类型处理数据
        if (contentType.includes('application/json')) {
          const data = await response.json();
          setFileData(data);
        } else {
          // 对于其他类型，我们只存储URL
          setFileData(url);
        }
      } catch (e: any) {
        console.error("Failed to fetch or parse file:", e);
        setError(`Failed to load file: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFile();
  }, [url]);

  // 确定文件的扩展名
  const getFileExtension = () => {
    if (fileType.includes('image/')) return 'image';
    if (fileType.includes('application/json')) return 'json';
    if (fileType.includes('text/')) return 'txt';
    return 'file'; // 默认扩展名
  };

  const extension = getFileExtension();

  return (
    <Box my="1" p="3" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--deep-ocean-bg-secondary)' }}>
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Text weight="medium" style={{ color: 'var(--primary-text-color)' }}>File {index + 1}</Text>
          <Flex gap="2">
            <Button
              size="1"
              variant="soft"
              asChild
              style={{ cursor: 'pointer' }}
              className="water-button-soft"
            >
              <a href={url} download={`decrypted_file_${index + 1}.${extension}`}>
                Download {extension.toUpperCase()}
              </a>
            </Button>
            {extension === 'json' && (
              <Button
                size="1"
                variant="soft"
                asChild
                style={{ cursor: 'pointer' }}
                className="water-button-soft"
              >
                <a href="https://www.brainsdance.com/" target="_blank" rel="noopener noreferrer">
                  chat with JSON
                </a>
              </Button>
            )}
          </Flex>
        </Flex>
        <Separator size="4" my="1" style={{ background: 'var(--border-color-secondary)' }} />
        {isLoading && <Flex align="center" gap="2"><Spinner size="1" /><Text size="2" style={{ color: 'var(--secondary-text-color)' }}>Loading file...</Text></Flex>}
        {error && <Text size="2" color="tomato">{error}</Text>}
        {!isLoading && !error && (
          <>
            {fileType.includes('image/') && (
              <Box style={{ textAlign: 'center' }}>
                <img
                  src={url}
                  alt={`File ${index + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                />
              </Box>
            )}
            {fileType.includes('application/json') && (
              <pre style={{
                background: 'var(--code-bg)',
                padding: '10px',
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: 'var(--code-text-color)',
                fontSize: 'var(--font-size-1)'
              }}>
                <code>{JSON.stringify(fileData, null, 2)}</code>
              </pre>
            )}
            {fileType.includes('text/') && !fileType.includes('application/json') && (
              <pre style={{
                background: 'var(--code-bg)',
                padding: '10px',
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: 'var(--code-text-color)',
                fontSize: 'var(--font-size-1)'
              }}>
                <Text>{fileData}</Text>
              </pre>
            )}
            {!fileType.includes('image/') && !fileType.includes('application/json') && !fileType.includes('text/') && (
              <Flex align="center" justify="center" p="4">
                <Text size="2" style={{ color: 'var(--secondary-text-color)' }}>
                  File preview not available. Please download to view.
                </Text>
              </Flex>
            )}
          </>
        )}
      </Flex>
    </Box>
  );
};

const SpaceInfo: React.FC<{ suiAddress: string }> = ({ suiAddress }) => {
  const suiClient = useSuiClient();
  const { id } = useParams();

  const client = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers('testnet'),
    verifyKeyServers: false,
  });
  const [feed, setFeed] = useState<FeedData>();
  const [decryptedFileUrls, setDecryptedFileUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const packageId = useNetworkVariable('packageId');
  const currentAccount = useCurrentAccount();
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const { mutate: signPersonalMessage } = useSignPersonalMessage();
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

  useEffect(() => {
    getFeed();
    const intervalId = setInterval(() => {
      getFeed();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [id, suiAddress, packageId, suiClient]);

  async function getFeed() {
    try {
      const encryptedObjects = await suiClient
        .getDynamicFields({
          parentId: id!,
        })
        .then((res) => res.data.map((obj) => obj.name.value as string));

      const service = await suiClient.getObject({
        id: id!,
        options: { showContent: true },
      });
      const service_fields = (service.data?.content as { fields: any })?.fields || {};

      const res = await suiClient.getOwnedObjects({
        owner: suiAddress,
        options: {
          showContent: true,
          showType: true,
        },
        filter: {
          StructType: `${packageId}::subscription::Subscription`,
        },
      });

      const clock = await suiClient.getObject({
        id: '0x6',
        options: { showContent: true },
      });
      const fields = (clock.data?.content as { fields: any })?.fields || {};
      const current_ms = fields.timestamp_ms;

      const valid_subscription = res.data
        .map((obj) => {
          const fields = (obj!.data!.content as { fields: any }).fields;
          const x = {
            id: fields?.id.id,
            created_at: parseInt(fields?.created_at),
            service_id: fields?.service_id,
          };
          return x;
        })
        .filter((item) => item.service_id === service_fields.id.id)
        .find((item) => {
          return item.created_at + parseInt(service_fields.ttl) > current_ms;
        });

      const feedData = {
        ...service_fields,
        id: service_fields.id.id,
        blobIds: encryptedObjects,
        subscriptionId: valid_subscription?.id,
        name: service_fields.name || 'Unnamed Space',
        fee: service_fields.fee,
        ttl: service_fields.ttl,
        owner: service_fields.owner,
      } as FeedData;
      setFeed(feedData);
    } catch (err) {
      console.error("Failed to get feed:", err);
      setError("Failed to load space details. Please try again later.");
      setFeed(undefined);
    }
  }

  function constructMoveCall(
    packageId: string,
    serviceId: string,
    subscriptionId: string,
  ): MoveCallConstructor {
    return (tx: Transaction, id: string) => {
      tx.moveCall({
        target: `${packageId}::subscription::seal_approve`,
        arguments: [
          tx.pure.vector('u8', fromHex(id)),
          tx.object(subscriptionId),
          tx.object(serviceId),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
    };
  }

  async function handleSubscribe(serviceId: string, fee: number) {
    setIsLoadingAction(true);
    setError(null);
    const address = currentAccount?.address!;
    if (!address) {
      setError("Please connect your wallet first.");
      setIsLoadingAction(false);
      return;
    }
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.setSender(address);
    const subscription = tx.moveCall({
      target: `${packageId}::subscription::subscribe`,
      arguments: [
        coinWithBalance({
          balance: BigInt(fee),
        }),
        tx.object(serviceId),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    tx.moveCall({
      target: `${packageId}::subscription::transfer`,
      arguments: [tx.object(subscription), tx.pure.address(address)],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('Subscription successful:', result);
          await getFeed();
          setIsLoadingAction(false);
        },
        onError: (err) => {
          console.error("Subscription failed:", err);
          setError("Subscription transaction failed. Please check console and try again.");
          setIsLoadingAction(false);
        },
      },
    );
  }

  const onView = async (
    blobIds: string[],
    serviceId: string,
    fee: number,
    subscriptionId?: string,
  ) => {
    setError(null);
    if (!currentAccount?.address) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!subscriptionId) {
      const feeNum = Number(fee);
      if (isNaN(feeNum)) {
        setError('Invalid fee amount');
        return;
      }
      return handleSubscribe(serviceId, feeNum);
    }

    setIsLoadingAction(true);
    setIsDialogOpen(true);

    try {
      if (
        currentSessionKey &&
        !currentSessionKey.isExpired() &&
        currentSessionKey.getAddress() === suiAddress
      ) {
        const moveCallConstructor = constructMoveCall(packageId, serviceId, subscriptionId);
        await downloadAndDecrypt(
          blobIds,
          currentSessionKey,
          suiClient,
          client,
          moveCallConstructor,
          setError,
          setDecryptedFileUrls,
          setIsDialogOpen,
          setReloadKey,
        );
      } else {
        setCurrentSessionKey(null);
        const sessionKey = new SessionKey({
          address: suiAddress,
          packageId,
          ttlMin: TTL_MIN,
        });

        signPersonalMessage(
          {
            message: sessionKey.getPersonalMessage(),
          },
          {
            onSuccess: async (result) => {
              await sessionKey.setPersonalMessageSignature(result.signature);
              const moveCallConstructor = constructMoveCall(
                packageId,
                serviceId,
                subscriptionId,
              );
              await downloadAndDecrypt(
                blobIds,
                sessionKey,
                suiClient,
                client,
                moveCallConstructor,
                setError,
                setDecryptedFileUrls,
                setIsDialogOpen,
                setReloadKey,
              );
              setCurrentSessionKey(sessionKey);
            },
            onError: (err) => {
              console.error("Personal message signing failed:", err);
              setError("Failed to sign message. Please try again.");
              setIsDialogOpen(false);
            },
          },
        );
      }
    } catch (error: any) {
      console.error('Error during onView:', error);
      setError(`An unexpected error occurred: ${error.message || error}`);
      setIsDialogOpen(false);
    } finally {
      if (!(currentSessionKey && !currentSessionKey.isExpired() && currentSessionKey.getAddress() === suiAddress)) {
      } else {
        setIsLoadingAction(false);
      }
    }
  };

  const renderTopSection = () => (
    <Box mb="6">
      <Grid columns={{ initial: '1', md: '2' }} gap="6" width="auto">
        <Card className="water-card" p="5">
          <Flex direction="column" gap="3">
            <Heading size="7" style={{ color: 'var(--primary-text-color)' }}>{feed!.name}</Heading>
            <RadixLink
              href={getObjectExplorerLink(feed!.id)}
              target="_blank"
              rel="noopener noreferrer"
              size="2"
              style={{ color: 'var(--secondary-text-color)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              ID: {`${feed!.id.substring(0, 8)}...${feed!.id.substring(feed!.id.length - 6)}`}
              <ExternalLinkIcon />
            </RadixLink>
            <Separator size="4" my="3" style={{ background: 'var(--border-color)' }} />
            <Flex justify="between" align="center">
              <Text size="3" style={{ color: 'var(--secondary-text-color)' }}>Subscription Fee:</Text>
              <Text size="3" weight="medium" style={{ color: 'var(--primary-text-color)' }}>{formatFee(feed!.fee)}</Text>
            </Flex>
            <Flex justify="between" align="center">
              <Text size="3" style={{ color: 'var(--secondary-text-color)' }}>Access Duration:</Text>
              <Text size="3" weight="medium" style={{ color: 'var(--primary-text-color)' }}>{formatTtl(feed!.ttl)}</Text>
            </Flex>
            <Flex justify="between" align="center">
              <Text size="3" style={{ color: 'var(--secondary-text-color)' }}>Owner:</Text>
              <RadixLink
                href={getObjectExplorerLink(feed!.owner)}
                target="_blank"
                rel="noopener noreferrer"
                size="2"
                style={{ color: 'var(--interactive-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                {`${feed!.owner.substring(0, 8)}...${feed!.owner.substring(feed!.owner.length - 6)}`}
                <ExternalLinkIcon />
              </RadixLink>
            </Flex>
          </Flex>
        </Card>
        <Card className="water-card" p="5">
          <Flex direction="column" gap="4">
            <Heading size="5" style={{ color: 'var(--primary-text-color)' }}>Connect</Heading>
            <Separator size="4" my="2" style={{ background: 'var(--border-color)' }} />
            <Flex align="center" gap="3">
              <TwitterLogoIcon color="var(--interactive-blue)" width="20" height="20" />
              <RadixLink href="#" target="_blank" size="3" style={{ color: 'var(--primary-text-color)' }}>Twitter</RadixLink>
            </Flex>
            <Flex align="center" gap="3">
              <GitHubLogoIcon color="var(--interactive-blue)" width="20" height="20" />
              <RadixLink href="#" target="_blank" size="3" style={{ color: 'var(--primary-text-color)' }}>GitHub</RadixLink>
            </Flex>
            <Flex align="center" gap="3">
              <GlobeIcon color="var(--interactive-blue)" width="20" height="20" />
              <RadixLink href="#" target="_blank" size="3" style={{ color: 'var(--primary-text-color)' }}>Website</RadixLink>
            </Flex>
            <Text size="2" color="gray" mt="2">
              (Creator's social links - placeholders)
            </Text>
          </Flex>
        </Card>
      </Grid>
    </Box>
  );

  const renderFilesSection = () => (
    <Card className="water-card" p="5" key={feed!.id}>
      <Heading size="5" mb="4" style={{ color: 'var(--primary-text-color)' }}>
        Space Content
      </Heading>
      <Flex direction="column" gap="4">
        {feed!.blobIds.length === 0 ? (
          <Flex align="center" gap="2" p="4" style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--apple-border-radius)' }}>
            <InfoCircledIcon color="var(--secondary-text-color)" />
            <Text size="3" style={{ color: 'var(--secondary-text-color)' }}>This space is currently empty. Check back later for content!</Text>
          </Flex>
        ) : (
          <Dialog.Root open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              decryptedFileUrls.forEach(url => URL.revokeObjectURL(url));
              setDecryptedFileUrls([]);
              setError(null);
              setIsLoadingAction(false);
            }
          }}>
            <Flex justify="start">
              <Dialog.Trigger>
                <Button
                  size="3"
                  className="water-button-primary"
                  onClick={() => onView(feed!.blobIds, feed!.id, Number(feed!.fee), feed!.subscriptionId)}
                  disabled={isLoadingAction}
                >
                  {isLoadingAction ? (
                    <Spinner size="2" />
                  ) : feed!.subscriptionId ? (
                    <>
                      <DownloadIcon style={{ marginRight: '8px' }} /> Download & Decrypt Files
                    </>
                  ) : (
                    <>
                      <LockClosedIcon style={{ marginRight: '8px' }} /> Subscribe
                    </>
                  )}
                </Button>
              </Dialog.Trigger>
            </Flex>
            <Dialog.Content
              style={{
                background: 'var(--midnight-blue-bg)',
                borderRadius: 'var(--apple-border-radius)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                maxWidth: '80vw',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column'
              }}
              key={reloadKey}
            >
              <Dialog.Title asChild>
                <Heading size="5" style={{ color: 'var(--primary-text-color)', flexShrink: 0 }}>
                  {error ? "Error" : (decryptedFileUrls.length > 0 ? "Retrieved Files" : "Processing...")}
                </Heading>
              </Dialog.Title>
              <Separator size="4" my="3" style={{ background: 'var(--border-color)', flexShrink: 0 }} />
              <Box style={{ overflowY: 'auto', flexGrow: 1 }}>
                {isLoadingAction && decryptedFileUrls.length === 0 && !error && (
                  <Flex direction="column" align="center" justify="center" gap="3" minHeight="150px">
                    <Spinner size="3" />
                    <Text size="3" style={{ color: 'var(--secondary-text-color)' }}>
                      {currentSessionKey ? "Decrypting content..." : "Preparing secure session..."}
                    </Text>
                  </Flex>
                )}
                {error && (
                  <Text size="3" style={{ color: 'var(--tomato-11)' }}>
                    {error}
                  </Text>
                )}
                {!isLoadingAction && decryptedFileUrls.length > 0 && !error && (
                  <Flex direction="column" gap="3">
                    {decryptedFileUrls.map((decryptedFileUrl, index) => (
                      <FileDisplay key={index} url={decryptedFileUrl} index={index} />
                    ))}
                  </Flex>
                )}
              </Box>
              <Flex gap="3" mt="4" justify="end" style={{ flexShrink: 0 }}>
                <Dialog.Close>
                  <Button variant="soft" className="water-button-soft">
                    Close
                  </Button>
                </Dialog.Close>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        )}
      </Flex>
    </Card>
  );

  return (
    <Box p={{ initial: '3', sm: '4', md: '6' }} style={{ background: 'var(--deep-ocean-bg)', minHeight: '100vh' }}>
      {feed === undefined && !error ? (
        <Card className="water-card" p="5">
          <Flex align="center" justify="center" gap="3" minHeight="200px">
            <Spinner size="3" />
            <Text size="4" style={{ color: 'var(--secondary-text-color)' }}>Loading space details...</Text>
          </Flex>
        </Card>
      ) : feed ? (
        <Flex direction="column" gap="6">
          {renderTopSection()}
          {renderFilesSection()}
        </Flex>
      ) : null}
      <AlertDialog.Root open={!!error && !isDialogOpen} onOpenChange={() => setError(null)}>
        <AlertDialog.Content style={{ background: 'var(--midnight-blue-bg)', borderRadius: 'var(--apple-border-radius)', border: '1px solid var(--border-color)' }}>
          <AlertDialog.Title asChild>
            <Heading size="5" style={{ color: 'var(--tomato-11)' }}>Error</Heading>
          </AlertDialog.Title>
          <Separator size="4" my="3" style={{ background: 'var(--border-color)' }} />
          <AlertDialog.Description size="3" style={{ color: 'var(--primary-text-color)' }}>
            {error}
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Action>
              <Button variant="soft" className="water-button-soft" onClick={() => setError(null)}>
                Close
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
};

export default SpaceInfo;