import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { Button, Card, Flex, Text, Heading, Box, Link as RadixLink, Grid, Separator, Spinner } from '@radix-ui/themes';
import { getObjectExplorerLink } from './utils'; // Assuming you have this utility
import { ExternalLinkIcon } from '@radix-ui/react-icons';
import './global.css'; // Ensure global styles are imported
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { Link, useNavigate } from 'react-router-dom'; // <-- 添加此行

// Interface for the detailed service information we want to display
interface SubscribedSpaceItem {
    id: string; // Service ID
    fee: string;
    ttl: string;
    name: string;
    owner: string;
    subscribedAt: number; // Keep track of when subscription started
}

// Interface for the raw subscription object data
interface UserSubscription {
    id: string; // Subscription object ID
    service_id: string;
    created_at: number;
}

export function SubscribedSpaces() {
    const packageId = useNetworkVariable('packageId');
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const navigate = useNavigate();

    const [subscribedSpaces, setSubscribedSpaces] = useState<SubscribedSpaceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSubscribedSpaces() {
            if (!currentAccount?.address) {
                setIsLoading(false);
                setSubscribedSpaces([]);
                return;
            }
            setIsLoading(true);
            try {
                // 1. Get Clock object for current time
                const clock = await suiClient.getObject({
                    id: SUI_CLOCK_OBJECT_ID,
                    options: { showContent: true },
                });
                const currentTimeMs = Number((clock.data?.content as any)?.fields?.timestamp_ms || 0);

                // 2. Get all owned Subscription objects
                const res = await suiClient.getOwnedObjects({
                    owner: currentAccount.address,
                    options: { showContent: true, showType: true },
                    filter: { StructType: `${packageId}::subscription::Subscription` },
                });

                const userSubscriptions: UserSubscription[] = res.data
                    .map((obj) => {
                        const fields = (obj?.data?.content as any)?.fields;
                        if (fields?.id?.id && fields?.service_id && fields?.created_at) {
                            return {
                                id: fields.id.id,
                                service_id: fields.service_id,
                                created_at: parseInt(fields.created_at),
                            };
                        }
                        return null;
                    })
                    .filter((item): item is UserSubscription => item !== null);

                // 3. Fetch service details for each subscription and filter for validity
                const spaceDetailsPromises: Promise<SubscribedSpaceItem | null>[] = userSubscriptions.map(async (sub) => {
                    try {
                        const service = await suiClient.getObject({
                            id: sub.service_id,
                            options: { showContent: true },
                        });
                        const fields = (service.data?.content as any)?.fields;
                        if (!fields) return null;

                        const ttlMs = parseInt(fields.ttl);
                        // 4. Filter for valid subscriptions
                        if (sub.created_at + ttlMs > currentTimeMs) {
                            return {
                                id: sub.service_id,
                                fee: fields.fee,
                                ttl: fields.ttl,
                                owner: fields.owner,
                                name: fields.name || 'Unnamed Space',
                                subscribedAt: sub.created_at,
                            };
                        }
                        return null; // Subscription expired
                    } catch (error) {
                        console.error(`Failed to fetch service object ${sub.service_id}:`, error);
                        return null;
                    }
                });

                const resolvedSpaces = await Promise.all(spaceDetailsPromises);
                setSubscribedSpaces(resolvedSpaces.filter((item): item is SubscribedSpaceItem => item !== null));

            } catch (error) {
                console.error("Failed to fetch subscribed spaces:", error);
                setSubscribedSpaces([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSubscribedSpaces();
        const intervalId = setInterval(fetchSubscribedSpaces, 5000); // Refresh every 5 seconds

        return () => clearInterval(intervalId); // Cleanup interval
    }, [currentAccount?.address, packageId, suiClient]);

    // --- UI Rendering ---
    return (
        <Box>
            {/* 顶部导航栏 */}
            <Flex
                px="5"
                py="3"
                justify="between"
                align="center"
                style={{
                    background: 'rgba(26, 26, 46, 0.7)',
                    backdropFilter: 'blur(15px)',
                    borderBottom: '1px solid rgba(144, 224, 239, 0.3)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                }}
            >
                <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    style={{ color: '#ade8f4' }}
                >
                    Back to Home
                </Button>
                <Text size="5" weight="bold" style={{ color: '#ade8f4' }}>
                    My Subscriptions
                </Text>
                <div style={{ width: '100px' }} />
            </Flex>

            {/* 主要内容区域 */}
            <Box style={{ marginTop: '80px', padding: '20px' }}>
                <Heading size="8" mb="2" style={{ fontWeight: 700, color: 'var(--primary-text-color)' }}>
                    My Subscriptions
                </Heading>
                <Text size="4" mb="7" style={{ color: 'var(--secondary-text-color)' }}>
                    Spaces you have active subscriptions for.
                </Text>

                {isLoading ? (
                    <Flex justify="center" align="center" minHeight="300px">
                        <Spinner size="3" />
                        <Text ml="3" size="3" style={{ color: 'var(--secondary-text-color)' }}>Loading subscriptions...</Text>
                    </Flex>
                ) : subscribedSpaces.length > 0 ? (
                    <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="6">
                        {subscribedSpaces.map((item) => (
                            <Card key={item.id} className="water-card">
                                <Flex direction="column" gap="3">
                                    <Heading size="5" style={{ color: 'var(--primary-text-color)', fontWeight: 600 }}>
                                        {item.name || 'Unnamed Space'}
                                    </Heading>
                                    <Flex align="center" gap="2">
                                        <Text size="2" style={{ color: 'var(--secondary-text-color)' }}>ID:</Text>
                                        <RadixLink
                                            href={`https://testnet.suivision.xyz/object/${item.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="2"
                                            style={{ color: 'var(--interactive-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'color 0.3s ease' }}
                                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-aqua)'}
                                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--interactive-blue)'}
                                        >
                                            {`${item.id.substring(0, 6)}...${item.id.substring(item.id.length - 4)}`}
                                            <ExternalLinkIcon width="14" height="14" />
                                        </RadixLink>
                                    </Flex>
                                    <Separator size="4" my="3" style={{ background: 'var(--border-color)' }} />
                                    <Flex justify="between" align="center">
                                        <Text size="2" style={{ color: 'var(--secondary-text-color)' }}>Fee:</Text>
                                        <Text size="2" weight="medium" style={{ color: 'var(--primary-text-color)' }}>
                                            {item.fee ? `${parseInt(item.fee) / 1_000_000_000} SUI` : 'N/A'}
                                        </Text>
                                    </Flex>
                                    <Flex justify="between" align="center">
                                        <Text size="2" style={{ color: 'var(--secondary-text-color)' }}>Duration:</Text>
                                        <Text size="2" weight="medium" style={{ color: 'var(--primary-text-color)' }}>
                                            {item.ttl ? `${Math.round(parseInt(item.ttl) / 60000)} min` : 'N/A'}
                                        </Text>
                                    </Flex>
                                    {/* You might want a button to view the space */}
                                    <Button
                                        mt="4"
                                        className="water-button-primary"
                                        size="2"
                                        asChild // Use asChild to make the button act like a link
                                    >
                                        <Link to={`/view/space/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            View Space
                                        </Link>
                                    </Button>
                                </Flex>
                            </Card>
                        ))}
                    </Grid>
                ) : (
                    <Flex justify="center" align="center" style={{
                        minHeight: '300px',
                        border: `2px dashed var(--border-color)`,
                        borderRadius: 'var(--apple-border-radius)',
                        background: 'rgba(15, 23, 42, 0.5)',
                        backdropFilter: 'blur(5px)',
                    }}>
                        <Text size="3" style={{ color: 'var(--secondary-text-color)' }}>
                            You haven't subscribed to any spaces yet. Explore some!
                        </Text>
                    </Flex>
                )}
            </Box>
        </Box>
    );
}

export default SubscribedSpaces;