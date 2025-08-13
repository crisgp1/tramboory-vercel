"use client";

import { useState, useEffect } from "react";
import {
  Paper,
  Button,
  Badge,
  TextInput,
  Menu,
  Modal,
  Avatar,
  Textarea,
  Group,
  Stack,
  Text,
  Title,
  Grid,
  Divider,
  Card,
  Skeleton,
  Center,
  ScrollArea,
  ActionIcon,
  Flex
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
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
  const [opened, { open, close }] = useDisclosure(false);
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
        close();
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

  const getStatusColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.PENDING:
        return "yellow";
      case PurchaseOrderStatus.APPROVED:
        return "green";
      case PurchaseOrderStatus.ORDERED:
        return "blue";
      case PurchaseOrderStatus.RECEIVED:
        return "green";
      case PurchaseOrderStatus.CANCELLED:
        return "red";
      default:
        return "gray";
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)' }}>
      {/* Header */}
      <Paper pos="sticky" top={0} style={{ zIndex: 40 }} withBorder p="md">
        <Title order={2} mb="md">Órdenes de Compra</Title>
        
        {/* Search Bar */}
        <TextInput
          placeholder="Buscar por número de orden o producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          leftSection={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
          size="md"
          mb="md"
        />

        {/* Status Filter Buttons */}
        <ScrollArea>
          <Flex gap="xs" style={{ minWidth: 'max-content' }}>
            <Button
              size="sm"
              variant={selectedStatus === "all" ? "filled" : "light"}
              color={selectedStatus === "all" ? "blue" : "gray"}
              onClick={() => setSelectedStatus("all")}
            >
              Todas ({orderCounts.all})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === PurchaseOrderStatus.PENDING ? "filled" : "light"}
              color={selectedStatus === PurchaseOrderStatus.PENDING ? "yellow" : "gray"}
              onClick={() => setSelectedStatus(PurchaseOrderStatus.PENDING)}
              leftSection={<ClockIcon className="w-4 h-4" />}
            >
              Pendientes ({orderCounts[PurchaseOrderStatus.PENDING]})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === PurchaseOrderStatus.APPROVED ? "filled" : "light"}
              color={selectedStatus === PurchaseOrderStatus.APPROVED ? "green" : "gray"}
              onClick={() => setSelectedStatus(PurchaseOrderStatus.APPROVED)}
              leftSection={<CheckCircleIcon className="w-4 h-4" />}
            >
              Aprobadas ({orderCounts[PurchaseOrderStatus.APPROVED]})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === PurchaseOrderStatus.ORDERED ? "filled" : "light"}
              color={selectedStatus === PurchaseOrderStatus.ORDERED ? "blue" : "gray"}
              onClick={() => setSelectedStatus(PurchaseOrderStatus.ORDERED)}
              leftSection={<TruckIcon className="w-4 h-4" />}
            >
              En proceso ({orderCounts[PurchaseOrderStatus.ORDERED]})
            </Button>
          </Flex>
        </ScrollArea>
      </Paper>

      {/* Orders List */}
      <Stack gap="md" p="md">
        {loading ? (
          <Center py="xl">
            <Stack>
              <Skeleton height={120} />
              <Skeleton height={120} />
              <Skeleton height={120} />
            </Stack>
          </Center>
        ) : filteredOrders.length === 0 ? (
          <Center py="xl">
            <Stack align="center">
              <TruckIcon className="w-16 h-16 text-gray-300" />
              <Text c="dimmed">No hay órdenes para mostrar</Text>
            </Stack>
          </Center>
        ) : (
          filteredOrders.map((order) => (
            <Paper 
              key={order._id} 
              withBorder 
              p="md" 
              shadow="sm"
              style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'; }}
              onClick={() => {
                setSelectedOrder(order);
                open();
              }}
            >
              {/* Order Header */}
              <Group justify="space-between" mb="md">
                <Stack gap="xs">
                  <Group gap="sm">
                    <Title order={4}>#{order.purchaseOrderId}</Title>
                    <Badge
                      size="sm"
                      color={getStatusColor(order.status)}
                      variant="light"
                      leftSection={getStatusIcon(order.status)}
                    >
                      {getStatusLabel(order.status)}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">{formatTimeAgo(order.createdAt)}</Text>
                </Stack>
                <Stack gap={0} align="flex-end">
                  <Text size="xl" fw={700}>${order.total.toLocaleString()}</Text>
                  <Text size="xs" c="dimmed">{order.items.length} productos</Text>
                </Stack>
              </Group>

              {/* Order Items */}
              <Stack gap="xs" mb="md">
                {order.items.slice(0, 2).map((item, index) => (
                  <Group key={index} justify="space-between">
                    <Text size="sm" c="dimmed">{item.productName}</Text>
                    <Text size="sm" fw={500}>{item.quantity} unidades</Text>
                  </Group>
                ))}
                {order.items.length > 2 && (
                  <Text size="sm" c="dimmed">
                    +{order.items.length - 2} productos más
                  </Text>
                )}
              </Stack>

              {/* Footer */}
              <Group justify="space-between" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                {order.buyer && (
                  <Group gap="sm">
                    <Avatar
                      size="sm"
                      name={order.buyer.name}
                    />
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>{order.buyer.name}</Text>
                      <Text size="xs" c="dimmed">{order.buyer.department}</Text>
                    </Stack>
                  </Group>
                )}
                
                {order.expectedDeliveryDate && (
                  <Group gap="xs">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <Text size="sm" c="dimmed">
                      Entrega: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                    </Text>
                  </Group>
                )}
              </Group>

              {/* Special Alerts */}
              {order.status === PurchaseOrderStatus.PENDING && (
                <Paper mt="sm" p="sm" bg="yellow.0" withBorder>
                  <Group gap="sm">
                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                    <Text size="sm" c="yellow.7">Requiere tu respuesta</Text>
                  </Group>
                </Paper>
              )}
            </Paper>
          ))
        )}
      </Stack>

      {/* Order Detail Modal */}
      <Modal 
        opened={opened} 
        onClose={close}
        size="xl"
        title={selectedOrder && (
          <Group justify="space-between">
            <Stack gap="xs">
              <Title order={3}>Orden #{selectedOrder.purchaseOrderId}</Title>
              <Text size="sm" c="dimmed">{formatTimeAgo(selectedOrder.createdAt)}</Text>
            </Stack>
            <Badge
              size="lg"
              color={getStatusColor(selectedOrder.status)}
              variant="light"
              leftSection={getStatusIcon(selectedOrder.status)}
            >
              {getStatusLabel(selectedOrder.status)}
            </Badge>
          </Group>
        )}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {selectedOrder && (
          <Stack gap="md">
            {/* Buyer Information */}
            {selectedOrder.buyer && (
              <Paper withBorder p="md">
                <Title order={4} mb="md">Información del Comprador</Title>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Group>
                      <Avatar name={selectedOrder.buyer.name} size="lg" />
                      <Stack gap="xs">
                        <Text fw={500}>{selectedOrder.buyer.name}</Text>
                        <Text size="sm" c="dimmed">{selectedOrder.buyer.department}</Text>
                      </Stack>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="sm">
                      <Group gap="sm">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        <Text size="sm">{selectedOrder.buyer.email}</Text>
                      </Group>
                      <Group gap="sm">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        <Text size="sm">{selectedOrder.buyer.phone}</Text>
                      </Group>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Paper>
            )}

            {/* Delivery Address */}
            {selectedOrder.deliveryAddress && (
              <Paper withBorder p="md">
                <Group mb="md">
                  <MapPinIcon className="w-5 h-5" />
                  <Title order={4}>Dirección de Entrega</Title>
                </Group>
                <Text size="sm" mb="sm">
                  {selectedOrder.deliveryAddress.street}<br />
                  {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}
                </Text>
                {selectedOrder.expectedDeliveryDate && (
                  <Group gap="sm">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <Text size="sm" c="dimmed">
                      Fecha esperada: {new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString()}
                    </Text>
                  </Group>
                )}
              </Paper>
            )}

            {/* Products */}
            <Paper withBorder p="md">
              <Title order={4} mb="md">Productos ({selectedOrder.items.length})</Title>
              <Stack gap="md">
                {selectedOrder.items.map((item, index) => (
                  <Group key={index} justify="space-between" p="sm" style={{ borderBottom: index < selectedOrder.items.length - 1 ? '1px solid var(--mantine-color-gray-2)' : 'none' }}>
                    <Stack gap="xs">
                      <Text fw={500}>{item.productName}</Text>
                      <Text size="sm" c="dimmed">
                        {item.quantity} unidades × ${item.unitPrice.toLocaleString()}
                      </Text>
                    </Stack>
                    <Text fw={600}>${item.total.toLocaleString()}</Text>
                  </Group>
                ))}

                {/* Totals */}
                <Stack gap="xs" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                  <Group justify="space-between">
                    <Text size="sm">Subtotal</Text>
                    <Text size="sm">${selectedOrder.subtotal.toLocaleString()}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Impuestos</Text>
                    <Text size="sm">${selectedOrder.tax.toLocaleString()}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Envío</Text>
                    <Text size="sm">${selectedOrder.shipping.toLocaleString()}</Text>
                  </Group>
                  <Group justify="space-between" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text fw={700}>Total</Text>
                    <Text fw={700} size="lg">${selectedOrder.total.toLocaleString()}</Text>
                  </Group>
                </Stack>
              </Stack>
            </Paper>

            {/* Notes */}
            {selectedOrder.notes && (
              <Paper withBorder p="md">
                <Title order={4} mb="md">Notas de la Orden</Title>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{selectedOrder.notes}</Text>
              </Paper>
            )}

            {/* Quick Actions */}
            <Grid>
              <Grid.Col span={6}>
                <Button
                  color="blue"
                  variant="light"
                  leftSection={<ChatBubbleLeftIcon className="w-5 h-5" />}
                  fullWidth
                >
                  Enviar Mensaje al Comprador
                </Button>
              </Grid.Col>
              <Grid.Col span={6}>
                <Button
                  variant="light"
                  leftSection={<ArrowDownTrayIcon className="w-5 h-5" />}
                  fullWidth
                >
                  Descargar Orden PDF
                </Button>
              </Grid.Col>
            </Grid>

            {/* Action Buttons */}
            <Group justify="flex-end" gap="sm" pt="md">
              {selectedOrder.status === PurchaseOrderStatus.PENDING && (
                <>
                  <Button
                    color="red"
                    variant="light"
                    onClick={() => handleStatusUpdate(selectedOrder._id, PurchaseOrderStatus.CANCELLED)}
                    loading={actionLoading}
                  >
                    Rechazar
                  </Button>
                  <Button
                    color="green"
                    onClick={() => handleStatusUpdate(selectedOrder._id, PurchaseOrderStatus.APPROVED)}
                    loading={actionLoading}
                  >
                    Aceptar Orden
                  </Button>
                </>
              )}
              {selectedOrder.status === PurchaseOrderStatus.APPROVED && (
                <Button
                  color="blue"
                  onClick={() => handleStatusUpdate(selectedOrder._id, PurchaseOrderStatus.ORDERED)}
                  loading={actionLoading}
                >
                  Marcar como En Proceso
                </Button>
              )}
              {selectedOrder.status === PurchaseOrderStatus.ORDERED && (
                <Button
                  color="green"
                  onClick={() => handleStatusUpdate(selectedOrder._id, PurchaseOrderStatus.RECEIVED)}
                  loading={actionLoading}
                >
                  Confirmar Entrega
                </Button>
              )}
              <Button variant="light" onClick={close}>
                Cerrar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}