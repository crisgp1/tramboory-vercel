"use client";

import { useState, useEffect } from "react";
import {
  Paper,
  Button,
  Badge,
  Avatar,
  Menu,
  Tabs,
  Modal,
  Group,
  Stack,
  Text,
  ActionIcon,
  Indicator,
  Divider
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { BellIcon as BellIconSolid } from "@heroicons/react/24/solid";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { mapHeroUIColorToMantine } from "@/lib/migration-utils";

interface Notification {
  id: string;
  type: "order" | "payment" | "product" | "system" | "message";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  data?: {
    orderId?: string;
    productId?: string;
    amount?: number;
    [key: string]: any;
  };
}

interface SupplierNotificationCenterProps {
  supplierId: string;
  className?: string;
}

export default function SupplierNotificationCenter({ supplierId, className }: SupplierNotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedTab, setSelectedTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time updates (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [supplierId]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/supplier/notifications?supplierId=${supplierId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/supplier/notifications/${notificationId}/read`, {
        method: "PUT"
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/supplier/notifications/mark-all-read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId })
      });
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/supplier/notifications/${notificationId}`, {
        method: "DELETE"
      });
      
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `w-6 h-6 ${priority === 'urgent' ? 'text-red-500' : priority === 'high' ? 'text-orange-500' : priority === 'medium' ? 'text-blue-500' : 'text-gray-500'}`;
    
    switch (type) {
      case "order":
        return <DocumentTextIcon className={iconClass} />;
      case "payment":
        return <CurrencyDollarIcon className={iconClass} />;
      case "product":
        return <CheckCircleIcon className={iconClass} />;
      case "message":
        return <ChatBubbleLeftIcon className={iconClass} />;
      case "system":
        return <InformationCircleIcon className={iconClass} />;
      default:
        return <BellIcon className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "blue";
      default:
        return "gray";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es
    });
  };

  const filteredNotifications = notifications.filter(notif => {
    if (selectedTab === "all") return true;
    if (selectedTab === "unread") return !notif.isRead;
    return notif.type === selectedTab;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <div className={`relative ${className || ''}`}>
        <Menu shadow="md" width={320}>
          <Menu.Target>
            <ActionIcon variant="subtle" size="lg" aria-label="Notificaciones">
              <Indicator 
                size={16} 
                color="red" 
                label={unreadCount > 99 ? "99+" : unreadCount.toString()}
                disabled={unreadCount === 0}
              >
                <BellIcon className="w-6 h-6" />
              </Indicator>
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Notificaciones</Text>
                <Group gap="xs">
                  {unreadCount > 0 && (
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={markAllAsRead}
                    >
                      Marcar todas
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={open}
                  >
                    Ver todas
                  </Button>
                </Group>
              </Group>
            </Menu.Label>
            
            <Tabs value={selectedTab} onChange={(value) => setSelectedTab(value || "all")}>
              <Tabs.List>
                <Tabs.Tab value="all">Todas</Tabs.Tab>
                <Tabs.Tab value="unread">No leídas ({unreadCount})</Tabs.Tab>
                <Tabs.Tab value="order">Órdenes</Tabs.Tab>
                <Tabs.Tab value="payment">Pagos</Tabs.Tab>
              </Tabs.List>
            </Tabs>
            
            <Divider my="sm" />
            
            {filteredNotifications.length === 0 ? (
              <Menu.Item>
                <Text ta="center" c="dimmed" py="md">
                  No hay notificaciones
                </Text>
              </Menu.Item>
            ) : (
              <>
                {filteredNotifications.slice(0, 5).map((notification) => (
                  <Menu.Item key={notification.id} p="sm">
                    <Group gap="sm" align="flex-start">
                      <div style={{ marginTop: 4 }}>
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Group justify="space-between" align="flex-start">
                          <Text size="sm" fw={notification.isRead ? 400 : 600} lineClamp={1}>
                            {notification.title}
                          </Text>
                          <Badge size="xs" color={getPriorityColor(notification.priority)} variant="light">
                            {notification.priority}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {notification.message}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatTimeAgo(notification.timestamp)}
                        </Text>
                      </Stack>
                    </Group>
                  </Menu.Item>
                ))}
                
                {filteredNotifications.length > 5 && (
                  <Menu.Item onClick={open}>
                    <Text ta="center" c="blue" size="sm">
                      Ver más notificaciones...
                    </Text>
                  </Menu.Item>
                )}
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </div>

      {/* Full notifications modal */}
      <Modal 
        opened={opened} 
        onClose={close}
        title="Centro de Notificaciones"
        size="xl"
        scrollAreaComponent={() => null}
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600}>Centro de Notificaciones</Text>
            {unreadCount > 0 && (
              <Button
                size="sm"
                color="blue"
                variant="light"
                onClick={markAllAsRead}
              >
                Marcar todas como leídas
              </Button>
            )}
          </Group>
          
          <Tabs value={selectedTab} onChange={(value) => setSelectedTab(value || "all")}>
            <Tabs.List>
              <Tabs.Tab value="all">Todas ({notifications.length})</Tabs.Tab>
              <Tabs.Tab value="unread">No leídas ({unreadCount})</Tabs.Tab>
              <Tabs.Tab value="order">Órdenes</Tabs.Tab>
              <Tabs.Tab value="payment">Pagos</Tabs.Tab>
              <Tabs.Tab value="product">Productos</Tabs.Tab>
              <Tabs.Tab value="system">Sistema</Tabs.Tab>
            </Tabs.List>
          </Tabs>
          
          <Stack gap="sm" mah={400} style={{ overflow: 'auto' }}>
            {filteredNotifications.map((notification) => (
              <Paper 
                key={notification.id}
                p="md"
                withBorder
                bg={!notification.isRead ? 'blue.0' : 'white'}
                style={{ 
                  borderLeft: !notification.isRead ? '4px solid var(--mantine-color-blue-6)' : undefined
                }}
              >
                <Group gap="sm" align="flex-start">
                  <div style={{ marginTop: 4 }}>
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>
                  
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Group justify="space-between" align="flex-start">
                      <Text fw={notification.isRead ? 500 : 600} size="sm">
                        {notification.title}
                      </Text>
                      <Group gap="xs" align="center">
                        <Badge
                          size="sm"
                          color={getPriorityColor(notification.priority)}
                          variant="light"
                        >
                          {notification.priority}
                        </Badge>
                        
                        <Menu>
                          <Menu.Target>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              aria-label="Acciones"
                            >
                              <EllipsisVerticalIcon className="w-4 h-4" />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            {!notification.isRead && (
                              <Menu.Item
                                leftSection={<CheckIcon className="w-4 h-4" />}
                                onClick={() => markAsRead(notification.id)}
                              >
                                Marcar como leída
                              </Menu.Item>
                            )}
                            <Menu.Item
                              color="red"
                              leftSection={<TrashIcon className="w-4 h-4" />}
                              onClick={() => deleteNotification(notification.id)}
                            >
                              Eliminar
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Group>
                    
                    <Text size="sm" c="dimmed">
                      {notification.message}
                    </Text>
                    
                    <Group justify="space-between" align="center">
                      <Text size="xs" c="dimmed">
                        {formatTimeAgo(notification.timestamp)}
                      </Text>
                      
                      {notification.data?.orderId && (
                        <Button
                          size="xs"
                          color="blue"
                          variant="light"
                          onClick={() => {
                            // Redirect to order details
                            window.location.href = `/proveedor/ordenes?id=${notification.data?.orderId}`;
                          }}
                        >
                          Ver Orden
                        </Button>
                      )}
                    </Group>
                  </Stack>
                </Group>
              </Paper>
            ))}
            
            {filteredNotifications.length === 0 && (
              <Stack align="center" py="xl">
                <BellIcon className="w-16 h-16 text-gray-300" />
                <Text c="dimmed">No hay notificaciones para mostrar</Text>
              </Stack>
            )}
          </Stack>
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={close}>
            Cerrar
          </Button>
        </Group>
      </Modal>
    </>
  );
}