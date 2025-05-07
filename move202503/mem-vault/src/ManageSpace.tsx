// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
// 用到了是上传页面的地方
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
// 从 @radix-ui/themes 导入 Button
import { Card, Flex, Text, Heading, Box, Link as RadixLink, Grid, Button } from '@radix-ui/themes'; // Import necessary Radix components
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNetworkVariable } from './networkConfig';
import { getObjectExplorerLink } from './utils';
import { Link2Icon, InfoCircledIcon } from '@radix-ui/react-icons'; // Import icons

export interface Service {
  id: string;
  fee: number;
  ttl: number;
  owner: string;
  name: string;
}

interface AllowlistProps {
  setRecipientAllowlist: React.Dispatch<React.SetStateAction<string>>;
  setCapId: React.Dispatch<React.SetStateAction<string>>;
}

// --- Refined Color Palette (Inspired by Water & Apple) ---
const deepOceanBg = 'var(--deep-ocean-bg, #050a1a)'; // Deepest background
const midnightCardBg = 'var(--midnight-blue-bg, #0f172a)'; // Card background
const interactiveBlue = 'var(--interactive-blue, #0A84FF)'; // Primary interactive color
const accentAqua = 'var(--accent-aqua, #00e0ff)'; // Bright accent for highlights
const primaryText = 'var(--primary-text-color, #f0f4f8)'; // Main text
const secondaryText = 'var(--secondary-text-color, #a0aec0)'; // Subtle text
const subtleBorder = 'var(--border-color, rgba(10, 132, 255, 0.2))'; // Border color
const focusRing = 'var(--focus-ring-color, rgba(10, 132, 255, 0.5))'; // Focus indication
const cardShadow = 'rgba(0, 0, 0, 0.3)'; // Soft shadow for depth
const cardHighlightBg = 'rgba(15, 23, 42, 0.8)'; // Slightly lighter bg for sections

export function ManageSpace({ setRecipientAllowlist, setCapId }: AllowlistProps) {
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable('packageId');
  const currentAccount = useCurrentAccount();
  const [service, setService] = useState<Service>();
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function getService() {
      // load the service for the given id
      const serviceData = await suiClient.getObject({
        id: id!,
        options: { showContent: true },
      });
      const fields = (serviceData.data?.content as { fields: any })?.fields || {};
      setService({
        id: id!,
        fee: fields.fee,
        ttl: fields.ttl,
        owner: fields.owner,
        name: fields.name || 'Unnamed Space', // Provide default name
      });
      setRecipientAllowlist(id!);

      // load all caps
      const res = await suiClient.getOwnedObjects({
        owner: currentAccount?.address!,
        options: {
          showContent: true,
          showType: true,
        },
        filter: {
          StructType: `${packageId}::subscription::Cap`,
        },
      });

      // find the cap for the given service id
      const capIdResult = res.data
        .map((obj) => {
          const fields = (obj!.data!.content as { fields: any }).fields;
          return {
            id: fields?.id.id,
            service_id: fields?.service_id,
          };
        })
        .filter((item) => item.service_id === id)
        .map((item) => item.id) as string[];
      setCapId(capIdResult[0]);
    }

    // Call getService immediately
    getService();

    // Set up interval to call getService every 3 seconds
    const intervalId = setInterval(() => {
      getService();
    }, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [id, suiClient, packageId, currentAccount, setRecipientAllowlist, setCapId]); // Added dependencies

  const serviceName = service?.name || 'Loading Space...';
  const serviceTtlMinutes = service?.ttl ? service.ttl / 60 / 1000 : 0;

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
          Space Management
        </Text>
        <div style={{ width: '100px' }} />
      </Flex>

      {/* 主要内容区域 */}
      <Box
        style={{
          padding: 'var(--space-6) var(--space-3)',
          background: deepOceanBg,
          marginTop: '80px',
        }}
      >
        <Card
          style={{
            background: `linear-gradient(160deg, ${midnightCardBg} 30%, ${deepOceanBg} 100%)`, // Subtle gradient for depth
            borderRadius: 'var(--apple-border-radius, 12px)', // Consistent Apple-style rounding
            boxShadow: `0 10px 30px ${cardShadow}, 0 0 15px var(--subtle-glow-blue, rgba(0, 224, 255, 0.1))`, // Softer shadow + subtle glow
            border: `1px solid ${subtleBorder}`, // Defined border
            overflow: 'hidden',
            maxWidth: '750px', // Slightly wider max-width
            margin: '0 auto', // Center the card
            backdropFilter: 'blur(5px)', // Subtle blur for background elements if any
          }}
        >
          <Flex direction="column" gap="6" p={{ initial: 'var(--space-5)', sm: 'var(--space-6)' }}> {/* Responsive padding */}
            {/* Header Section */}
            <Flex direction="column" gap="1">
              <Flex justify="between" align="center">
                <Text size="2" weight="medium" style={{ color: accentAqua, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Space Control Panel
                </Text>
                <RadixLink href="https://www.brainsdance.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <Button
                    size="2"
                    variant="ghost"
                    style={{
                      cursor: 'pointer',
                      color: primaryText,
                      fontWeight: 500,
                      transition: 'color 0.2s ease',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = accentAqua}
                    onMouseOut={(e) => e.currentTarget.style.color = primaryText}
                  >
                    create memory
                  </Button>
                </RadixLink>
              </Flex>
              <Heading as="h2" size={{ initial: '6', sm: '7' }} style={{ color: primaryText, fontWeight: 600 }}>
                {serviceName}
              </Heading>
              {service?.id && (
                <RadixLink
                  href={`https://testnet.suivision.xyz/object/${service.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="2"
                  style={{
                    color: secondaryText,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = accentAqua}
                  onMouseOut={(e) => e.currentTarget.style.color = secondaryText}
                >
                  View on Explorer <Link2Icon width="14" height="14" />
                </RadixLink>
              )}
            </Flex>

            {/* Share Link Section - Enhanced Styling */}
            <Box
              style={{
                background: cardHighlightBg, // Use the highlight background
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-3)', // Slightly smaller radius for inner elements
                border: `1px solid ${subtleBorder}`,
              }}
            >
              <Flex align="center" gap="3">
                <InfoCircledIcon width="22" height="22" style={{ color: accentAqua, flexShrink: 0 }} />
                <Text size="3" style={{ color: primaryText, lineHeight: '1.5' }}>
                  Share{' '}
                  <RadixLink
                    href={`${window.location.origin}/view/space/${service?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    weight="medium"
                    style={{
                      color: interactiveBlue,
                      textDecoration: 'none', // Remove default underline
                      borderBottom: `1px dashed ${interactiveBlue}`, // Custom underline
                      paddingBottom: '1px',
                      transition: 'color 0.2s ease, border-color 0.2s ease',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = accentAqua; e.currentTarget.style.borderColor = accentAqua; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = interactiveBlue; e.currentTarget.style.borderColor = interactiveBlue; }}
                    aria-label="Shareable link to view this space"
                  >
                    this public link
                  </RadixLink>{' '}
                  with users to subscribe and access content.
                </Text>
              </Flex>
            </Box>

            {/* Details Section - Refined Grid Layout */}
            <Grid columns={{ initial: '1', sm: '2' }} gap="4">
              {/* Detail Item Box - Reusable Style */}
              {(['Subscription Duration', 'Subscription Fee'] as const).map((label) => {
                const value = label === 'Subscription Duration'
                  ? (serviceTtlMinutes > 0 ? `${serviceTtlMinutes} minutes` : 'Not Set')
                  : (service?.fee !== undefined ? `${service.fee} MIST` : 'Not Set');

                return (
                  <Box
                    key={label}
                    style={{
                      background: cardHighlightBg,
                      padding: 'var(--space-4)', // Increased padding
                      borderRadius: 'var(--radius-3)',
                      border: `1px solid ${subtleBorder}`,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 10px ${cardShadow}`; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <Text as="div" size="2" weight="medium" style={{ color: secondaryText, marginBottom: 'var(--space-2)' }}>
                      {label}
                    </Text>
                    <Text size="5" weight="bold" style={{ color: primaryText }}>
                      {value}
                    </Text>
                  </Box>
                );
              })}
            </Grid>
          </Flex>
        </Card>
      </Box>
    </Box>
  );
}
