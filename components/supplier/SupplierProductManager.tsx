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
  Switch,
  Select,
  SelectItem,
  Tabs,
  Tab
} from "@heroui/react"
import {
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  TagIcon,
  CubeIcon,
  QrCodeIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  FolderPlusIcon,
  PhotoIcon
} from "@heroicons/react/24/outline"
import toast from "react-hot-toast"

// Product status enum
enum ProductApprovalStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

// Product interface
interface Product {
  _id: string;
  productId: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  barcode?: string;
  baseUnit: string;
  units: {
    base: {
      code: string;
      name: string;
      category: string;
    };
    alternatives: {
      code: string;
      name: string;
      category: string;
      conversionFactor: number;
      conversionType: string;
      containedUnit?: string;
    }[];
  };
  pricing: {
    tieredPricing: {
      minQuantity: number;
      maxQuantity: number;
      unit: string;
      pricePerUnit: number;
      type: string;
    }[];
    lastCost?: number;
    averageCost?: number;
  };
  suppliers: {
    supplierId: string;
    supplierName: string;
    isPreferred: boolean;
    lastPurchasePrice?: number;
    leadTimeDays: number;
  }[];
  stockLevels: {
    minimum: number;
    reorderPoint: number;
    unit: string;
  };
  images?: string[];
  tags?: string[];
  isActive: boolean;
  isPerishable: boolean;
  requiresBatch: boolean;
  approvalStatus?: ProductApprovalStatus;
  rejectionReason?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

// New product form interface
interface NewProductForm {
  name: string;
  description: string;
  category: string;
  sku: string;
  barcode?: string;
  baseUnit: string;
  costPrice: number;
  unitPrice: number;
  minStock: number;
  reorderPoint: number;
  isPerishable: boolean;
  requiresBatch: boolean;
  tags: string[];
  images: string[];
}

export default function SupplierProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: "",
    description: "",
    category: "",
    sku: "",
    barcode: "",
    baseUnit: "unidad", // Default
    costPrice: 0,
    unitPrice: 0,
    minStock: 0,
    reorderPoint: 5,
    isPerishable: false,
    requiresBatch: true,
    tags: [],
    images: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [priceHistoryData, setPriceHistoryData] = useState<any[]>([]);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);
  const [modalView, setModalView] = useState<'details' | 'edit' | 'price' | 'stock'>('details');
  const [formError, setFormError] = useState<string | null>(null);
  
  const { 
    isOpen: isProductModalOpen, 
    onOpen: onProductModalOpen, 
    onClose: onProductModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isNewProductModalOpen, 
    onOpen: onNewProductModalOpen, 
    onClose: onNewProductModalClose 
  } = useDisclosure();

  const itemsPerPage = 10;
  const categories = [
    "Alimentos",
    "Bebidas",
    "Insumos de Limpieza",
    "Materiales de Cocina",
    "Decoración",
    "Servicios",
    "Otros"
  ];
  
  const unitOptions = [
    { value: "unidad", label: "Unidad" },
    { value: "kg", label: "Kilogramo" },
    { value: "g", label: "Gramo" },
    { value: "l", label: "Litro" },
    { value: "ml", label: "Mililitro" },
    { value: "caja", label: "Caja" },
    { value: "paquete", label: "Paquete" },
    { value: "pza", label: "Pieza" }
  ];

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, statusFilter, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { approvalStatus: statusFilter }),
        ...(categoryFilter && { category: categoryFilter })
      });

      // En producción, esta API debe filtrar automáticamente por el proveedor actual
      const response = await fetch(`/api/inventory/products?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        toast.error("Error al cargar los productos");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (productId: string) => {
    setLoadingPriceHistory(true);
    try {
      const response = await fetch(`/api/supplier/products/${productId}/price-history`);
      
      if (response.ok) {
        const data = await response.json();
        // Format dates and ensure consistent data structure
        const formattedHistory = data.history.map((item: any) => ({
          date: new Date(item.date).toISOString().split('T')[0],
          costPrice: item.costPrice || 0,
          unitPrice: item.unitPrice || 0
        }));
        setPriceHistoryData(formattedHistory);
      } else {
        const errorData = await response.json();
        console.error("Error in price history response:", errorData);
        toast.error(errorData.error || "Error al cargar el historial de precios");
      }
    } catch (error) {
      console.error("Error fetching price history:", error);
      toast.error("Error al cargar el historial de precios");
    } finally {
      setLoadingPriceHistory(false);
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalView('details');
    onProductModalOpen();
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalView('edit');
    onProductModalOpen();
  };

  const handleViewPriceHistory = (product: Product) => {
    setSelectedProduct(product);
    setModalView('price');
    fetchPriceHistory(product._id);
    onProductModalOpen();
  };

  const handleEditStock = (product: Product) => {
    setSelectedProduct(product);
    setModalView('stock');
    onProductModalOpen();
  };

  const handleCreateProduct = () => {
    // Reset form
    setNewProduct({
      name: "",
      description: "",
      category: "",
      sku: "",
      barcode: "",
      baseUnit: "unidad",
      costPrice: 0,
      unitPrice: 0,
      minStock: 0,
      reorderPoint: 5,
      isPerishable: false,
      requiresBatch: true,
      tags: [],
      images: []
    });
    setFormError(null);
    onNewProductModalOpen();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newProduct.tags.includes(newTag.trim())) {
      setNewProduct(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewProduct(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const validateNewProduct = () => {
    if (!newProduct.name) {
      setFormError("El nombre del producto es obligatorio");
      return false;
    }
    if (!newProduct.category) {
      setFormError("La categoría es obligatoria");
      return false;
    }
    if (!newProduct.sku) {
      setFormError("El SKU es obligatorio");
      return false;
    }
    if (newProduct.costPrice <= 0) {
      setFormError("El precio de costo debe ser mayor a 0");
      return false;
    }
    if (newProduct.unitPrice <= 0) {
      setFormError("El precio unitario debe ser mayor a 0");
      return false;
    }
    
    setFormError(null);
    return true;
  };

  const submitNewProduct = async () => {
    if (!validateNewProduct()) return;

    setLoading(true);
    try {
      // Prepare data for API
      const productData = {
        ...newProduct,
        approvalStatus: ProductApprovalStatus.PENDING_APPROVAL,
        pricing: {
          tieredPricing: [
            {
              minQuantity: 1,
              maxQuantity: 999999,
              unit: newProduct.baseUnit,
              pricePerUnit: newProduct.unitPrice,
              type: "retail"
            }
          ],
          lastCost: newProduct.costPrice
        },
        stockLevels: {
          minimum: newProduct.minStock,
          reorderPoint: newProduct.reorderPoint,
          unit: newProduct.baseUnit
        },
        units: {
          base: {
            code: newProduct.baseUnit,
            name: unitOptions.find(u => u.value === newProduct.baseUnit)?.label || newProduct.baseUnit,
            category: "piece"
          },
          alternatives: []
        }
      };

      const response = await fetch("/api/inventory/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        toast.success("Producto enviado para aprobación");
        fetchProducts();
        onNewProductModalClose();
      } else {
        const error = await response.json();
        setFormError(error.message || "Error al crear el producto");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setFormError("Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const updateProductPrice = async (productId: string, newCostPrice: number, newUnitPrice: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pricing: {
            lastCost: newCostPrice,
            tieredPricing: [
              {
                minQuantity: 1,
                maxQuantity: 999999,
                unit: selectedProduct?.baseUnit || "unidad",
                pricePerUnit: newUnitPrice,
                type: "retail"
              }
            ]
          }
        })
      });

      if (response.ok) {
        toast.success("Precio actualizado correctamente");
        fetchProducts();
        onProductModalClose();
      } else {
        toast.error("Error al actualizar el precio");
      }
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Error al actualizar el precio");
    } finally {
      setLoading(false);
    }
  };

  const updateProductStock = async (productId: string, minStock: number, reorderPoint: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          stockLevels: {
            minimum: minStock,
            reorderPoint: reorderPoint,
            unit: selectedProduct?.stockLevels.unit || "unidad"
          }
        })
      });

      if (response.ok) {
        toast.success("Niveles de inventario actualizados correctamente");
        fetchProducts();
        onProductModalClose();
      } else {
        toast.error("Error al actualizar niveles de inventario");
      }
    } catch (error) {
      console.error("Error updating stock levels:", error);
      toast.error("Error al actualizar niveles de inventario");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const getApprovalStatusColor = (status?: ProductApprovalStatus) => {
    switch (status) {
      case ProductApprovalStatus.PENDING_APPROVAL:
        return "warning";
      case ProductApprovalStatus.APPROVED:
        return "success";
      case ProductApprovalStatus.REJECTED:
        return "danger";
      default:
        return "success"; // Already approved (no status)
    }
  };

  const getApprovalStatusLabel = (status?: ProductApprovalStatus) => {
    switch (status) {
      case ProductApprovalStatus.PENDING_APPROVAL:
        return "Pendiente de Aprobación";
      case ProductApprovalStatus.APPROVED:
        return "Aprobado";
      case ProductApprovalStatus.REJECTED:
        return "Rechazado";
      default:
        return "Aprobado"; // Already approved (no status)
    }
  };

  const getApprovalStatusIcon = (status?: ProductApprovalStatus) => {
    switch (status) {
      case ProductApprovalStatus.PENDING_APPROVAL:
        return <ClockIcon className="w-4 h-4" />;
      case ProductApprovalStatus.APPROVED:
        return <CheckCircleIcon className="w-4 h-4" />;
      case ProductApprovalStatus.REJECTED:
        return <NoSymbolIcon className="w-4 h-4" />;
      default:
        return <CheckCircleIcon className="w-4 h-4" />; // Already approved (no status)
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar productos por nombre, SKU o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleCreateProduct}
          >
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Filtros y categorías */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="border border-gray-200 flex-1">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Filtros</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value={ProductApprovalStatus.PENDING_APPROVAL}>Pendiente de Aprobación</option>
                  <option value={ProductApprovalStatus.APPROVED}>Aprobado</option>
                  <option value={ProductApprovalStatus.REJECTED}>Rechazado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="light"
                  size="sm"
                  onPress={clearFilters}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabla de productos */}
      <Card className="border border-gray-200">
        <CardBody className="p-0">
          <Table
            aria-label="Tabla de productos"
            classNames={{
              wrapper: "min-h-[400px]",
            }}
          >
            <TableHeader>
              <TableColumn>PRODUCTO</TableColumn>
              <TableColumn>SKU / CÓDIGO</TableColumn>
              <TableColumn>CATEGORÍA</TableColumn>
              <TableColumn>PRECIOS</TableColumn>
              <TableColumn>STOCK</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody
              items={products}
              isLoading={loading}
              loadingContent={<Spinner label="Cargando productos..." />}
              emptyContent="No se encontraron productos"
            >
              {(product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name} 
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <CubeIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">
                          {product.description || "Sin descripción"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{product.sku}</p>
                      {product.barcode && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <QrCodeIcon className="w-3 h-3" />
                          <span>{product.barcode}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color="default">
                      {product.category}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">Costo:</span> {formatCurrency(product.pricing.lastCost || 0)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Venta:</span> {formatCurrency(product.pricing.tieredPricing?.[0]?.pricePerUnit || 0)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">Mínimo:</span> {product.stockLevels.minimum} {product.stockLevels.unit}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reorden:</span> {product.stockLevels.reorderPoint} {product.stockLevels.unit}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={getApprovalStatusColor(product.approvalStatus)}
                      startContent={getApprovalStatusIcon(product.approvalStatus)}
                    >
                      {getApprovalStatusLabel(product.approvalStatus)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleViewProduct(product)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      
                      {(!product.approvalStatus || product.approvalStatus === ProductApprovalStatus.APPROVED) && (
                        <>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => handleEditProduct(product)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                              >
                                <svg width="20" height="20" viewBox="0 0 20 20">
                                  <path d="M6 10C6 11.1046 5.10457 12 4 12C2.89543 12 2 11.1046 2 10C2 8.89543 2.89543 8 4 8C5.10457 8 6 8.89543 6 10Z" fill="currentColor" />
                                  <path d="M12 10C12 11.1046 11.1046 12 10 12C8.89543 12 8 11.1046 8 10C8 8.89543 8.89543 8 10 8C11.1046 8 12 8.89543 12 10Z" fill="currentColor" />
                                  <path d="M18 10C18 11.1046 17.1046 12 16 12C14.8954 12 14 11.1046 14 10C14 8.89543 14.8954 8 16 8C17.1046 8 18 8.89543 18 10Z" fill="currentColor" />
                                </svg>
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Acciones">
                              <DropdownItem 
                                key="price" 
                                startContent={<TagIcon className="w-4 h-4" />}
                                onPress={() => handleViewPriceHistory(product)}
                              >
                                Precios
                              </DropdownItem>
                              <DropdownItem 
                                key="stock" 
                                startContent={<ShoppingCartIcon className="w-4 h-4" />}
                                onPress={() => handleEditStock(product)}
                              >
                                Inventario
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </>
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

      {/* Modal de producto - Detalles, Edición, Precios o Stock */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={onProductModalClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {modalView === 'details' && "Detalles del Producto"}
                    {modalView === 'edit' && "Editar Producto"}
                    {modalView === 'price' && "Historial de Precios"}
                    {modalView === 'stock' && "Niveles de Inventario"}
                  </h3>
                  {selectedProduct && (
                    <Chip 
                      color={getApprovalStatusColor(selectedProduct.approvalStatus)}
                      size="sm"
                      startContent={getApprovalStatusIcon(selectedProduct.approvalStatus)}
                    >
                      {getApprovalStatusLabel(selectedProduct.approvalStatus)}
                    </Chip>
                  )}
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedProduct && (
                  <>
                    {/* Vista de detalles */}
                    {modalView === 'details' && (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="md:w-1/3">
                            <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                              {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                <img 
                                  src={selectedProduct.images[0]} 
                                  alt={selectedProduct.name} 
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : (
                                <CubeIcon className="w-16 h-16 text-gray-400" />
                              )}
                            </div>
                          </div>
                          <div className="md:w-2/3 space-y-4">
                            <div>
                              <h2 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h2>
                              <p className="text-sm text-gray-600">{selectedProduct.description || "Sin descripción"}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <h4 className="text-xs font-medium text-gray-500">SKU</h4>
                                <p className="text-sm font-medium">{selectedProduct.sku}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-medium text-gray-500">Categoría</h4>
                                <p className="text-sm font-medium">{selectedProduct.category}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-medium text-gray-500">Unidad Base</h4>
                                <p className="text-sm font-medium">{selectedProduct.units.base.name}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-medium text-gray-500">Código de Barras</h4>
                                <p className="text-sm font-medium">{selectedProduct.barcode || "No disponible"}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedProduct.tags && selectedProduct.tags.map((tag) => (
                                <Chip key={tag} size="sm" variant="flat">
                                  {tag}
                                </Chip>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Precios</h4>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Precio de Costo:</span>
                                <span className="text-sm font-medium">{formatCurrency(selectedProduct.pricing.lastCost || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Precio de Venta:</span>
                                <span className="text-sm font-medium">{formatCurrency(selectedProduct.pricing.tieredPricing?.[0]?.pricePerUnit || 0)}</span>
                              </div>
                              {selectedProduct.pricing.averageCost && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Costo Promedio:</span>
                                  <span className="text-sm font-medium">{formatCurrency(selectedProduct.pricing.averageCost)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Niveles de Stock</h4>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Stock Mínimo:</span>
                                <span className="text-sm font-medium">{selectedProduct.stockLevels.minimum} {selectedProduct.units.base.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Punto de Reorden:</span>
                                <span className="text-sm font-medium">{selectedProduct.stockLevels.reorderPoint} {selectedProduct.units.base.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Características</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2">
                                <Switch isSelected={selectedProduct.isPerishable} isDisabled size="sm" />
                                <span className="text-sm">Producto Perecedero</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch isSelected={selectedProduct.requiresBatch} isDisabled size="sm" />
                                <span className="text-sm">Requiere Lote</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Información Adicional</h4>
                          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Fecha de Creación:</span>
                              <span className="text-sm font-medium">{new Date(selectedProduct.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Última Actualización:</span>
                              <span className="text-sm font-medium">{new Date(selectedProduct.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        {selectedProduct.approvalStatus === ProductApprovalStatus.REJECTED && selectedProduct.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-red-700 mb-1">Motivo de Rechazo</h4>
                            <p className="text-sm text-red-600">{selectedProduct.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Vista de edición */}
                    {modalView === 'edit' && (
                      <div className="space-y-4">
                        <Input
                          label="Nombre del Producto"
                          placeholder="Nombre del producto"
                          value={selectedProduct.name}
                          onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                        />
                        
                        <Textarea
                          label="Descripción"
                          placeholder="Descripción del producto"
                          value={selectedProduct.description || ""}
                          onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})}
                        />
                        
                        <div className="flex gap-4">
                          <Input
                            label="SKU"
                            placeholder="SKU"
                            value={selectedProduct.sku || ""}
                            onChange={(e) => setSelectedProduct({...selectedProduct, sku: e.target.value})}
                            className="flex-1"
                          />
                          
                          <Input
                            label="Código de Barras"
                            placeholder="Código de barras"
                            value={selectedProduct.barcode || ""}
                            onChange={(e) => setSelectedProduct({...selectedProduct, barcode: e.target.value})}
                            className="flex-1"
                          />
                        </div>
                        
                        <div className="flex gap-4">
                          <Select
                            label="Categoría"
                            placeholder="Selecciona la categoría"
                            selectedKeys={[selectedProduct.category]}
                            onChange={(keys: any) => {
                              const selectedKey = keys.target?.value || Array.from(keys || [])[0] || '';
                              setSelectedProduct({...selectedProduct, category: selectedKey.toString()});
                            }}
                            className="flex-1"
                          >
                            {categories.map((category) => (
                              <SelectItem key={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </Select>
                          
                          <Select
                            label="Unidad Base"
                            placeholder="Selecciona la unidad base"
                            selectedKeys={[selectedProduct.baseUnit]}
                            onChange={(keys: any) => {
                              const selectedKey = keys.target?.value || Array.from(keys || [])[0] || '';
                              setSelectedProduct({...selectedProduct, baseUnit: selectedKey.toString()});
                            }}
                            className="flex-1"
                          >
                            {unitOptions.map((unit) => (
                              <SelectItem key={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Switch
                              isSelected={selectedProduct.isPerishable}
                              onValueChange={(value) => setSelectedProduct({...selectedProduct, isPerishable: value})}
                            >
                              Producto Perecedero
                            </Switch>
                          </div>
                          <div className="flex-1">
                            <Switch
                              isSelected={selectedProduct.requiresBatch}
                              onValueChange={(value) => setSelectedProduct({...selectedProduct, requiresBatch: value})}
                            >
                              Requiere Lote
                            </Switch>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Etiquetas</h4>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {selectedProduct.tags && selectedProduct.tags.map((tag) => (
                              <Chip 
                                key={tag} 
                                onClose={() => setSelectedProduct({
                                  ...selectedProduct, 
                                  tags: selectedProduct.tags?.filter(t => t !== tag) || []
                                })}
                              >
                                {tag}
                              </Chip>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nueva etiqueta"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              color="primary" 
                              onPress={() => {
                                if (newTag.trim() && !selectedProduct.tags?.includes(newTag.trim())) {
                                  setSelectedProduct({
                                    ...selectedProduct, 
                                    tags: [...(selectedProduct.tags || []), newTag.trim()]
                                  });
                                  setNewTag("");
                                }
                              }}
                            >
                              Agregar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Vista de historial de precios */}
                    {modalView === 'price' && (
                      <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Precios Actuales</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              type="number"
                              label="Precio de Costo (MXN)"
                              placeholder="0.00"
                              startContent={
                                <div className="pointer-events-none flex items-center">
                                  <span className="text-default-400 text-small">$</span>
                                </div>
                              }
                              value={(selectedProduct.pricing.lastCost || 0).toString()}
                              onChange={(e) => setSelectedProduct({
                                ...selectedProduct,
                                pricing: {
                                  ...selectedProduct.pricing,
                                  lastCost: parseFloat(e.target.value)
                                }
                              })}
                            />
                            
                            <Input
                              type="number"
                              label="Precio de Venta (MXN)"
                              placeholder="0.00"
                              startContent={
                                <div className="pointer-events-none flex items-center">
                                  <span className="text-default-400 text-small">$</span>
                                </div>
                              }
                              value={(selectedProduct.pricing.tieredPricing?.[0]?.pricePerUnit || 0).toString()}
                              onChange={(e) => {
                                const tieredPricing = [...(selectedProduct.pricing.tieredPricing || [])];
                                if (tieredPricing.length > 0) {
                                  tieredPricing[0] = {
                                    ...tieredPricing[0],
                                    pricePerUnit: parseFloat(e.target.value)
                                  };
                                } else {
                                  tieredPricing.push({
                                    minQuantity: 1,
                                    maxQuantity: 999999,
                                    unit: selectedProduct.baseUnit,
                                    pricePerUnit: parseFloat(e.target.value),
                                    type: "retail"
                                  });
                                }
                                
                                setSelectedProduct({
                                  ...selectedProduct,
                                  pricing: {
                                    ...selectedProduct.pricing,
                                    tieredPricing
                                  }
                                });
                              }}
                            />
                          </div>
                          
                          <Button
                            color="primary"
                            className="w-full mt-4"
                            onPress={() => updateProductPrice(
                              selectedProduct._id,
                              selectedProduct.pricing.lastCost || 0,
                              selectedProduct.pricing.tieredPricing?.[0]?.pricePerUnit || 0
                            )}
                          >
                            Actualizar Precios
                          </Button>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Historial de Precios</h4>
                          {loadingPriceHistory ? (
                            <div className="flex justify-center py-8">
                              <Spinner />
                            </div>
                          ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio de Costo</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio de Venta</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {priceHistoryData.map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                      {new Date(item.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                                      {formatCurrency(item.costPrice)}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                                      {formatCurrency(item.unitPrice)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Vista de niveles de stock */}
                    {modalView === 'stock' && (
                      <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Niveles de Inventario</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              type="number"
                              label={`Stock Mínimo (${selectedProduct.stockLevels.unit})`}
                              placeholder="0"
                              value={selectedProduct.stockLevels.minimum.toString()}
                              onChange={(e) => setSelectedProduct({
                                ...selectedProduct,
                                stockLevels: {
                                  ...selectedProduct.stockLevels,
                                  minimum: parseInt(e.target.value)
                                }
                              })}
                            />
                            
                            <Input
                              type="number"
                              label={`Punto de Reorden (${selectedProduct.stockLevels.unit})`}
                              placeholder="0"
                              value={selectedProduct.stockLevels.reorderPoint.toString()}
                              onChange={(e) => setSelectedProduct({
                                ...selectedProduct,
                                stockLevels: {
                                  ...selectedProduct.stockLevels,
                                  reorderPoint: parseInt(e.target.value)
                                }
                              })}
                            />
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-xs text-gray-500 mb-2">
                              <span className="font-medium">Nota:</span> El stock mínimo indica el nivel crítico por debajo del cual no debería caer el inventario.
                              El punto de reorden indica el nivel en el que se debe generar una alerta para realizar un nuevo pedido.
                            </p>
                          </div>
                          
                          <Button
                            color="primary"
                            className="w-full mt-4"
                            onPress={() => updateProductStock(
                              selectedProduct._id,
                              selectedProduct.stockLevels.minimum,
                              selectedProduct.stockLevels.reorderPoint
                            )}
                          >
                            Actualizar Niveles de Inventario
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
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
                
                {modalView === 'details' && selectedProduct && (!selectedProduct.approvalStatus || selectedProduct.approvalStatus === ProductApprovalStatus.APPROVED) && (
                  <Button
                    color="primary"
                    onPress={() => {
                      setModalView('edit');
                    }}
                  >
                    Editar Producto
                  </Button>
                )}
                
                {modalView === 'edit' && (
                  <Button
                    color="primary"
                    onPress={() => {
                      // Implementar guardado de cambios aquí
                      toast.success("Cambios guardados correctamente");
                      onClose();
                    }}
                  >
                    Guardar Cambios
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de nuevo producto */}
      <Modal
        isOpen={isNewProductModalOpen}
        onClose={onNewProductModalClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Registrar Nuevo Producto</h3>
                <p className="text-xs text-gray-500">
                  Los productos nuevos requerirán aprobación de un administrador antes de estar disponibles en el sistema.
                </p>
              </ModalHeader>
              <ModalBody>
                <Tabs variant="underlined" aria-label="Registro de producto">
                  <Tab key="basic" title="Información Básica">
                    <div className="py-2">
                      <div className="space-y-4">
                        <Input
                          isRequired
                          label="Nombre del Producto"
                          placeholder="Nombre completo del producto"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        />
                        
                        <Textarea
                          label="Descripción"
                          placeholder="Descripción detallada del producto"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            isRequired
                            label="SKU (Código Interno)"
                            placeholder="SKU único para este producto"
                            value={newProduct.sku}
                            onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                          />
                          
                          <Input
                            label="Código de Barras"
                            placeholder="Código de barras si está disponible"
                            value={newProduct.barcode}
                            onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Select
                            isRequired
                            label="Categoría"
                            placeholder="Selecciona la categoría"
                            selectedKeys={newProduct.category ? [newProduct.category] : []}
                            onChange={(keys: any) => {
                              const selectedKey = keys.target?.value || Array.from(keys || [])[0] || '';
                              setNewProduct({...newProduct, category: selectedKey.toString()});
                            }}
                          >
                            {categories.map((category) => (
                              <SelectItem key={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </Select>
                          
                          <Select
                            isRequired
                            label="Unidad Base"
                            placeholder="Selecciona la unidad base"
                            selectedKeys={[newProduct.baseUnit]}
                            onChange={(keys: any) => {
                              const selectedKey = keys.target?.value || Array.from(keys || [])[0] || '';
                              setNewProduct({...newProduct, baseUnit: selectedKey.toString()});
                            }}
                          >
                            {unitOptions.map((unit) => (
                              <SelectItem key={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Switch
                              isSelected={newProduct.isPerishable}
                              onValueChange={(value) => setNewProduct({...newProduct, isPerishable: value})}
                            >
                              Producto Perecedero
                            </Switch>
                            <p className="text-xs text-gray-500 ml-7">
                              Los productos perecederos requieren control de fechas de caducidad
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Switch
                              isSelected={newProduct.requiresBatch}
                              onValueChange={(value) => setNewProduct({...newProduct, requiresBatch: value})}
                            >
                              Requiere Lote
                            </Switch>
                            <p className="text-xs text-gray-500 ml-7">
                              Los productos con lote requieren seguimiento por número de lote
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab>
                  
                  <Tab key="pricing" title="Precios e Inventario">
                    <div className="py-2">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            isRequired
                            type="number"
                            label="Precio de Costo (MXN)"
                            placeholder="0.00"
                            startContent={
                              <div className="pointer-events-none flex items-center">
                                <span className="text-default-400 text-small">$</span>
                              </div>
                            }
                            value={newProduct.costPrice.toString()}
                            onChange={(e) => setNewProduct({...newProduct, costPrice: parseFloat(e.target.value) || 0})}
                          />
                          
                          <Input
                            isRequired
                            type="number"
                            label="Precio de Venta (MXN)"
                            placeholder="0.00"
                            startContent={
                              <div className="pointer-events-none flex items-center">
                                <span className="text-default-400 text-small">$</span>
                              </div>
                            }
                            value={newProduct.unitPrice.toString()}
                            onChange={(e) => setNewProduct({...newProduct, unitPrice: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            type="number"
                            label={`Stock Mínimo (${newProduct.baseUnit})`}
                            placeholder="0"
                            value={newProduct.minStock.toString()}
                            onChange={(e) => setNewProduct({...newProduct, minStock: parseInt(e.target.value) || 0})}
                          />
                          
                          <Input
                            type="number"
                            label={`Punto de Reorden (${newProduct.baseUnit})`}
                            placeholder="0"
                            value={newProduct.reorderPoint.toString()}
                            onChange={(e) => setNewProduct({...newProduct, reorderPoint: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Gestión de Inventario</h4>
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Stock Mínimo:</span> Nivel crítico por debajo del cual no debería caer el inventario.
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Punto de Reorden:</span> Nivel en el que se debe generar una alerta para realizar un nuevo pedido.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Tab>
                  
                  <Tab key="additional" title="Información Adicional">
                    <div className="py-2">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Etiquetas</h4>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {newProduct.tags.map((tag) => (
                              <Chip 
                                key={tag} 
                                onClose={() => handleRemoveTag(tag)}
                              >
                                {tag}
                              </Chip>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nueva etiqueta"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              color="primary" 
                              onPress={handleAddTag}
                            >
                              Agregar
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Las etiquetas ayudan a categorizar y encontrar el producto más fácilmente
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Imágenes del Producto</h4>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <div className="flex justify-center mb-4">
                              <PhotoIcon className="w-10 h-10 text-gray-400" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              Sube imágenes del producto
                            </h4>
                            <p className="text-xs text-gray-500 mb-4">
                              PNG, JPG, o WEBP hasta 5MB
                            </p>
                            <Button
                              startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                              color="primary"
                              variant="flat"
                              size="sm"
                            >
                              Seleccionar Archivo
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab>
                </Tabs>
                
                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-red-600">{formError}</p>
                  </div>
                )}
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
                  color="primary"
                  isLoading={loading}
                  onPress={submitNewProduct}
                  startContent={<FolderPlusIcon className="w-4 h-4" />}
                >
                  Enviar para Aprobación
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}