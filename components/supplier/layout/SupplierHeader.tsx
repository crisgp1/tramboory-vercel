"use client";

import { Group, Text, ActionIcon, Avatar, Menu, Stack, Paper, Title, Burger } from "@mantine/core";
import { BuildingStorefrontIcon, BellIcon } from "@heroicons/react/24/outline";
import { IconLogout, IconUser } from "@tabler/icons-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { notifications } from "@mantine/notifications";

interface SupplierHeaderProps {
  title?: string;
  subtitle?: string;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
}

// Single Responsibility - Only handles header display with user actions
export default function SupplierHeader({
  title = "Portal Proveedor",
  subtitle = "Gestiona tus órdenes y productos",
  showMobileMenu = false,
  onMobileMenuToggle
}: SupplierHeaderProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      await signOut();
      notifications.show({
        title: "Éxito",
        message: "Sesión cerrada exitosamente",
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Error al cerrar sesión",
        color: "red"
      });
    }
  };

  return (
    <div style={{
      height: '4rem',
      borderBottom: '1px solid var(--mantine-color-gray-3)',
      backgroundColor: 'white',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Group justify="space-between" style={{ width: '100%' }}>
        <Group gap="md">
          {showMobileMenu && (
            <Burger opened={false} onClick={onMobileMenuToggle} hiddenFrom="lg" />
          )}
          <Group gap="sm">
            <Paper
              p="xs"
              radius="md"
              bg="blue.6"
              c="white"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text fw={600} size="sm">T</Text>
            </Paper>
            <div className="hidden sm:block">
              <Text fw={600} size="lg">{title}</Text>
              <Text size="xs" c="dimmed">{subtitle}</Text>
            </div>
            <Title order={4} className="sm:hidden">Tramboory</Title>
          </Group>
        </Group>
        
        <Group>
          <ActionIcon variant="subtle" size="lg">
            <BellIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </ActionIcon>
          
          {user && (
            <Menu shadow="md" width={250}>
              <Menu.Target>
                <Avatar
                  src={user.imageUrl}
                  size="sm"
                  style={{ cursor: 'pointer' }}
                  radius="xl"
                >
                  {!user.imageUrl && <IconUser size={16} />}
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item>
                  <Stack gap="xs">
                    <Text fw={500}>{user.fullName}</Text>
                    <Text size="sm" c="dimmed">
                      {user.primaryEmailAddress?.emailAddress}
                    </Text>
                  </Stack>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  onClick={handleSignOut}
                  c="red"
                >
                  Cerrar Sesión
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>
    </div>
  );
}