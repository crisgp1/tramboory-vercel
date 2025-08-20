'use client';

import React from 'react';
import {
  Stack,
  Title,
  Text,
  Button,
  Center,
  Paper,
  ThemeIcon,
  rem,
  useMantineTheme
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconSearch,
  IconFolderOpen,
  IconPlus
} from '@tabler/icons-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ size: string }>;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'search' | 'filter';
}

export default function EmptyState({
  title,
  description,
  icon: Icon = IconCalendarEvent,
  actionLabel,
  onAction,
  variant = 'default'
}: EmptyStateProps) {
  const theme = useMantineTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'search':
        return {
          iconColor: theme.colors.blue[6],
          iconBackground: theme.colors.blue[0],
          icon: IconSearch
        };
      case 'filter':
        return {
          iconColor: theme.colors.orange[6],
          iconBackground: theme.colors.orange[0],
          icon: IconFolderOpen
        };
      default:
        return {
          iconColor: theme.colors.gray[6],
          iconBackground: theme.colors.gray[0],
          icon: Icon
        };
    }
  };

  const { iconColor, iconBackground, icon: VariantIcon } = getVariantStyles();

  return (
    <Center py={rem(80)}>
      <Paper
        p="xl"
        radius="lg"
        style={{
          backgroundColor: theme.colors.gray[0],
          border: `2px dashed ${theme.colors.gray[3]}`,
          maxWidth: rem(400),
          textAlign: 'center'
        }}
      >
        <Stack gap="lg" align="center">
          {/* Icono */}
          <ThemeIcon
            size={rem(80)}
            radius="xl"
            style={{
              backgroundColor: iconBackground,
              color: iconColor
            }}
          >
            <VariantIcon size={rem(40)} />
          </ThemeIcon>

          {/* Contenido */}
          <Stack gap="xs" align="center">
            <Title order={3} size="h4" c="dark">
              {title}
            </Title>
            <Text c="dimmed" ta="center" size="sm" style={{ maxWidth: rem(300) }}>
              {description}
            </Text>
          </Stack>

          {/* Acción */}
          {actionLabel && onAction && (
            <Button
              size="md"
              leftSection={<IconPlus size="1rem" />}
              onClick={onAction}
              variant="gradient"
              gradient={{ from: 'pink.5', to: 'violet.5' }}
              radius="md"
            >
              {actionLabel}
            </Button>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}