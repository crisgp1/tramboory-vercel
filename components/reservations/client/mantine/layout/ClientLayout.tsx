'use client';

import React, { useState } from 'react';
import {
  AppShell,
  Burger,
  Group,
  Title,
  UnstyledButton,
  Text,
  Avatar,
  Badge,
  Stack,
  ScrollArea,
  rem,
  useMantineTheme,
  NavLink,
  Button,
  Divider
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import {
  IconCalendarEvent,
  IconPlus,
  IconHome,
  IconLogout,
  IconUser,
  IconSettings
} from '@tabler/icons-react';
import LogoutButton from '@/components/auth/LogoutButton';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  // Navigation items siguiendo Miller's Law (máximo 7 items)
  const navigationItems = [
    {
      label: 'Inicio',
      icon: IconHome,
      href: '/',
      active: pathname === '/'
    },
    {
      label: 'Mis Reservaciones',
      icon: IconCalendarEvent,
      href: '/reservaciones',
      active: pathname === '/reservaciones'
    },
    {
      label: 'Nueva Reserva',
      icon: IconPlus,
      href: '/reservaciones/nueva',
      active: pathname === '/reservaciones/nueva',
      highlight: true
    }
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    if (isMobile) {
      toggle();
    }
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.fullName) {
      return user.fullName;
    }
    return 'Usuario';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened }
      }}
      padding="md"
    >
      {/* Header - Aplicando Law of Uniform Connectedness */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            
            <UnstyledButton onClick={() => handleNavigation('/')}>
              <Group gap="xs">
                <Text
                  size="xl"
                  fw={700}
                  variant="gradient"
                  gradient={{ from: 'pink.6', to: 'violet.6', deg: 45 }}
                >
                  Tramboory
                </Text>
                <Badge size="xs" variant="light" color="pink">
                  Cliente
                </Badge>
              </Group>
            </UnstyledButton>
          </Group>

          {/* User avatar - Mobile responsive */}
          <Group gap="sm" visibleFrom="xs">
            <Avatar
              size="sm"
              src={user?.imageUrl}
              color="pink"
              radius="xl"
            >
              {getUserInitials()}
            </Avatar>
            <Text size="sm" fw={500} hiddenFrom="md">
              {user?.firstName || 'Usuario'}
            </Text>
            <Text size="sm" fw={500} visibleFrom="md">
              {getUserDisplayName()}
            </Text>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Sidebar Navigation - Aplicando Law of Common Region y Proximity */}
      <AppShell.Navbar p="md">
        <AppShell.Section>
          {/* User Profile Section */}
          <Group mb="lg" p="sm" 
            style={(theme) => ({
              backgroundColor: theme.colors.gray[0],
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.gray[2]}`
            })}
          >
            <Avatar
              size="md"
              src={user?.imageUrl}
              color="pink"
              radius="xl"
            >
              {getUserInitials()}
            </Avatar>
            <Stack gap={0}>
              <Text size="sm" fw={600}>
                {getUserDisplayName()}
              </Text>
              <Text size="xs" c="dimmed">
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
            </Stack>
          </Group>
        </AppShell.Section>

        <AppShell.Section grow component={ScrollArea}>
          {/* Main Navigation - Aplicando Hick's Law (opciones limitadas) */}
          <Stack gap="xs">
            {navigationItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                leftSection={<item.icon size="1.2rem" />}
                active={item.active}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation(item.href);
                }}
                variant={item.highlight ? 'filled' : 'light'}
                color={item.highlight ? 'pink' : undefined}
                style={(theme) => item.highlight ? {
                  background: `linear-gradient(45deg, ${theme.colors.pink[5]}, ${theme.colors.violet[5]})`,
                  color: 'white'
                } : {}}
              />
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider my="sm" />
          
          {/* Quick Actions - Siguiendo Jakob's Law (patrones familiares) */}
          <Stack gap="xs">
            <Button
              variant="light"
              color="pink"
              size="sm"
              leftSection={<IconPlus size="1rem" />}
              onClick={() => handleNavigation('/reservaciones/nueva')}
              fullWidth
            >
              Nueva Reserva
            </Button>
            
            <LogoutButton
              variant="light"
              size="sm"
              className="w-full"
            />
          </Stack>

          {/* Footer */}
          <Text size="xs" c="dimmed" ta="center" mt="md">
            © 2025 Tramboory
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* Main Content */}
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}