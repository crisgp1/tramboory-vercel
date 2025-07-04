"use client"

import React, { useState, useEffect } from "react"
import { 
  Card, 
  CardBody, 
  Button, 
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Pagination,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Textarea,
  DatePicker
} from "@heroui/react"
import { DateValue } from "@internationalized/date"
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
  _id: string;
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
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "">("");
  const [dateRangeFilter, setDateRangeFilter] = useState<{start?: DateValue, end?: DateValue}>({});
  const [amountFilter, setAmountFilter] = useState<{min?: number, max?: number}>({});
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    isOpen: isDetailModalOpen, 
    onOpen: onDetailModalOpen, 
    onClose: onDetailModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isConfirmDeliveryModalOpen, 
    onOpen: onConfirmDeliveryModalOpen, 
    onClose: onConfirmDeliveryModalClose 
  } = useDisclosure();

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
          startDate: new Date(dateRangeFilter.start.toString()).toISOString() 
        }),
        ...(dateRangeFilter.end && { 
          endDate: new Date(dateRangeFilter.end.toString()).toISOString() 
        }),
        ...(amountFilter.min && { minAmount: amountFilter.min.toString() }),
        ...(amountFilter.max && { maxAmount: amountFilter.max.toString() })
      });

      // En producción, esta API debe filtrar automáticamente por el proveedor actual
      const response = await fetch(`/api/inventory/purchase-orders?${queryParams}`);
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
    onDetailModalOpen();
  };

  const handleConfirmDelivery = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setDeliveryNote({ note: "" });
    onConfirmDeliveryModalOpen();
  };

  const submitDeliveryConfirmation = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`/api/inventory/purchase-orders/${selectedOrder._id}`, {
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
        onConfirmDeliveryModalClose();
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
        return "default";
      case PurchaseOrderStatus.PENDING:
        return "warning";
      case PurchaseOrderStatus.APPROVED:
        return "primary";
      case PurchaseOrderStatus.ORDERED:
        return "secondary";
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

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar órdenes por ID o productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="flat"
            color="default"
            startContent={<FunnelIcon className="w-4 h-4" />}
            onPress={() => setShowFilters(!showFilters)}
          >
            Filtros
            {(statusFilter || dateRangeFilter.start || amountFilter.min) && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                {[
                  statusFilter && "1",
                  (dateRangeFilter.start || dateRangeFilter.end) && "1",
                  (amountFilter.min || amountFilter.max) && "1"
                ].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <Card className="border border-gray-200">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Filtros Avanzados</h3>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setShowFilters(false)}
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | "")}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value={PurchaseOrderStatus.PENDING}>Pendiente</option>
                  <option value={PurchaseOrderStatus.APPROVED}>Aprobada</option>
                  <option value={PurchaseOrderStatus.ORDERED}>En Proceso</option>
                  <option value={PurchaseOrderStatus.RECEIVED}>Completada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rango de Fechas</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="sr-only">Desde</label>
                    <DatePicker
                      value={dateRangeFilter.start}
                      onChange={(date) => setDateRangeFilter(prev => ({ ...prev, start: date || undefined }))}
                      className="w-full"
                      aria-label="Fecha inicial"
                      classNames={{
                        base: "bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-3 w-full"
                      }}
                    />
                    <span className="text-xs text-gray-500 mt-1">Desde</span>
                  </div>
                  <div className="flex-1">
                    <label className="sr-only">Hasta</label>
                    <DatePicker
                      value={dateRangeFilter.end}
                      onChange={(date) => setDateRangeFilter(prev => ({ ...prev, end: date || undefined }))}
                      className="w-full"
                      aria-label="Fecha final"
                      classNames={{
                        base: "bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-3 w-full"
                      }}
                    />
                    <span className="text-xs text-gray-500 mt-1">Hasta</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mínimo"
                    value={amountFilter.min?.toString() || ""}
                    onChange={(e) => setAmountFilter(prev => ({ ...prev, min: e.target.value ? Number(e.target.value) : undefined }))}
                    startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    type="number"
                    placeholder="Máximo"
                    value={amountFilter.max?.toString() || ""}
                    onChange={(e) => setAmountFilter(prev => ({ ...prev, max: e.target.value ? Number(e.target.value) : undefined }))}
                    startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="light"
                size="sm"
                onPress={clearFilters}
              >
                Limpiar Filtros
              </Button>
              <Button
                color="primary"
                size="sm"
                onPress={() => fetchOrders()}
              >
                Aplicar Filtros
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabla de órdenes */}
      <Card className="border border-gray-200">
        <CardBody className="p-0">
          <Table
            aria-label="Tabla de órdenes de compra"
            classNames={{
              wrapper: "min-h-[400px]",
            }}
          >
            <TableHeader>
              <TableColumn>ORDEN ID</TableColumn>
              <TableColumn>FECHA</TableColumn>
              <TableColumn>PRODUCTOS</TableColumn>
              <TableColumn>MONTO</TableColumn>
              <TableColumn>ENTREGA</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody
              items={orders}
              isLoading={loading}
              loadingContent={<Spinner label="Cargando órdenes..." />}
              emptyContent="No se encontraron órdenes"
            >
              {(order) => (
                <TableRow 
                  key={order._id}
                  className={isOrderLate(order) ? "bg-red-50" : undefined}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{order.purchaseOrderId}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-gray-900">{formatDate(order.createdAt)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.items.length} productos</p>
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">
                        {order.items.map(item => item.productName).join(", ")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{formatCurrency(order.total)}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {order.expectedDeliveryDate 
                          ? formatDate(order.expectedDeliveryDate)
                          : "No programada"}
                      </p>
                      {isOrderLate(order) && (
                        <Chip 
                          size="sm" 
                          color="danger" 
                          variant="flat"
                          startContent={<ExclamationTriangleIcon className="w-3 h-3" />}
                        >
                          Retrasada
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={getStatusColor(order.status)}
                      startContent={getStatusIcon(order.status)}
                    >
                      {getStatusLabel(order.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleViewOrder(order)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      
                      {canConfirmDelivery(order) && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="success"
                          onPress={() => handleConfirmDelivery(order)}
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center p-4">
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

      {/* Modal de detalle de orden */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={onDetailModalClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Orden de Compra: {selectedOrder?.purchaseOrderId}
                  </h3>
                  <Chip 
                    color={selectedOrder ? getStatusColor(selectedOrder.status) : "default"}
                    size="sm"
                  >
                    {selectedOrder ? getStatusLabel(selectedOrder.status) : ""}
                  </Chip>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedOrder && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Información General</h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Fecha de Creación:</span>
                            <span className="text-sm font-medium">{formatDate(selectedOrder.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Última Actualización:</span>
                            <span className="text-sm font-medium">{formatDate(selectedOrder.updatedAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total:</span>
                            <span className="text-sm font-medium">{formatCurrency(selectedOrder.total)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Entrega</h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Fecha Esperada:</span>
                            <span className="text-sm font-medium">
                              {selectedOrder.expectedDeliveryDate 
                                ? formatDate(selectedOrder.expectedDeliveryDate)
                                : "No especificada"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Fecha Real:</span>
                            <span className="text-sm font-medium">
                              {selectedOrder.actualDeliveryDate 
                                ? formatDate(selectedOrder.actualDeliveryDate)
                                : "Pendiente"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Ubicación:</span>
                            <span className="text-sm font-medium">{selectedOrder.deliveryLocation}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Productos</h4>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedOrder.items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity} {item.unit}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan={2} className="px-3 py-2"></td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-500 text-right">Subtotal:</td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(selectedOrder.subtotal)}</td>
                            </tr>
                            <tr>
                              <td colSpan={2} className="px-3 py-2"></td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-500 text-right">Impuestos:</td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(selectedOrder.tax)}</td>
                            </tr>
                            <tr>
                              <td colSpan={2} className="px-3 py-2"></td>
                              <td className="px-3 py-2 text-sm font-bold text-gray-700 text-right">Total:</td>
                              <td className="px-3 py-2 text-sm font-bold text-gray-900 text-right">{formatCurrency(selectedOrder.total)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {selectedOrder.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Notas</h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="default" 
                  variant="light" 
                  onPress={onClose}
                >
                  Cerrar
                </Button>
                {selectedOrder && canConfirmDelivery(selectedOrder) && (
                  <Button
                    color="success"
                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                    onPress={() => {
                      onClose();
                      handleConfirmDelivery(selectedOrder);
                    }}
                  >
                    Confirmar Entrega
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de confirmación de entrega */}
      <Modal
        isOpen={isConfirmDeliveryModalOpen}
        onClose={onConfirmDeliveryModalClose}
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Confirmar Entrega</h3>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      Estás a punto de confirmar la entrega de la orden: <strong>{selectedOrder?.purchaseOrderId}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas de Entrega (opcional)
                    </label>
                    <Textarea
                      placeholder="Agregar notas sobre la entrega..."
                      value={deliveryNote.note}
                      onChange={(e) => setDeliveryNote({ note: e.target.value })}
                      minRows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adjuntar Documentos (opcional)
                    </label>
                    <Button
                      startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                      variant="flat"
                      size="sm"
                      className="w-full justify-start"
                    >
                      Subir documentos
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">
                      Puedes adjuntar remisiones, fotos u otros documentos relacionados.
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="default" 
                  variant="light" 
                  onPress={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  color="success"
                  startContent={<CheckCircleIcon className="w-4 h-4" />}
                  onPress={submitDeliveryConfirmation}
                >
                  Confirmar Entrega
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}