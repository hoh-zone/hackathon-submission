// filepath: /Users/yushenli/Documents/my_code/mem_front/src/SpaceScroll.tsx
import React, { useState, useEffect } from 'react';
import { Box, Avatar, Flex, Text, Heading, Grid, Card, Spinner } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useNetworkVariable } from './networkConfig';

// --- 主题颜色定义 ---
const deepOceanBlack = '#020817'; // 深邃的海洋黑
const midnightBlue = '#0f172a';   // 午夜蓝，用于卡片背景
const aquaGlow = '#00f5ff';       // 水色辉光，用于强调和悬停效果
const skyBlueText = '#bae6fd';    // 天蓝色文本
const frostWhite = '#f8fafc';     // 霜白色，用于标题
const transparentBlueBg = 'rgba(14, 165, 233, 0.1)'; // 透明蓝色背景
const waveBorder = 'rgba(56, 189, 248, 0.3)';     // 波浪边框色

// --- 接口定义 ---
interface OwnedSpaceData {
    id: string;
    name: string;
    fee: string;
    ttl: string;
    owner: string;
    avatarUrl: string;
}

interface Cap {
    id: string;
    service_id: string;
}

// --- 更新头像生成函数 ---
const generateAvatarUrl = (id: string): string => {
    const seed = encodeURIComponent(id);
    return `https://api.dicebear.com/8.x/rings/svg?seed=${seed}&backgroundColor=0f172a,020817&backgroundType=gradientLinear&ringColor=00f5ff,bae6fd`;
};

// --- 更新分类和示例头像 ---
const categories = [
    {
        name: 'Founders\' Reef',
        description: 'Innovators charting new courses in the digital ocean.',
        avatars: [
            generateAvatarUrl('founder1'), generateAvatarUrl('founder2'), generateAvatarUrl('founder3'), generateAvatarUrl('founder4')
        ],
    },
    {
        name: 'Influencer Currents',
        description: 'Creators making waves and connecting communities across the sea.',
        avatars: [
            generateAvatarUrl('influencer1'), generateAvatarUrl('influencer2'), generateAvatarUrl('influencer3'), generateAvatarUrl('influencer4')
        ],
    },
    {
        name: 'Investor Depths',
        description: 'Venturing into deep waters to fund promising voyages.',
        avatars: [
            generateAvatarUrl('investor1'), generateAvatarUrl('investor2'), generateAvatarUrl('investor3'), generateAvatarUrl('investor4')
        ],
    },
    {
        name: 'Designer Lagoons',
        description: 'Crafting serene and beautiful user experiences like calm lagoons.',
        avatars: [
            generateAvatarUrl('designer1'), generateAvatarUrl('designer2'), generateAvatarUrl('designer3'), generateAvatarUrl('designer4')
        ],
    },
    {
        name: 'Developer Trenches',
        description: 'Building the foundations of the digital ocean, layer by layer.',
        avatars: [
            generateAvatarUrl('developer1'), generateAvatarUrl('developer2'), generateAvatarUrl('developer3'), generateAvatarUrl('developer4')
        ],
    },
];

// --- 组件主体 ---
const SpaceScroll: React.FC<{ id?: string }> = ({ id }) => {
    const [ownedSpaces, setOwnedSpaces] = useState<OwnedSpaceData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const packageId = useNetworkVariable('packageId');

    useEffect(() => {
        async function fetchOwnedSpaces() {
            if (!currentAccount?.address || !packageId) {
                setOwnedSpaces([]);
                return;
            }
            setIsLoading(true);
            try {
                const res = await suiClient.getOwnedObjects({
                    owner: currentAccount.address,
                    options: { showContent: true, showType: true },
                    filter: { StructType: `${packageId}::subscription::Cap` },
                });
                const caps = res.data
                    .map((obj) => {
                        const fields = (obj?.data?.content as any)?.fields;
                        if (fields?.id?.id && fields?.service_id) {
                            return { id: fields.id.id, service_id: fields.service_id };
                        }
                        return null;
                    })
                    .filter((item): item is Cap => item !== null);

                const spaceDetailsPromises = caps.map(async (cap) => {
                    try {
                        const service = await suiClient.getObject({
                            id: cap.service_id,
                            options: { showContent: true },
                        });
                        const fields = (service.data?.content as any)?.fields;
                        if (fields) {
                            return {
                                id: cap.service_id,
                                fee: fields.fee,
                                ttl: fields.ttl,
                                owner: fields.owner,
                                name: fields.name,
                                avatarUrl: generateAvatarUrl(cap.service_id),
                            };
                        }
                    } catch (error) {
                        console.error(`Failed to fetch details for service ${cap.service_id}:`, error);
                    }
                    return null;
                });
                const resolvedSpaces = await Promise.all(spaceDetailsPromises);
                const validSpaces = resolvedSpaces.filter((item): item is OwnedSpaceData => item !== null);
                setOwnedSpaces(validSpaces);
            } catch (error) {
                console.error("Failed to fetch owned spaces:", error);
                setOwnedSpaces([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchOwnedSpaces();
    }, [currentAccount?.address, suiClient, packageId]);

    return (
        <Box id={id}
            style={{
                padding: 'var(--space-6) var(--space-4)',
                background: `linear-gradient(180deg, ${deepOceanBlack} 0%, ${midnightBlue} 100%)`,
                color: skyBlueText,
                borderRadius: 'var(--radius-4)',
                minHeight: '80vh',
                width: '100%'
            }}>
            <Grid columns="1" gap="8">

                {/* --- 我的空间 (如果登录) --- */}
                {currentAccount && (
                    <Box>
                        <Heading size="6" mb="4" style={{ color: frostWhite, borderLeft: `4px solid ${aquaGlow}`, paddingLeft: 'var(--space-3)' }}>
                            My Submerged Spaces
                        </Heading>
                        {isLoading ? (
                            <Flex justify="center" align="center" p="6">
                                <Spinner size="3" />
                                <Text ml="3" color="gray">Loading your spaces...</Text>
                            </Flex>
                        ) : ownedSpaces.length > 0 ? (
                            <Grid columns={{ initial: '1', sm: '2', md: '3', lg: '4' }} gap="5">
                                {ownedSpaces.map((space) => (
                                    <Link
                                        key={space.id}
                                        to={`/subscription-example/view/service/${space.id}`}
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <Card style={{
                                            background: transparentBlueBg,
                                            border: `1px solid ${waveBorder}`,
                                            height: '100%',
                                            transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 15px rgba(0, 245, 255, 0.1)',
                                        }}
                                            className="space-card"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = `0 8px 25px rgba(0, 245, 255, 0.3)`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 245, 255, 0.1)';
                                            }}
                                        >
                                            <Flex direction="column" gap="3" align="center" p="3">
                                                <Avatar
                                                    src={space.avatarUrl}
                                                    fallback={space.name?.charAt(0)?.toUpperCase() || 'O'}
                                                    size="5"
                                                    radius="full"
                                                    style={{ border: `2px solid ${aquaGlow}` }}
                                                />
                                                <Box textAlign="center">
                                                    <Heading size="4" mb="1" style={{ color: frostWhite }}>
                                                        {space.name || 'Unnamed Depth'}
                                                    </Heading>
                                                    <Text size="2" style={{ color: skyBlueText, opacity: 0.8 }}>
                                                        {space.fee} MIST | TTL: {space.ttl ? `${Math.floor(parseInt(space.ttl) / 60000)} min` : '∞'}
                                                    </Text>
                                                </Box>
                                            </Flex>
                                        </Card>
                                    </Link>
                                ))}
                            </Grid>
                        ) : (
                            <Flex justify="center" p="5" style={{ background: transparentBlueBg, border: `1px dashed ${waveBorder}`, borderRadius: 'var(--radius-3)' }}>
                                <Text color="gray">You haven't explored any spaces yet. Create one!</Text>
                            </Flex>
                        )}
                    </Box>
                )}

                {/* --- 探索分类 --- */}
                <Box mt={currentAccount ? "8" : "0"}>
                    <Heading size="6" mb="4" style={{ color: frostWhite, borderLeft: `4px solid ${aquaGlow}`, paddingLeft: 'var(--space-3)' }}>
                        Discover Oceanic Zones
                    </Heading>
                    <Grid columns="1" gap="5">
                        {categories.map((category, catIndex) => (
                            <Box key={catIndex} p="5" style={{
                                background: midnightBlue,
                                border: `1px solid ${waveBorder}`,
                                borderRadius: 'var(--radius-3)',
                                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
                            }}>
                                <Heading size="4" mb="2" style={{ color: frostWhite }}>{category.name}</Heading>
                                <Text size="2" style={{ color: skyBlueText, opacity: 0.8 }} mb="4" display="block">
                                    {category.description}
                                </Text>
                                <Flex gap="3" wrap="wrap">
                                    {category.avatars.map((src, index) => (
                                        <Avatar
                                            key={`${catIndex}-${index}`}
                                            src={src}
                                            fallback={`Zone${catIndex}`}
                                            size="3"
                                            radius="full"
                                            style={{ border: `1px solid ${transparentBlueBg}` }}
                                        />
                                    ))}
                                </Flex>
                            </Box>
                        ))}
                    </Grid>
                </Box>
            </Grid>
        </Box>
    );
};

export default SpaceScroll;