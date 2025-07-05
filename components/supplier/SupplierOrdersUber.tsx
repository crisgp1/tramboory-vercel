"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Textarea
} from "@heroui/react";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { PurchaseOrderStatus } from "@/types/inventory";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PurchaseOrder {
  _id: string;
  purchaseOrderId: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  expectedDeliveryDate?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
  buyer?: {
    name: string;
    email: string;
    phone: string;
    department: string;
  };
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface SupplierOrdersUberProps {
  supplierId: string;
}

export default function SupplierOrdersUber({ supplierId }: SupplierOrdersUberProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [supplierId]);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedStatus, searchTerm]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/supplier/orders?supplierId=${supplierId}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (selectedStatus !== "all") {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.purchaseOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredOrders(filtered);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: PurchaseOrderStatus) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/supplier/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchOrders();
        onClose();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.PENDING:
        return <ClockIcon className="w-5 h-5" />;
      case PurchaseOrderStatus.APPROVED:
        return <CheckCircleIcon className="w-5 h-5" />;
      case PurchaseOrderStatus.ORDERED:
        return <TruckIcon className="w-5 h-5" />;
      case PurchaseOrderStatus.RECEIVED:
        return <CheckCircleIcon className="w-5 h-5" />;
      case PurchaseOrderStatus.CANCELLED:
        return <XCircleIcon className="w-5 h-5" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: PurchaseOrderStatus): "warning" | "success" | "primary" | "danger" | "default" => {
    switch (status) {
      case PurchaseOrderStatus.PENDING:
        return "warning";
      case PurchaseOrderStatus.APPROVED:
        return "success";
      case PurchaseOrderStatus.ORDERED:
        return "primary";
      case PurchaseOrderStatus.RECEIVED:
        return "success";
      case PurchaseOrderStatus.CANCELLED:
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.PENDING:
        return "Pendiente";
      case PurchaseOrderStatus.APPROVED:
        return "Aprobada";
      case PurchaseOrderStatus.ORDERED:
        return "En proceso";
      case PurchaseOrderStatus.RECEIVED:
        return "Completada";
      case PurchaseOrderStatus.CANCELLED:
        return "Cancelada";
      default:
        return status;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es
    });
  };

  const orderCounts = {
    all: orders.length,
    [PurchaseOrderStatus.PENDING]: orders.filter(o => o.status === PurchaseOrderStatus.PENDING).length,
    [PurchaseOrderStatus.APPROVED]: orders.filter(o => o.status === PurchaseOrderStatus.APPROVED).length,
    [PurchaseOrderStatus.ORDERED]: orders.filter(o => o.status === PurchaseOrderStatus.ORDERED).length,
    [PurchaseOrderStatus.RECEIVED]: orders.filter(o => o.status === PurchaseOrderStatus.RECEIVED).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header móvil estilo Uber */}
      <div className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-2">Órdenes de Compra</h1>
          
          {/* Barra de búsqueda */}
          <div className="relative">
            <Input
              placeholder="Buscar por número de orden o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
              className="w-full"
              size="lg"
            />
          </div>
        </div>

        {/* Tabs de estado */}
        <div className="px-4 pb-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <Button
              size="sm"
              color={selectedStatus === "all" ? "primary" : "default"}
              variant={selectedStatus === "all" ? "solid" : "flat"}
              onClick={() => setSelectedStatus("all")}
              className="whitespace-nowrap"
            >
              Todas ({orderCounts.all})
            </Button>
            <Button
              size="sm"
              color={selectedStatus === PurchaseOrderStatus.PENDING ? "warning" : "default"}
              variant={selectedStatus === PurchaseOrderStatus.PENDING ? "solid" : "flat"}
              onClick={() => setSelectedStatus(PurchaseOrderStatus.PENDING)}
              className="whitespace-nowrap"
            >
              <ClockIcon className="w-4 h-4 mr-1" />
              Pendientes ({orderCounts[PurchaseOrderStatus.PENDING]})
            </Button>
            <Button
              size="sm"
              color={selectedStatus === PurchaseOrderStatus.APPROVED ? "success" : "default"}
              variant={selectedStatus === PurchaseOrderStatus.APPROVED ? "solid" : "flat"}
              onClick={() => setSelectedStatus(PurchaseOrderStatus.APPROVED)}
              className="whitespace-nowrap"
            >
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Aprobadas ({orderCounts[PurchaseOrderStatus.APPROVED]})
            </Button>
            <Button
              size="sm"
              color={selectedStatus === PurchaseOrderStatus.ORDERED ? "primary" : "default"}
              variant={selectedStatus === PurchaseOrderStatus.ORDERED ? "solid" : "flat"}
              onClick={() => setSelectedStatus(PurchaseOrderStatus.ORDERED)}
              className="whitespace-nowrap"
            >
              <TruckIcon className="w-4 h-4 mr-1" />
              En proceso ({orderCounts[PurchaseOrderStatus.ORDERED]})
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay órdenes para mostrar</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card 
              key={order._id} 
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              isPressable
              onPress={() => {
                setSelectedOrder(order);
                onOpen();
              }}
            >
              <CardBody className="p-4">
                {/* Header de la orden */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">#{order.purchaseOrderId}</h3>
                      <Chip
                        size="sm"
                        color={getStatusColor(order.status)}
                        variant="flat"
                        startContent={getStatusIcon(order.status)}
                      >
                        {getStatusLabel(order.status)}
                      </Chip>
                    </div>
                    <p className="text-sm text-gray-500">{formatTimeAgo(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${order.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{order.items.length} productos</p>
                  </div>
                </div>

                {/* Productos de la orden */}
                <div className="space-y-2 mb-3">
                  {order.items.slice(0, 2).map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{item.productName}</span>
                      <span className="font-medium">{item.quantity} unidades</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-sm text-gray-400">
                      +{order.items.length - 2} productos más
                    </p>
                  )}
                </div>

                {/* Footer con acciones */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  {order.buyer && (
                    <div className="flex items-center gap-2">
                      <Avatar
                        size="sm"
                        name={order.buyer.name}
                        className="bg-gray-200"
                      />
                      <div>
                        <p className="text-sm font-medium">{order.buyer.name}</p>
                        <p className="text-xs text-gray-500">{order.buyer.department}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.expectedDeliveryDate && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Entrega: {new Date(order.expectedDeliveryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Alertas especiales */}
                {order.status === PurchaseOrderStatus.PENDING && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-lg flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-700">Requiere tu respuesta</p>
                  </div>
                )}
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Modal de detalle de orden */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="full"
        scrollBehavior="inside"
        className="max-w-4xl"
      >
        <ModalContent>
          {(onClose) => selectedOrder && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">Orden #{selectedOrder.purchaseOrderId}</h2>
                    <p className="text-sm text-gray-500">{formatTimeAgo(selectedOrder.createdAt)}</p>
                  </div>
                  <Chip
                    size="lg"
                    color={getStatusColor(selectedOrder.status)}
                    variant="flat"
                    startContent={getStatusIcon(selectedOrder.status)}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </Chip>
                </div>
              </ModalHeader>
              <ModalBody>
                {/* Información del comprador */}
                {selectedOrder.buyer && (
                  <Card className="mb-4">
                    <CardBody className="p-4">
                      <h3 className="font-semibold mb-3">Información del Comprador</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={selectedOrder.buyer.name} size="lg" />
                          <div>
                            <p className="font-medium">{selectedOrder.buyer.name}</p>
                            <p className="text-sm text-gray-500">{selectedOrder.buyer.department}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                            <span>{selectedOrder.buyer.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                            <span>{selectedOrder.buyer.phone}</span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Dirección de entrega */}
                {selectedOrder.deliveryAddress && (
                  <Card className="mb-4">
                    <CardBody className="p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5" />
                        Dirección de Entrega
                      </h3>
                      <p className="text-sm">
                        {selectedOrder.deliveryAddress.street}<br />
                        {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}
                      </p>
                      {selectedOrder.expectedDeliveryDate && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Fecha esperada: {new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                )}

                {/* Productos */}
                <Card className="mb-4">
                  <CardBody className="p-4">
                    <h3 className="font-semibold mb-3">Productos ({selectedOrder.items.length})</h3>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-sm text-gray-500">
                                {item.quantity} unidades × ${item.unitPrice.toLocaleString()}
                              </p>
                            </div>
                            <p className="font-semibold">${item.total.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totales */}
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${selectedOrder.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Impuestos</span>
                        <span>${selectedOrder.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Envío</span>
                        <span>${selectedOrder.shipping.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>${selectedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Notas */}
                {selectedOrder.notes && (
                  <Card className="mb-4">
                    <CardBody className="p-4">
                      <h3 className="font-semibold mb-3">Notas de la Orden</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedOrder.notes}</p>
                    </CardBody>
                  </Card>
                )}

                {/* Acciones rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<ChatBubbleLeftIcon className="w-5 h-5" />}
                    className="w-full"
                  >
                    Enviar Mensaje al Comprador
                  </Button>
                  <Button
                    variant="flat"
                    startContent={<ArrowDownTrayIcon className="w-5 h-5" />}
                    className="w-full"
                  >
                    Descargar Orden PDF
                  </Button>
                </div>
              </ModalBody>
              <ModalFooter>
                {selectedOrder.status === PurchaseOrderStatus.PENDING && (
                  <>
                    <Button
                      color="danger"
                      variant="flat"
                      onPress={() => handleStatusUpdate(selectedOrder._id, PurchaseOrderStatus.CANCELLED)}
                      isLoading={actionLoading}
                    >
                      Rechazar
                    </Button>
                    <Button
                      color="success"
                      onPress={() => handleStatusUpdate(selectedOrder._id, PurchaseOrderStatus.APPROVED)}
                      isLoading={actionLoading}
                    >
                      Aceptar Orden
                    </Button>
                  </>
                )}
                {selectedOrder.status === PurchaseOrderStatus.APPROVED && (
                  <Button
                    color="primary"
                    onPress={() => handleStatusUpdate(selectedOrder._id, PurchaseOrderStatus.ORDERED)}
                    isLoading={actionLoading}
                  >
                    Marcar como En Proceso
                  </Button>
                )}
                {selectedOrder.status === PurchaseOrderStatus.ORDERED && (
                  <Button
                    color="success"
                    onPress={() => handleStatusUpdate(selectedOrder._id, PurchaseOrderStatus.RECEIVED)}
                    isLoading={actionLoading}
                  >
                    Confirmar Entrega
                  </Button>
                )}
                <Button color="default" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}