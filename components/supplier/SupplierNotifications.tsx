"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  CardBody,
  Button,
  Chip,
  Tabs,
  Tab,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Pagination,
  Badge
} from "@heroui/react"
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
  const [showDetails, setShowDetails] = useState(false);
  
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
    setShowDetails(true);
    
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
        return "primary";
      case NotificationType.ORDER_STATUS_CHANGE:
        return "secondary";
      case NotificationType.PRODUCT_APPROVAL:
        return "success";
      case NotificationType.PRODUCT_REJECTION:
        return "danger";
      case NotificationType.DELIVERY_REMINDER:
        return "warning";
      case NotificationType.INFORMATION_REQUEST:
        return "default";
      default:
        return "default";
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
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BellIcon className="w-5 h-5" />
            <span>Notificaciones</span>
            {totalUnread > 0 && (
              <Badge color="danger" shape="circle" size="sm">
                {totalUnread}
              </Badge>
            )}
          </h2>
          <p className="text-gray-600">
            Mantente informado sobre órdenes, productos y solicitudes
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="flat"
            color="default"
            size="sm"
            startContent={<ArrowPathIcon className="w-4 h-4" />}
            onPress={fetchNotifications}
          >
            Actualizar
          </Button>
          <Button
            variant="flat"
            color="primary"
            size="sm"
            onPress={markAllAsRead}
          >
            Marcar Todas como Leídas
          </Button>
        </div>
      </div>

      {/* Notification Tabs */}
      <Tabs 
        aria-label="Filtros de notificaciones" 
        selectedKey={activeTab}
        onSelectionChange={(key) => {
          setActiveTab(key as string);
          setCurrentPage(1);
        }}
      >
        <Tab 
          key="all" 
          title={
            <div className="flex items-center gap-1">
              <BellIcon className="w-4 h-4" />
              <span>Todas</span>
            </div>
          }
        />
        <Tab 
          key={NotificationType.NEW_ORDER} 
          title={
            <div className="flex items-center gap-1">
              <ClipboardDocumentListIcon className="w-4 h-4" />
              <span>Órdenes</span>
            </div>
          }
        />
        <Tab 
          key={NotificationType.PRODUCT_APPROVAL} 
          title={
            <div className="flex items-center gap-1">
              <CubeIcon className="w-4 h-4" />
              <span>Productos</span>
            </div>
          }
        />
        <Tab 
          key={NotificationType.DELIVERY_REMINDER} 
          title={
            <div className="flex items-center gap-1">
              <TruckIcon className="w-4 h-4" />
              <span>Entregas</span>
            </div>
          }
        />
        <Tab 
          key={NotificationType.INFORMATION_REQUEST} 
          title={
            <div className="flex items-center gap-1">
              <EnvelopeIcon className="w-4 h-4" />
              <span>Solicitudes</span>
            </div>
          }
        />
      </Tabs>

      {/* Notifications List */}
      <Card className="border border-gray-200">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" color="primary" label="Cargando notificaciones..." />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <BellIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay notificaciones</h3>
              <p className="text-gray-500 max-w-md">
                No tienes notificaciones {activeTab !== "all" ? "de este tipo" : ""} en este momento. 
                Las nuevas notificaciones aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div 
                  key={notification._id}
                  className={`flex gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-medium text-gray-900 ${!notification.isRead ? 'font-bold' : ''}`}>
                          {notification.title}
                        </p>
                        <Chip 
                          size="sm" 
                          color={getNotificationColor(notification.type)}
                          variant="flat"
                          className="mt-1"
                        >
                          {getNotificationTypeLabel(notification.type)}
                        </Chip>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <EllipsisVerticalIcon className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Acciones de notificación">
                            {notification.isRead ? null : (
                              <DropdownItem
                                key="read"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                              >
                                Marcar como leída
                              </DropdownItem>
                            )}
                            <DropdownItem
                              key="details"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                            >
                              Ver detalles
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    {notification.metadata.requiredAction && (
                      <div className="mt-2">
                        <Chip 
                          color="warning"
                          size="sm"
                          startContent={<ExclamationTriangleIcon className="w-3 h-3" />}
                        >
                          Requiere Acción
                        </Chip>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center p-4 border-t border-gray-200">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                showShadow
                color="primary"
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Notification Detail Modal */}
      {selectedNotification && showDetails && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {getNotificationIcon(selectedNotification.type)}
                  <h3 className="text-lg font-semibold text-gray-900">{selectedNotification.title}</h3>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setShowDetails(false)}
                >
                  <XCircleIcon className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <Chip 
                  color={getNotificationColor(selectedNotification.type)}
                  variant="flat"
                >
                  {getNotificationTypeLabel(selectedNotification.type)}
                </Chip>
                
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedNotification.message}
                </p>
                
                {selectedNotification.metadata && (
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    {selectedNotification.metadata.orderId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Orden:</span>
                        <span className="text-sm font-medium">{selectedNotification.metadata.orderId}</span>
                      </div>
                    )}
                    
                    {selectedNotification.metadata.productId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Producto:</span>
                        <span className="text-sm font-medium">{selectedNotification.metadata.productId}</span>
                      </div>
                    )}
                    
                    {selectedNotification.metadata.status && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Estado:</span>
                        <span className="text-sm font-medium">{selectedNotification.metadata.status}</span>
                      </div>
                    )}
                    
                    {selectedNotification.metadata.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fecha Límite:</span>
                        <span className="text-sm font-medium">{new Date(selectedNotification.metadata.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 text-right">
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </div>
                
                {selectedNotification.metadata.requiredAction && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button 
                      color="primary"
                      className="w-full"
                      onPress={() => {
                        // Action depends on notification type
                        setShowDetails(false);
                        
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}