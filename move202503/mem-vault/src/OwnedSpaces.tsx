// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
// 用到了，是创建的全部space

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { useNetworkVariable } from './networkConfig';
// 导入更多 Radix 组件以实现更丰富的布局和样式
import { Button, Card, Flex, Text, Heading, Box, Link as RadixLink, Grid, Separator } from '@radix-ui/themes';
import { getObjectExplorerLink } from './utils';
import { ExternalLinkIcon } from '@radix-ui/react-icons'; // 导入图标
import './global.css'; // 确保全局样式已导入
import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface Cap {
  id: string;
  service_id: string;
}

export interface CardItem {
  id: string;
  fee: string;
  ttl: string;
  name: string;
  owner: string;
}

// --- 移除局部调色板，将依赖全局 CSS 变量 ---

export const OwnedSpaces = () => {
  const packageId = useNetworkVariable('packageId');
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const navigate = useNavigate();

  const [cardItems, setCardItems] = useState<CardItem[]>([]);

  useEffect(() => {
    async function getCapObj() {
      if (!currentAccount?.address) return; // 如果没有地址则提前返回

      // get all owned cap objects
      const res = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: {
          showContent: true,
          showType: true,
        },
        filter: {
          StructType: `${packageId}::subscription::Cap`,
        },
      });
      const caps = res.data
        .map((obj) => {
          const fields = (obj?.data?.content as { fields: any })?.fields;
          if (!fields) return null; // 添加检查以防 fields 未定义
          return {
            id: fields.id.id,
            service_id: fields.service_id,
          };
        })
        .filter((item): item is Cap => item !== null); // 使用类型谓词进行过滤

      // get all services of all the owned cap objects
      const cardItemsPromises: Promise<CardItem | null>[] = caps.map(async (cap) => {
        try {
          const service = await suiClient.getObject({
            id: cap.service_id,
            options: { showContent: true },
          });
          const fields = (service.data?.content as { fields: any })?.fields;
          if (!fields) return null; // 添加检查
          return {
            id: cap.service_id,
            fee: fields.fee,
            ttl: fields.ttl,
            owner: fields.owner,
            name: fields.name,
          };
        } catch (error) {
          console.error(`Failed to fetch service object ${cap.service_id}:`, error);
          return null; // 处理获取对象失败的情况
        }
      });

      const resolvedCardItems = await Promise.all(cardItemsPromises);
      setCardItems(resolvedCardItems.filter((item): item is CardItem => item !== null)); // 过滤掉 null 值
    }

    // Call getCapObj immediately
    getCapObj();

    // Set up interval to call getCapObj every 5 seconds
    const intervalId = setInterval(() => {
      getCapObj();
    }, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
    // 依赖项中包含 packageId 和 suiClient，以确保在它们更改时重新运行
  }, [currentAccount?.address, packageId, suiClient]);

  // --- UI 渲染 (Apple + Water Theme) ---
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
          My Spaces
        </Text>
        <div style={{ width: '100px' }} />
      </Flex>

      {/* 主要内容区域 */}
      <Box style={{ marginTop: '80px', padding: '20px' }}>
        <Heading size="8" mb="2" style={{ fontWeight: 700, color: 'var(--primary-text-color)' }}>
          My Spaces
        </Heading>
        <Text size="4" mb="7" style={{ color: 'var(--secondary-text-color)' }}>
          Dive into your digital realms. Manage content and oversee your creations.
        </Text>

        {cardItems.length > 0 ? (
          <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="6"> {/* 增加卡片间距 */}
            {cardItems.map((item) => (
              // 应用全局 .water-card 样式，它包含了背景、边框、圆角、阴影和悬停效果
              <Card key={item.id} className="water-card">
                <Flex direction="column" gap="3"> {/* 调整内部间距 */}
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
                      // 使用全局交互蓝色，悬停时变为水蓝色
                      style={{
                        color: 'var(--interactive-blue)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'color 0.3s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-aqua)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--interactive-blue)'}
                    >
                      {`${item.id.substring(0, 6)}...${item.id.substring(item.id.length - 4)}`}
                      <ExternalLinkIcon width="14" height="14" />
                    </RadixLink>
                  </Flex>

                  {/* 使用更精细的分隔线 */}
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

                  {/* 应用全局主按钮样式 */}
                  <Button
                    mt="4" // 增加按钮与上方内容的间距
                    className="water-button-primary" // 使用全局样式
                    size="2" // 调整按钮大小
                    onClick={() => {
                      window.open(
                        `${window.location.origin}/admin/space/${item.id}`,
                        '_blank',
                      );
                    }}
                  >
                    Manage Space
                  </Button>
                </Flex>
              </Card>
            ))}
          </Grid>
        ) : (
          <Flex justify="center" align="center" style={{
            minHeight: '300px',
            border: `2px dashed var(--border-color)`, // 使用虚线边框和全局边框色
            borderRadius: 'var(--apple-border-radius)', // 使用全局圆角
            background: 'rgba(15, 23, 42, 0.5)', // 半透明背景
            backdropFilter: 'blur(5px)', // 添加轻微模糊效果
          }}>
            <Text size="3" style={{ color: 'var(--secondary-text-color)' }}>
              You haven't created any spaces yet. Start your journey!
            </Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
};
