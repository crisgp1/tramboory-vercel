'use client';

import React from 'react';
import {
  Container,
  Stack,
  Group,
  Skeleton,
  SimpleGrid,
  Paper,
  rem
} from '@mantine/core';

interface LoadingSkeletonProps {
  variant?: 'dashboard' | 'card' | 'form' | 'modal';
  count?: number;
}

export default function LoadingSkeleton({ variant = 'dashboard', count = 8 }: LoadingSkeletonProps) {
  if (variant === 'card') {
    return (
      <Paper p="md" radius="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between" mb="sm">
            <Group gap="sm">
              <Skeleton height={rem(40)} circle />
              <Stack gap={rem(4)}>
                <Skeleton height={rem(16)} width={rem(120)} />
                <Skeleton height={rem(12)} width={rem(80)} />
              </Stack>
            </Group>
            <Skeleton height={rem(20)} width={rem(80)} radius="md" />
          </Group>
          
          <Stack gap="xs">
            <Skeleton height={rem(14)} width="70%" />
            <Skeleton height={rem(14)} width="50%" />
            <Skeleton height={rem(18)} width="40%" />
          </Stack>
          
          <Skeleton height={rem(32)} mt="sm" />
        </Stack>
      </Paper>
    );
  }

  if (variant === 'form') {
    return (
      <Paper p="lg" radius="md" withBorder>
        <Stack gap="lg">
          <Stack gap="xs">
            <Skeleton height={rem(20)} width="30%" />
            <Skeleton height={rem(12)} width="60%" />
          </Stack>
          
          <Stack gap="md">
            <Stack gap="xs">
              <Skeleton height={rem(14)} width={rem(100)} />
              <Skeleton height={rem(36)} />
            </Stack>
            
            <Stack gap="xs">
              <Skeleton height={rem(14)} width={rem(120)} />
              <Skeleton height={rem(36)} />
            </Stack>
            
            <Stack gap="xs">
              <Skeleton height={rem(14)} width={rem(80)} />
              <Skeleton height={rem(80)} />
            </Stack>
          </Stack>
          
          <Group justify="space-between">
            <Skeleton height={rem(36)} width={rem(100)} />
            <Skeleton height={rem(36)} width={rem(120)} />
          </Group>
        </Stack>
      </Paper>
    );
  }

  if (variant === 'modal') {
    return (
      <Stack gap="lg" p="lg">
        <Group justify="space-between" align="flex-start">
          <Group gap="md">
            <Skeleton height={rem(48)} circle />
            <Stack gap={rem(4)}>
              <Skeleton height={rem(18)} width={rem(180)} />
              <Skeleton height={rem(14)} width={rem(120)} />
            </Stack>
          </Group>
          <Skeleton height={rem(24)} width={rem(80)} radius="md" />
        </Group>
        
        <Stack gap="md">
          {Array.from({ length: 4 }).map((_, index) => (
            <Group key={index} justify="space-between">
              <Stack gap={rem(2)}>
                <Skeleton height={rem(14)} width={rem(100)} />
                <Skeleton height={rem(12)} width={rem(140)} />
              </Stack>
              <Skeleton height={rem(16)} width={rem(60)} />
            </Group>
          ))}
        </Stack>
        
        <Group justify="flex-end" gap="sm">
          <Skeleton height={rem(36)} width={rem(100)} />
          <Skeleton height={rem(36)} width={rem(120)} />
        </Group>
      </Stack>
    );
  }

  // Dashboard variant (default)
  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header skeleton */}
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Skeleton height={rem(32)} width={rem(200)} />
            <Skeleton height={rem(16)} width={rem(150)} />
          </Stack>
          <Skeleton height={rem(36)} width={rem(140)} />
        </Group>

        {/* Filters skeleton */}
        <Paper p="md" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <Skeleton height={rem(36)} width={rem(80)} radius="md" />
                <Skeleton height={rem(36)} width={rem(80)} radius="md" />
                <Skeleton height={rem(36)} width={rem(80)} radius="md" />
              </Group>
              
              <Group gap="xs">
                <Skeleton height={rem(36)} width={rem(200)} />
                <Skeleton height={rem(36)} width={rem(36)} circle />
                <Skeleton height={rem(36)} width={rem(36)} circle />
              </Group>
            </Group>
          </Stack>
        </Paper>

        {/* Cards grid skeleton */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
          {Array.from({ length: count }).map((_, index) => (
            <LoadingSkeleton key={index} variant="card" />
          ))}
        </SimpleGrid>

        {/* Pagination skeleton */}
        <Group justify="center" mt="xl">
          <Group gap="xs">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} height={rem(32)} width={rem(32)} radius="sm" />
            ))}
          </Group>
        </Group>
      </Stack>
    </Container>
  );
}