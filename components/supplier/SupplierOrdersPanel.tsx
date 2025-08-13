"use client"

import React, { useState, useEffect } from "react"
import {
  Paper,
  Button,
  Table,
  TextInput,
  Badge,
  Modal,
  Pagination,
  Loader,
  Menu,
  Textarea,
  Group,
  Stack,
  Text,
  Title,
  Grid,
  ActionIcon,
  Select,
  NumberInput,
  Center,
  Divider,
  ScrollArea
} from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useDisclosure } from "@mantine/hooks"
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  ArchiveBoxIcon,
  TruckIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { PurchaseOrderStatus } from "@/types/inventory"
import toast from "react-hot-toast"

interface OrderDeliveryNote {
  note: string;
  attachments?: File[];
}

interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface PurchaseOrder {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryLocation: string;
  paymentTerms: {
    method: 'cash' | 'credit' | 'transfer' | 'check';
    creditDays: number;
    dueDate?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SupplierOrdersPanel() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryNote, setDeliveryNote] = useState<OrderDeliveryNote>({ note: "" });
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<{start?: Date, end?: Date}>({});
  const [amountFilter, setAmountFilter] = useState<{min?: number, max?: number}>({});
  const [showFilters, setShowFilters] = useState(false);
  
  const [
    detailModalOpened, 
    { open: openDetailModal, close: closeDetailModal }
  ] = useDisclosure(false);
  
  const [
    deliveryModalOpened, 
    { open: openDeliveryModal, close: closeDeliveryModal }
  ] = useDisclosure(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter, dateRangeFilter, amountFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateRangeFilter.start && { 
          startDate: dateRangeFilter.start.toISOString()
        }),
        ...(dateRangeFilter.end && { 
          endDate: dateRangeFilter.end.toISOString()
        }),
        ...(amountFilter.min && { minAmount: amountFilter.min.toString() }),
        ...(amountFilter.max && { maxAmount: amountFilter.max.toString() })
      });

      // API específica para proveedor que filtra automáticamente por el proveedor actual
      const response = await fetch(`/api/supplier/orders?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        toast.error("Error al cargar las órdenes");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    openDetailModal();
  };

  const handleConfirmDelivery = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setDeliveryNote({ note: "" });
    openDeliveryModal();
  };

  const submitDeliveryConfirmation = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`/api/supplier/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: PurchaseOrderStatus.RECEIVED,
          actualDeliveryDate: new Date().toISOString(),
          deliveryNote: deliveryNote.note
        }),
      });

      if (response.ok) {
        toast.success("Entrega confirmada correctamente");
        closeDeliveryModal();
        fetchOrders();
      } else {
        toast.error("Error al confirmar la entrega");
      }
    } catch (error) {
      console.error("Error confirming delivery:", error);
      toast.error("Error al confirmar la entrega");
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setDateRangeFilter({});
    setAmountFilter({});
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No especificada";
    return new Date(dateString).toLocaleDateString("es-MX");
  };

  const getStatusColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.DRAFT:
        return "gray";
      case PurchaseOrderStatus.PENDING:
        return "yellow";
      case PurchaseOrderStatus.APPROVED:
        return "blue";
      case PurchaseOrderStatus.ORDERED:
        return "grape";
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
      case PurchaseOrderStatus.DRAFT:
        return "Borrador";
      case PurchaseOrderStatus.PENDING:
        return "Pendiente";
      case PurchaseOrderStatus.APPROVED:
        return "Aprobada";
      case PurchaseOrderStatus.ORDERED:
        return "En Proceso";
      case PurchaseOrderStatus.RECEIVED:
        return "Completada";
      case PurchaseOrderStatus.CANCELLED:
        return "Cancelada";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.DRAFT:
        return <ArchiveBoxIcon className="w-4 h-4" />;
      case PurchaseOrderStatus.PENDING:
        return <ClockIcon className="w-4 h-4" />;
      case PurchaseOrderStatus.APPROVED:
        return <CheckCircleIcon className="w-4 h-4" />;
      case PurchaseOrderStatus.ORDERED:
        return <TruckIcon className="w-4 h-4" />;
      case PurchaseOrderStatus.RECEIVED:
        return <CheckCircleIcon className="w-4 h-4" />;
      case PurchaseOrderStatus.CANCELLED:
        return <NoSymbolIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const canConfirmDelivery = (order: PurchaseOrder) => {
    return order.status === PurchaseOrderStatus.ORDERED;
  };

  const isOrderLate = (order: PurchaseOrder) => {
    if (!order.expectedDeliveryDate) return false;
    return new Date(order.expectedDeliveryDate) < new Date() && order.status === PurchaseOrderStatus.ORDERED;
  };

  const statusOptions = [
    { value: "", label: "Todos los estados" },
    { value: PurchaseOrderStatus.PENDING, label: "Pendiente" },
    { value: PurchaseOrderStatus.APPROVED, label: "Aprobada" },
    { value: PurchaseOrderStatus.ORDERED, label: "En Proceso" },
    { value: PurchaseOrderStatus.RECEIVED, label: "Completada" },
  ];

  return (
    <Stack gap="lg">
      {/* Header y controles */}
      <Group justify="space-between" align="flex-start">
        <TextInput
          placeholder="Buscar órdenes por ID o productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          leftSection={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
          style={{ maxWidth: 400, flex: 1 }}
        />

        <Group>
          <Button
            variant="light"
            leftSection={<FunnelIcon className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
            {(statusFilter || dateRangeFilter.start || amountFilter.min) && (
              <Badge size="xs" color="blue" ml="xs">
                {[
                  statusFilter && "1",
                  (dateRangeFilter.start || dateRangeFilter.end) && "1",
                  (amountFilter.min || amountFilter.max) && "1"
                ].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </Group>
      </Group>

      {/* Panel de filtros */}
      {showFilters && (
        <Paper withBorder p="md">
          <Group justify="space-between" mb="md">
            <Text fw={500} c="dimmed">Filtros Avanzados</Text>
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => setShowFilters(false)}
            >
              <XMarkIcon className="w-4 h-4" />
            </ActionIcon>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text size="sm" fw={500} mb="xs">Estado</Text>
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value || "")}
                data={statusOptions}
                placeholder="Seleccionar estado"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text size="sm" fw={500} mb="xs">Rango de Fechas</Text>
              <Group grow>
                <Stack gap="xs">
                  <DateInput
                    value={dateRangeFilter.start ? dateRangeFilter.start.toISOString().split('T')[0] : null}
                    onChange={(value: string | null) => setDateRangeFilter(prev => ({ ...prev, start: value ? new Date(value) : undefined }))}
                    placeholder="Desde"
                    size="sm"
                  />
                  <Text size="xs" c="dimmed">Desde</Text>
                </Stack>
                <Stack gap="xs">
                  <DateInput
                    value={dateRangeFilter.end ? dateRangeFilter.end.toISOString().split('T')[0] : null}
                    onChange={(value: string | null) => setDateRangeFilter(prev => ({ ...prev, end: value ? new Date(value) : undefined }))}
                    placeholder="Hasta"
                    size="sm"
                  />
                  <Text size="xs" c="dimmed">Hasta</Text>
                </Stack>
              </Group>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text size="sm" fw={500} mb="xs">Monto Total</Text>
              <Group grow>
                <NumberInput
                  placeholder="Mínimo"
                  value={amountFilter.min || ""}
                  onChange={(val) => setAmountFilter(prev => ({ ...prev, min: typeof val === 'number' ? val : undefined }))}
                  leftSection={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                />
                <NumberInput
                  placeholder="Máximo"
                  value={amountFilter.max || ""}
                  onChange={(val) => setAmountFilter(prev => ({ ...prev, max: typeof val === 'number' ? val : undefined }))}
                  leftSection={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                />
              </Group>
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              size="sm"
              onClick={clearFilters}
            >
              Limpiar Filtros
            </Button>
            <Button
              size="sm"
              onClick={() => fetchOrders()}
            >
              Aplicar Filtros
            </Button>
          </Group>
        </Paper>
      )}

      {/* Tabla de órdenes */}
      <Paper withBorder>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ORDEN ID</Table.Th>
                <Table.Th>FECHA</Table.Th>
                <Table.Th>PRODUCTOS</Table.Th>
                <Table.Th>MONTO</Table.Th>
                <Table.Th>ENTREGA</Table.Th>
                <Table.Th>ESTADO</Table.Th>
                <Table.Th>ACCIONES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Center py="xl">
                      <Loader size="md" />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : orders.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Center py="xl">
                      <Text c="dimmed">No se encontraron órdenes</Text>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                orders.map((order) => (
                  <Table.Tr
                    key={order.id}
                    bg={isOrderLate(order) ? "red.0" : undefined}
                  >
                    <Table.Td>
                      <Stack gap="xs">
                        <Text fw={500}>{order.purchaseOrderId}</Text>
                        <Text size="xs" c="dimmed">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(order.createdAt)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text fw={500}>{order.items.length} productos</Text>
                        <Text size="xs" c="dimmed" style={{ maxWidth: 180 }} truncate>
                          {order.items.map(item => item.productName).join(", ")}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{formatCurrency(order.total)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text size="sm">
                          {order.expectedDeliveryDate 
                            ? formatDate(order.expectedDeliveryDate)
                            : "No programada"}
                        </Text>
                        {isOrderLate(order) && (
                          <Badge 
                            size="xs" 
                            color="red" 
                            variant="light"
                            leftSection={<ExclamationTriangleIcon className="w-3 h-3" />}
                          >
                            Retrasada
                          </Badge>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        color={getStatusColor(order.status)}
                        leftSection={getStatusIcon(order.status)}
                      >
                        {getStatusLabel(order.status)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => handleViewOrder(order)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </ActionIcon>
                        
                        {canConfirmDelivery(order) && (
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="green"
                            onClick={() => handleConfirmDelivery(order)}
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <Group justify="center" p="md">
            <Pagination
              total={totalPages}
              value={currentPage}
              onChange={setCurrentPage}
              withEdges
            />
          </Group>
        )}
      </Paper>

      {/* Modal de detalle de orden */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        size="xl"
        title={selectedOrder && (
          <Group justify="space-between">
            <Title order={4}>Orden de Compra: {selectedOrder.purchaseOrderId}</Title>
            <Badge 
              color={getStatusColor(selectedOrder.status)}
              size="sm"
            >
              {getStatusLabel(selectedOrder.status)}
            </Badge>
          </Group>
        )}
      >
        {selectedOrder && (
          <Stack gap="lg">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="sm" fw={500} c="dimmed" mb="xs">Información General</Text>
                <Paper bg="gray.0" p="sm">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Fecha de Creación:</Text>
                      <Text size="sm" fw={500}>{formatDate(selectedOrder.createdAt)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Última Actualización:</Text>
                      <Text size="sm" fw={500}>{formatDate(selectedOrder.updatedAt)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Total:</Text>
                      <Text size="sm" fw={500}>{formatCurrency(selectedOrder.total)}</Text>
                    </Group>
                  </Stack>
                </Paper>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="sm" fw={500} c="dimmed" mb="xs">Entrega</Text>
                <Paper bg="gray.0" p="sm">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Fecha Esperada:</Text>
                      <Text size="sm" fw={500}>
                        {selectedOrder.expectedDeliveryDate 
                          ? formatDate(selectedOrder.expectedDeliveryDate)
                          : "No especificada"}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Fecha Real:</Text>
                      <Text size="sm" fw={500}>
                        {selectedOrder.actualDeliveryDate 
                          ? formatDate(selectedOrder.actualDeliveryDate)
                          : "Pendiente"}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Ubicación:</Text>
                      <Text size="sm" fw={500}>{selectedOrder.deliveryLocation}</Text>
                    </Group>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>

            <div>
              <Text size="sm" fw={500} c="dimmed" mb="xs">Productos</Text>
              <Paper bg="gray.0">
                <Table>
                  <Table.Thead bg="gray.1">
                    <Table.Tr>
                      <Table.Th>Producto</Table.Th>
                      <Table.Th ta="right">Cantidad</Table.Th>
                      <Table.Th ta="right">Precio Unitario</Table.Th>
                      <Table.Th ta="right">Total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedOrder.items.map((item, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>
                          <Text fw={500}>{item.productName}</Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text c="dimmed">{item.quantity} {item.unit}</Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text c="dimmed">{formatCurrency(item.unitPrice)}</Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text fw={500}>{formatCurrency(item.totalPrice)}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                  <Table.Tbody bg="gray.0">
                    <Table.Tr>
                      <Table.Td colSpan={2}></Table.Td>
                      <Table.Td ta="right">
                        <Text fw={500} c="dimmed">Subtotal:</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={500}>{formatCurrency(selectedOrder.subtotal)}</Text>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td colSpan={2}></Table.Td>
                      <Table.Td ta="right">
                        <Text fw={500} c="dimmed">Impuestos:</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={500}>{formatCurrency(selectedOrder.tax)}</Text>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td colSpan={2}></Table.Td>
                      <Table.Td ta="right">
                        <Text fw={700}>Total:</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={700}>{formatCurrency(selectedOrder.total)}</Text>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Paper>
            </div>

            {selectedOrder.notes && (
              <div>
                <Text size="sm" fw={500} c="dimmed" mb="xs">Notas</Text>
                <Paper bg="gray.0" p="sm">
                  <Text size="sm">{selectedOrder.notes}</Text>
                </Paper>
              </div>
            )}

            <Group justify="flex-end" mt="lg">
              <Button 
                variant="light" 
                onClick={closeDetailModal}
              >
                Cerrar
              </Button>
              {canConfirmDelivery(selectedOrder) && (
                <Button
                  color="green"
                  leftSection={<CheckCircleIcon className="w-4 h-4" />}
                  onClick={() => {
                    closeDetailModal();
                    handleConfirmDelivery(selectedOrder);
                  }}
                >
                  Confirmar Entrega
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal de confirmación de entrega */}
      <Modal
        opened={deliveryModalOpened}
        onClose={closeDeliveryModal}
        title={
          <Group>
            <TruckIcon className="w-5 h-5 text-green-600" />
            <Title order={4}>Confirmar Entrega</Title>
          </Group>
        }
      >
        <Stack gap="md">
          <Paper bg="green.0" withBorder p="sm">
            <Text size="sm" c="green.8">
              Estás a punto de confirmar la entrega de la orden: <strong>{selectedOrder?.purchaseOrderId}</strong>
            </Text>
          </Paper>

          <div>
            <Text size="sm" fw={500} mb="xs">
              Notas de Entrega (opcional)
            </Text>
            <Textarea
              placeholder="Agregar notas sobre la entrega..."
              value={deliveryNote.note}
              onChange={(e) => setDeliveryNote({ note: e.currentTarget.value })}
              minRows={3}
            />
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              Adjuntar Documentos (opcional)
            </Text>
            <Button
              leftSection={<ArrowDownTrayIcon className="w-4 h-4" />}
              variant="light"
              size="sm"
              fullWidth
            >
              Subir documentos
            </Button>
            <Text size="xs" c="dimmed" mt="xs">
              Puedes adjuntar remisiones, fotos u otros documentos relacionados.
            </Text>
          </div>

          <Group justify="flex-end" mt="lg">
            <Button 
              variant="light" 
              onClick={closeDeliveryModal}
            >
              Cancelar
            </Button>
            <Button
              color="green"
              leftSection={<CheckCircleIcon className="w-4 h-4" />}
              onClick={submitDeliveryConfirmation}
            >
              Confirmar Entrega
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}