"use client";

import { Button, Stack, Divider } from "@mantine/core";
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  UserIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  BellIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Interface segregation - specific interface for navigation items
interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
}

interface SupplierNavigationProps {
  className?: string;
}

// Single Responsibility - Only handles navigation logic
export default function SupplierNavigation({ className }: SupplierNavigationProps) {
  const pathname = usePathname();

  // Open/Closed Principle - Easy to extend with new navigation items
  const navigationItems: NavigationItem[] = [
    {
      href: "/proveedor",
      label: "Dashboard",
      icon: ChartBarIcon,
      isActive: pathname === "/proveedor"
    },
    {
      href: "/proveedor/ordenes",
      label: "Órdenes de Compra",
      icon: ClipboardDocumentListIcon,
      isActive: pathname === "/proveedor/ordenes"
    },
    {
      href: "/proveedor/productos",
      label: "Productos",
      icon: CubeIcon,
      isActive: pathname === "/proveedor/productos"
    },
    {
      href: "/proveedor/perfil",
      label: "Perfil",
      icon: UserIcon,
      isActive: pathname === "/proveedor/perfil"
    },
    {
      href: "/proveedor/estadisticas",
      label: "Estadísticas",
      icon: ChartBarIcon,
      isActive: pathname === "/proveedor/estadisticas"
    },
    {
      href: "/proveedor/mensajes",
      label: "Mensajes",
      icon: ChatBubbleLeftIcon,
      isActive: pathname === "/proveedor/mensajes"
    },
    {
      href: "/proveedor/notificaciones",
      label: "Notificaciones",
      icon: BellIcon,
      isActive: pathname === "/proveedor/notificaciones"
    }
  ];

  return (
    <div className={className}>
      <Stack gap="xs">
        {navigationItems.map((item) => (
          <NavigationLink key={item.href} item={item} />
        ))}
      </Stack>
    </div>
  );
}

// Single Responsibility - Only renders a single navigation link
interface NavigationLinkProps {
  item: NavigationItem;
}

function NavigationLink({ item }: NavigationLinkProps) {
  const { href, label, icon: Icon, isActive } = item;

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Button
        variant={isActive ? "light" : "subtle"}
        fullWidth
        justify="flex-start"
        leftSection={<Icon className="w-5 h-5" />}
        style={isActive ? {
          backgroundColor: 'var(--mantine-color-blue-0)',
          color: 'var(--mantine-color-blue-7)'
        } : undefined}
        c={isActive ? undefined : "dark"}
      >
        {label}
      </Button>
    </Link>
  );
}