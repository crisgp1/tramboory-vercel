"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Badge,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showDropdown, setShowDropdown] = useState(false);

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

  const getPriorityColor = (priority: string): "danger" | "warning" | "primary" | "default" => {
    switch (priority) {
      case "urgent":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "primary";
      default:
        return "default";
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
      <div className={`relative ${className}`}>
        <Dropdown isOpen={showDropdown} onOpenChange={setShowDropdown}>
          <DropdownTrigger>
            <Button
              isIconOnly
              variant="light"
              className="relative"
              aria-label="Notificaciones"
            >
              <BellIcon className="w-6 h-6" />
              {unreadCount > 0 && (
                <Badge
                  color="danger"
                  className="absolute -top-1 -right-1"
                >
                  {unreadCount > 99 ? "99+" : unreadCount.toString()}
                </Badge>
              )}
            </Button>
          </DropdownTrigger>
          
          <DropdownMenu 
            aria-label="Notificaciones"
            className="w-80 max-w-screen-sm"
            closeOnSelect={false}
          >
            <DropdownItem key="header" className="p-0">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Notificaciones</h3>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <Button
                        size="sm"
                        variant="light"
                        onClick={markAllAsRead}
                      >
                        Marcar todas como leídas
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="light"
                      onClick={onOpen}
                    >
                      Ver todas
                    </Button>
                  </div>
                </div>
                
                <Tabs
                  selectedKey={selectedTab}
                  onSelectionChange={(key) => setSelectedTab(key as string)}
                  size="sm"
                  className="w-full"
                >
                  <Tab key="all" title="Todas" />
                  <Tab key="unread" title={`No leídas (${unreadCount})`} />
                  <Tab key="order" title="Órdenes" />
                  <Tab key="payment" title="Pagos" />
                </Tabs>
              </div>
            </DropdownItem>
            
            <DropdownItem key="notifications-info">
              <div className="p-3 text-center text-gray-500">
                {filteredNotifications.length} notificaciones disponibles
              </div>
            </DropdownItem>
            
            {filteredNotifications.length === 0 ? (
              <DropdownItem key="empty" className="p-4 text-center text-gray-500">
                No hay notificaciones
              </DropdownItem>
            ) : null}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Modal de notificaciones completo */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Centro de Notificaciones</h2>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onClick={markAllAsRead}
                      >
                        Marcar todas como leídas
                      </Button>
                    )}
                  </div>
                </div>
                
                <Tabs
                  selectedKey={selectedTab}
                  onSelectionChange={(key) => setSelectedTab(key as string)}
                  className="w-full"
                >
                  <Tab key="all" title={`Todas (${notifications.length})`} />
                  <Tab key="unread" title={`No leídas (${unreadCount})`} />
                  <Tab key="order" title="Órdenes" />
                  <Tab key="payment" title="Pagos" />
                  <Tab key="product" title="Productos" />
                  <Tab key="system" title="Sistema" />
                </Tabs>
              </ModalHeader>
              
              <ModalBody>
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <Card 
                      key={notification.id}
                      className={`${!notification.isRead ? 'border-l-4 border-blue-500 bg-blue-50' : 'border-gray-200'} hover:shadow-md transition-shadow`}
                    >
                      <CardBody className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type, notification.priority)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Chip
                                  size="sm"
                                  color={getPriorityColor(notification.priority)}
                                  variant="flat"
                                >
                                  {notification.priority}
                                </Chip>
                                
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      aria-label="Acciones"
                                    >
                                      <EllipsisVerticalIcon className="w-4 h-4" />
                                    </Button>
                                  </DropdownTrigger>
                                  <DropdownMenu aria-label="Acciones de notificación">
                                    {!notification.isRead ? (
                                      <DropdownItem
                                        key="mark-read"
                                        startContent={<CheckIcon className="w-4 h-4" />}
                                        onPress={() => markAsRead(notification.id)}
                                      >
                                        Marcar como leída
                                      </DropdownItem>
                                    ) : null}
                                    <DropdownItem
                                      key="delete"
                                      className="text-danger"
                                      color="danger"
                                      startContent={<TrashIcon className="w-4 h-4" />}
                                      onClick={() => deleteNotification(notification.id)}
                                    >
                                      Eliminar
                                    </DropdownItem>
                                  </DropdownMenu>
                                </Dropdown>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                              {notification.message}
                            </p>
                            
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-500">
                                {formatTimeAgo(notification.timestamp)}
                              </p>
                              
                              {notification.data?.orderId && (
                                <Button
                                  size="sm"
                                  color="primary"
                                  variant="flat"
                                  onClick={() => {
                                    // Redirect to order details
                                    window.location.href = `/proveedor/ordenes?id=${notification.data?.orderId}`;
                                  }}
                                >
                                  Ver Orden
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                  
                  {filteredNotifications.length === 0 && (
                    <div className="text-center py-12">
                      <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No hay notificaciones para mostrar</p>
                    </div>
                  )}
                </div>
              </ModalBody>
              
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}