"use client";

import { useUser } from "@clerk/nextjs";
import { Button, Avatar, Menu, Group, Text, Loader, Paper, Stack } from "@mantine/core";
import { UserIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

interface SimpleHeaderProps {
  title?: string;
  showHomeLink?: boolean;
  className?: string;
}

export default function SimpleHeader({ 
  title = "Tramboory",
  showHomeLink = true,
  className = ""
}: SimpleHeaderProps) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <Paper component="header" shadow="sm" p="md" className={className} withBorder>
        <Group justify="space-between" maw="7xl" mx="auto">
          <Text size="xl" fw={700}>{title}</Text>
          <Loader size="sm" />
        </Group>
      </Paper>
    );
  }

  return (
    <Paper component="header" shadow="sm" p="md" className={className} withBorder>
      <Group justify="space-between" maw="7xl" mx="auto">
        {/* Title/Logo */}
        <Group gap="md">
          {showHomeLink && (
            <Button
              component={Link}
              href="/"
              variant="subtle"
              size="sm"
              leftSection={<HomeIcon className="w-4 h-4" />}
              color="gray"
            >
              Inicio
            </Button>
          )}
          <Text size="xl" fw={700}>{title}</Text>
        </Group>

        {/* User Menu */}
        <Group gap="sm">
          {user ? (
            <>
              {/* Desktop View */}
              <Group gap="sm" visibleFrom="md">
                <div style={{ textAlign: 'right' }}>
                  <Text size="sm" fw={500}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {user.primaryEmailAddress?.emailAddress}
                  </Text>
                </div>
                <Avatar
                  src={user.imageUrl}
                  name={user.firstName || "Usuario"}
                  size="sm"
                />
                <LogoutButton size="sm" />
              </Group>

              {/* Mobile View */}
              <Group hiddenFrom="md">
                <Menu shadow="md" width={250}>
                  <Menu.Target>
                    <Avatar
                      src={user.imageUrl}
                      name={user.firstName || "Usuario"}
                      size="sm"
                      style={{ cursor: 'pointer' }}
                    />
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item>
                      <Stack gap={0}>
                        <Text fw={500}>{user.firstName} {user.lastName}</Text>
                        <Text size="xs" c="dimmed">
                          {user.primaryEmailAddress?.emailAddress}
                        </Text>
                      </Stack>
                    </Menu.Item>
                    {showHomeLink && (
                      <Menu.Item
                        leftSection={<HomeIcon className="w-4 h-4" />}
                        onClick={() => window.location.href = "/"}
                      >
                        Inicio
                      </Menu.Item>
                    )}
                    <Menu.Item color="red">
                      <LogoutButton
                        variant="light"
                        color="danger"
                        size="sm"
                        className="w-full"
                      />
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </>
          ) : (
            <Button component={Link} href="/sign-in" color="blue" size="sm">
              Iniciar Sesión
            </Button>
          )}
        </Group>
      </Group>
    </Paper>
  );
}