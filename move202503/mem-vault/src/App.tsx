// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Box, Button, Flex, Grid, Heading, Card, Text } from '@radix-ui/themes';

import WalrusUpload from './EncryptAndUpload';
import { useState } from 'react';
import { CreateSpace } from './CreateSpace';
import SpaceInfo from './SpaceInfo';
import { ManageSpace } from './ManageSpace';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import SubscribedSpaces from './SubscribedSpaces';
import { OwnedSpaces } from './OwnedSpaces';
import SpaceScroll from './SpaceScroll';
import './global.css'; // 引入全局样式

function LandingPage() {
  const handleExploreClick = () => {
    const exploreSection = document.getElementById('explore-section');
    if (exploreSection) {
      exploreSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); // 滚动到顶部
    }
  };

  return (
    // 使用单列布局，让卡片更突出
    <Grid columns={{ initial: '1', md: '2' }} gap="6">
      {/* 创建空间卡片 */}
      <Card className="water-card" style={{ padding: 'var(--space-6)' }}> {/* 应用卡片样式并增加内边距 */}
        <Flex direction="column" gap="4" align="center" style={{ textAlign: 'center' }}>
          <Heading size="6" style={{ color: 'var(--primary-text-color)', fontWeight: 600 }}>
            Create Your Space
          </Heading>
          <Text size="3" style={{ color: 'var(--secondary-text-color)', maxWidth: '400px' }}>
            Dive into creation. Forge your unique digital space to share exclusive content, protected within the depths of Mem vault.
          </Text>
          <Link to="/subscription-example">
            {/* 应用新的主按钮样式 */}
            <Button size="3" className="water-button-primary" mt="3">Create Space</Button>
          </Link>
        </Flex>
      </Card>

      {/* 探索空间卡片 */}
      <Card className="water-card" style={{ padding: 'var(--space-6)' }}>
        <Flex direction="column" gap="4" align="center" style={{ textAlign: 'center' }}>
          <Heading size="6" style={{ color: 'var(--primary-text-color)', fontWeight: 600 }}>
            Explore the Depths
          </Heading>
          <Text size="3" style={{ color: 'var(--secondary-text-color)', maxWidth: '400px' }}>
            Navigate the currents of creativity. Discover diverse spaces and connect with creators across the Mem vault ocean.
          </Text>
          {/* 应用新的软按钮样式 */}
          <Button size="3" onClick={handleExploreClick} className="water-button-soft" mt="3">Explore Spaces</Button>
        </Flex>
      </Card>
    </Grid>
  );
}

function App() {
  const currentAccount = useCurrentAccount();
  const [recipientAllowlist, setRecipientAllowlist] = useState<string>('');
  const [capId, setCapId] = useState<string>('');
  return (
    <Box style={{ backgroundColor: 'var(--deep-ocean-bg)', minHeight: '100vh' }}>
      <BrowserRouter>
        <Flex
          position="sticky"
          top="0"
          px="5"
          py="3"
          justify="between"
          align="center"
          style={{
            background: 'rgba(5, 10, 26, 0.8)',
            backdropFilter: 'blur(12px)',
            zIndex: 10,
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Heading size="5" style={{ color: 'var(--primary-text-color)', fontWeight: 600 }}>
              Mem vault
            </Heading>
          </Link>
          <Flex gap="4" align="center">
            {currentAccount && (
              <Link to="/subscription-example/admin/services">
                <Button className="water-button-soft">My Spaces</Button>
              </Link>
            )}
            {currentAccount && (
              <Link to="/subscription-example/subscribed">
                <Button className="water-button-soft">My Subscriptions</Button>
              </Link>
            )}
            <Box>
              <ConnectButton />
            </Box>
          </Flex>
        </Flex>

        <Box p="6">
          <Routes>
            <Route
              path="/"
              element={
                <Flex direction="column" gap="8">
                  <LandingPage />
                  <SpaceScroll id="explore-section" />
                </Flex>
              }
            />
            {currentAccount && (
              <Route
                path="/subscription-example/*"
                element={
                  <Routes>
                    <Route path="/" element={<CreateSpace />} />
                    <Route
                      path="/admin/service/:id"
                      element={
                        <Flex direction="column" gap="6">
                          <ManageSpace
                            setRecipientAllowlist={setRecipientAllowlist}
                            setCapId={setCapId}
                          />
                          <WalrusUpload
                            policyObject={recipientAllowlist}
                            cap_id={capId}
                            moduleName="subscription"
                          />
                        </Flex>
                      }
                    />
                    <Route path="/admin/services" element={<OwnedSpaces />} />
                    <Route path="/subscribed" element={<SubscribedSpaces />} />
                    <Route
                      path="/view/service/:id"
                      element={<SpaceInfo suiAddress={currentAccount.address} />}
                    />
                  </Routes>
                }
              />
            )}
            {!currentAccount && (
              <Route
                path="*"
                element={
                  <Flex direction="column" gap="8">
                    <LandingPage />
                    <SpaceScroll id="explore-section" />
                  </Flex>
                }
              />
            )}
          </Routes>
        </Box>
      </BrowserRouter>
    </Box>
  );
}

export default App;
