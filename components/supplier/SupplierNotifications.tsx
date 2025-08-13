"use client"

import React, { useState, useEffect } from "react"
import {
  Paper,
  Button,
  Badge,
  Tabs,
  Menu,
  Loader,
  Pagination,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  Center,
  Modal,
  Divider
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
  BellIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  TruckIcon,
  EllipsisVerticalIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import toast from "react-hot-toast"

// Notification types
export enum NotificationType {
  NEW_ORDER = "NEW_ORDER",
  ORDER_STATUS_CHANGE = "ORDER_STATUS_CHANGE",
  PRODUCT_APPROVAL = "PRODUCT_APPROVAL",
  PRODUCT_REJECTION = "PRODUCT_REJECTION",
  DELIVERY_REMINDER = "DELIVERY_REMINDER",
  INFORMATION_REQUEST = "INFORMATION_REQUEST"
}

// Notification interface
interface Notification {
  _id: string;
  userId: string;
  supplierId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: {
    orderId?: string;
    productId?: string;
    status?: string;
    dueDate?: string;
    requiredAction?: boolean;
  };
  isRead: boolean;
  createdAt: string;
}

export default function SupplierNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [totalUnread, setTotalUnread] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false);
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Add filters based on active tab
      const filterParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (activeTab !== "all") {
        filterParams.append("type", activeTab);
      }

      const response = await fetch(`/api/supplier/notifications?${filterParams}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
        
        // Count unread notifications
        const unreadCount = data.notifications.filter((n: Notification) => !n.isRead).length;
        setTotalUnread(unreadCount);
      } else {
        toast.error("Error al cargar las notificaciones");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Error al cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/supplier/notifications/${notificationId}/read`, {
        method: "PUT"
      });
      
      if (response.ok) {
        // Update notifications in local state
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        // Update unread count
        setTotalUnread(prev => Math.max(0, prev - 1));
        
        toast.success("Notificación marcada como leída");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Error al marcar la notificación como leída");
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/supplier/notifications/mark-all-read", {
        method: "PUT"
      });
      
      if (response.ok) {
        // Update all notifications to read in local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        
        // Reset unread count
        setTotalUnread(0);
        
        toast.success("Todas las notificaciones marcadas como leídas");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Error al marcar las notificaciones como leídas");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    openDetails();
    
    // If notification isn't read, mark it as read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: es 
    });
  };

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_ORDER:
        return <ClipboardDocumentListIcon className="w-5 h-5 text-blue-500" />;
      case NotificationType.ORDER_STATUS_CHANGE:
        return <ArrowPathIcon className="w-5 h-5 text-purple-500" />;
      case NotificationType.PRODUCT_APPROVAL:
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case NotificationType.PRODUCT_REJECTION:
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case NotificationType.DELIVERY_REMINDER:
        return <TruckIcon className="w-5 h-5 text-orange-500" />;
      case NotificationType.INFORMATION_REQUEST:
        return <InformationCircleIcon className="w-5 h-5 text-indigo-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get color for notification type
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_ORDER:
        return "blue";
      case NotificationType.ORDER_STATUS_CHANGE:
        return "violet";
      case NotificationType.PRODUCT_APPROVAL:
        return "green";
      case NotificationType.PRODUCT_REJECTION:
        return "red";
      case NotificationType.DELIVERY_REMINDER:
        return "orange";
      case NotificationType.INFORMATION_REQUEST:
        return "gray";
      default:
        return "gray";
    }
  };

  // Get label for notification type
  const getNotificationTypeLabel = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_ORDER:
        return "Nueva Orden";
      case NotificationType.ORDER_STATUS_CHANGE:
        return "Cambio de Estado";
      case NotificationType.PRODUCT_APPROVAL:
        return "Producto Aprobado";
      case NotificationType.PRODUCT_REJECTION:
        return "Producto Rechazado";
      case NotificationType.DELIVERY_REMINDER:
        return "Recordatorio de Entrega";
      case NotificationType.INFORMATION_REQUEST:
        return "Solicitud de Información";
      default:
        return "Notificación";
    }
  };

  return (
    <Stack gap="md">
      {/* Header with actions */}
      <Group justify="space-between" align="flex-start">
        <div>
          <Group gap="xs" mb="xs">
            <BellIcon className="w-5 h-5" />
            <Title order={3}>Notificaciones</Title>
            {totalUnread > 0 && (
              <Badge color="red" variant="filled" size="sm">
                {totalUnread}
              </Badge>
            )}
          </Group>
          <Text c="dimmed">
            Mantente informado sobre órdenes, productos y solicitudes
          </Text>
        </div>
        
        <Group gap="xs">
          <Button
            variant="light"
            size="sm"
            leftSection={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchNotifications}
          >
            Actualizar
          </Button>
          <Button
            variant="light"
            color="blue"
            size="sm"
            onClick={markAllAsRead}
          >
            Marcar Todas como Leídas
          </Button>
        </Group>
      </Group>

      {/* Notification Tabs */}
      <Tabs 
        value={activeTab}
        onChange={(value) => {
          setActiveTab(value || "all");
          setCurrentPage(1);
        }}
      >
        <Tabs.List>
          <Tabs.Tab 
            value="all"
            leftSection={<BellIcon className="w-4 h-4" />}
          >
            Todas
          </Tabs.Tab>
          <Tabs.Tab 
            value={NotificationType.NEW_ORDER}
            leftSection={<ClipboardDocumentListIcon className="w-4 h-4" />}
          >
            Órdenes
          </Tabs.Tab>
          <Tabs.Tab 
            value={NotificationType.PRODUCT_APPROVAL}
            leftSection={<CubeIcon className="w-4 h-4" />}
          >
            Productos
          </Tabs.Tab>
          <Tabs.Tab 
            value={NotificationType.DELIVERY_REMINDER}
            leftSection={<TruckIcon className="w-4 h-4" />}
          >
            Entregas
          </Tabs.Tab>
          <Tabs.Tab 
            value={NotificationType.INFORMATION_REQUEST}
            leftSection={<EnvelopeIcon className="w-4 h-4" />}
          >
            Solicitudes
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* Notifications List */}
      <Paper withBorder>
        {loading ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text>Cargando notificaciones...</Text>
            </Stack>
          </Center>
        ) : notifications.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <div style={{ 
                backgroundColor: 'var(--mantine-color-gray-1)', 
                borderRadius: '50%', 
                padding: '1rem' 
              }}>
                <BellIcon style={{ width: '2rem', height: '2rem', color: 'var(--mantine-color-gray-5)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text fw={500} mb="xs">No hay notificaciones</Text>
                <Text c="dimmed" maw={400}>
                  No tienes notificaciones {activeTab !== "all" ? "de este tipo" : ""} en este momento. 
                  Las nuevas notificaciones aparecerán aquí.
                </Text>
              </div>
            </Stack>
          </Center>
        ) : (
          <Stack gap={0}>
            {notifications.map((notification, index) => (
              <div key={notification._id}>
                <div 
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    cursor: 'pointer',
                    backgroundColor: !notification.isRead ? 'var(--mantine-color-blue-0)' : 'transparent',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  onMouseEnter={(e) => {
                    if (notification.isRead) {
                      e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (notification.isRead) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Text 
                          fw={!notification.isRead ? 700 : 500} 
                          mb="xs"
                        >
                          {notification.title}
                        </Text>
                        <Badge 
                          size="sm" 
                          color={getNotificationColor(notification.type)}
                          variant="light"
                          mb="xs"
                        >
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                      </div>
                      
                      <Group gap="xs" align="center">
                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {formatTimeAgo(notification.createdAt)}
                        </Text>
                        
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon
                              size="sm"
                              variant="light"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <EllipsisVerticalIcon className="w-4 h-4" />
                            </ActionIcon>
                          </Menu.Target>
                          
                          <Menu.Dropdown>
                            {!notification.isRead && (
                              <Menu.Item
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                              >
                                Marcar como leída
                              </Menu.Item>
                            )}
                            <Menu.Item
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                            >
                              Ver detalles
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Group>
                    
                    <Text c="dimmed" size="sm" mb="sm" lineClamp={2}>
                      {notification.message}
                    </Text>
                    
                    {notification.metadata.requiredAction && (
                      <Badge 
                        color="orange"
                        size="sm"
                        leftSection={<ExclamationTriangleIcon className="w-3 h-3" />}
                      >
                        Requiere Acción
                      </Badge>
                    )}
                  </div>
                </div>
                {index < notifications.length - 1 && <Divider />}
              </div>
            ))}
          </Stack>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <>
            <Divider />
            <Center p="md">
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={setCurrentPage}
                withEdges
                size="sm"
              />
            </Center>
          </>
        )}
      </Paper>

      {/* Notification Detail Modal */}
      <Modal
        opened={detailsOpened}
        onClose={closeDetails}
        title={selectedNotification && (
          <Group gap="xs">
            {getNotificationIcon(selectedNotification.type)}
            <Text fw={600}>{selectedNotification.title}</Text>
          </Group>
        )}
        size="md"
      >
        {selectedNotification && (
          <Stack gap="md">
            <Badge 
              color={getNotificationColor(selectedNotification.type)}
              variant="light"
            >
              {getNotificationTypeLabel(selectedNotification.type)}
            </Badge>
            
            <Text style={{ whiteSpace: 'pre-line' }}>
              {selectedNotification.message}
            </Text>
            
            {selectedNotification.metadata && (
              <Paper bg="gray.0" p="md">
                <Stack gap="xs">
                  {selectedNotification.metadata.orderId && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Orden:</Text>
                      <Text size="sm" fw={500}>{selectedNotification.metadata.orderId}</Text>
                    </Group>
                  )}
                  
                  {selectedNotification.metadata.productId && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Producto:</Text>
                      <Text size="sm" fw={500}>{selectedNotification.metadata.productId}</Text>
                    </Group>
                  )}
                  
                  {selectedNotification.metadata.status && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Estado:</Text>
                      <Text size="sm" fw={500}>{selectedNotification.metadata.status}</Text>
                    </Group>
                  )}
                  
                  {selectedNotification.metadata.dueDate && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Fecha Límite:</Text>
                      <Text size="sm" fw={500}>
                        {new Date(selectedNotification.metadata.dueDate).toLocaleDateString()}
                      </Text>
                    </Group>
                  )}
                </Stack>
              </Paper>
            )}
            
            <Text size="xs" c="dimmed" ta="right">
              {new Date(selectedNotification.createdAt).toLocaleString()}
            </Text>
            
            {selectedNotification.metadata.requiredAction && (
              <>
                <Divider />
                <Button 
                  fullWidth
                  onClick={() => {
                    // Action depends on notification type
                    closeDetails();
                    
                    switch (selectedNotification.type) {
                      case NotificationType.NEW_ORDER:
                      case NotificationType.ORDER_STATUS_CHANGE:
                        window.location.href = `/proveedor/ordenes?id=${selectedNotification.metadata.orderId}`;
                        break;
                      case NotificationType.PRODUCT_APPROVAL:
                      case NotificationType.PRODUCT_REJECTION:
                        window.location.href = `/proveedor/productos?id=${selectedNotification.metadata.productId}`;
                        break;
                      case NotificationType.DELIVERY_REMINDER:
                        window.location.href = `/proveedor/ordenes?id=${selectedNotification.metadata.orderId}`;
                        break;
                      case NotificationType.INFORMATION_REQUEST:
                        // Generic action - could be more specific based on metadata
                        window.location.href = `/proveedor/perfil`;
                        break;
                      default:
                        window.location.href = `/proveedor`;
                    }
                  }}
                >
                  Ver Detalles y Tomar Acción
                </Button>
              </>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}