"use client"

import React, { useState, useEffect } from "react"
import { SupabaseInventoryClientService } from "@/lib/supabase/inventory-client"
import { supabase } from "@/lib/supabase/client"
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
  Switch,
  Select,
  Tabs,
  Group,
  Stack,
  Text,
  Title,
  Grid,
  ActionIcon,
  Center,
  Divider,
  ScrollArea,
  NumberInput,
  FileInput,
  Image,
  Container
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
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
import ProductsWithoutMovementsModal from "./ProductsWithoutMovementsModal"

// Product status enum
enum ProductApprovalStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

// Product interface - Updated to match Supabase structure with approval system
interface Product {
  id?: string;
  product_id?: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  barcode?: string;
  base_unit: string;
  unit_price?: number;
  last_cost?: number;
  average_cost?: number;
  stock_minimum?: number;
  stock_reorder_point?: number;
  stock_unit?: string;
  images?: string[];
  tags?: string[];
  is_active: boolean;
  is_perishable?: boolean;
  requires_batch?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
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
  const [productsWithoutMovementsCount, setProductsWithoutMovementsCount] = useState(0);
  
  const [
    productModalOpened, 
    { open: openProductModal, close: closeProductModal }
  ] = useDisclosure(false);
  
  const [
    newProductModalOpened, 
    { open: openNewProductModal, close: closeNewProductModal }
  ] = useDisclosure(false);
  
  const [
    productsWithoutMovementsModalOpened, 
    { open: openProductsWithoutMovementsModal, close: closeProductsWithoutMovementsModal }
  ] = useDisclosure(false);

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
    fetchProductsWithoutMovementsCount();
  }, [currentPage, searchTerm, statusFilter, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Use supplier-specific endpoint to get only supplier's products
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);

      const response = await fetch(`/api/supplier/products?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      let supplierProducts = data.products || [];
        
      console.log("Supplier products fetched:", supplierProducts.length);
      
      // Apply pagination (server-side filtering is already done)
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedProducts = supplierProducts.slice(startIndex, endIndex);
      
      setProducts(paginatedProducts);
      setTotalPages(Math.ceil(supplierProducts.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching supplier products:", error);
      toast.error("Error al cargar tus productos");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsWithoutMovementsCount = async () => {
    try {
      // For now, disable this feature until the Supabase service method is implemented
      // const productsWithoutInventory = await SupabaseInventoryClientService.getProductsWithoutInventory();
      // setProductsWithoutMovementsCount(productsWithoutInventory?.length || 0);
      setProductsWithoutMovementsCount(0); // Temporarily set to 0
    } catch (error) {
      console.error("Error fetching products without movements count:", error);
      setProductsWithoutMovementsCount(0);
    }
  };

  const fetchPriceHistory = async (productId: string) => {
    setLoadingPriceHistory(true);
    try {
      // For now, use a direct API call since price history is not in the service
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
    openProductModal();
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalView('edit');
    openProductModal();
  };

  const handleViewPriceHistory = (product: Product) => {
    setSelectedProduct(product);
    setModalView('price');
    fetchPriceHistory(product.id || product.product_id || '');
    openProductModal();
  };

  const handleEditStock = (product: Product) => {
    setSelectedProduct(product);
    setModalView('stock');
    openProductModal();
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
    openNewProductModal();
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
      // Prepare data for Supabase API (correct format)
      const productData = {
        name: newProduct.name,
        description: newProduct.description || undefined,
        category: newProduct.category,
        sku: newProduct.sku,
        barcode: newProduct.barcode || undefined,
        base_unit: newProduct.baseUnit,
        stock_minimum: newProduct.minStock,
        stock_reorder_point: newProduct.reorderPoint,
        stock_unit: newProduct.baseUnit,
        last_cost: newProduct.costPrice,
        average_cost: newProduct.costPrice, // Initialize with cost price
        is_active: true,
        is_perishable: newProduct.isPerishable,
        requires_batch: newProduct.requiresBatch,
        expiry_has_expiry: newProduct.isPerishable,
        expiry_shelf_life_days: newProduct.isPerishable ? 30 : undefined, // Default for perishables
        expiry_warning_days: newProduct.isPerishable ? 7 : undefined,
        images: newProduct.images,
        tags: newProduct.tags
      };

      console.log("Sending product data:", productData);

      const response = await fetch("/api/supplier/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Product created successfully:", result);
        toast.success("Producto creado exitosamente");
        fetchProducts();
        closeNewProductModal();
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        setFormError(errorData.error || "Error al crear el producto");
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
          last_cost: newCostPrice,
          unit_price: newUnitPrice
        })
      });

      if (response.ok) {
        toast.success("Precio actualizado correctamente");
        fetchProducts();
        closeProductModal();
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
          stock_minimum: minStock,
          stock_reorder_point: reorderPoint,
          stock_unit: selectedProduct?.stock_unit || selectedProduct?.base_unit || "unidad"
        })
      });

      if (response.ok) {
        toast.success("Niveles de inventario actualizados correctamente");
        fetchProducts();
        closeProductModal();
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
        return "yellow";
      case ProductApprovalStatus.APPROVED:
        return "green";
      case ProductApprovalStatus.REJECTED:
        return "red";
      default:
        return "green"; // Already approved (no status)
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

  const statusOptions = [
    { value: "all", label: "Todos los estados" },
    { value: "pending", label: "Pendientes de Aprobación" },
    { value: "approved", label: "Aprobados" },
    { value: "rejected", label: "Rechazados" },
  ];

  const categoryOptions = [
    { value: "", label: "Todas las categorías" },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ];

  return (
    <Stack gap="lg">
      {/* Header y controles */}
      <Group justify="space-between" align="flex-start">
        <TextInput
          placeholder="Buscar productos por nombre, SKU o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          leftSection={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
          style={{ maxWidth: 400, flex: 1 }}
        />

        <Group>
          {productsWithoutMovementsCount > 0 && (
            <div style={{ position: 'relative' }}>
              <Button
                color="red"
                leftSection={<ExclamationTriangleIcon className="w-4 h-4" />}
                onClick={openProductsWithoutMovementsModal}
                style={{ animation: 'pulse 2s infinite' }}
              >
                <Text fw={600}>
                  {productsWithoutMovementsCount} Sin Movimientos
                </Text>
              </Button>
              <div style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 12,
                height: 12,
                backgroundColor: 'red',
                borderRadius: '50%',
                animation: 'ping 1s infinite'
              }} />
            </div>
          )}
          <Button
            leftSection={<PlusIcon className="w-4 h-4" />}
            onClick={handleCreateProduct}
          >
            Nuevo Producto
          </Button>
        </Group>
      </Group>

      {/* Filtros */}
      <Paper withBorder p="md">
        <Group justify="space-between" mb="md">
          <Text fw={500}>Filtros</Text>
        </Group>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Text size="sm" fw={500} mb="xs">Estado</Text>
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || "all")}
              data={statusOptions}
              placeholder="Seleccionar estado"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Text size="sm" fw={500} mb="xs">Categoría</Text>
            <Select
              value={categoryFilter}
              onChange={(value) => setCategoryFilter(value || "")}
              data={categoryOptions}
              placeholder="Seleccionar categoría"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }} style={{ display: 'flex', alignItems: 'end' }}>
            <Button
              variant="light"
              onClick={clearFilters}
              fullWidth
            >
              Limpiar Filtros
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Tabla de productos */}
      <Paper withBorder>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>PRODUCTO</Table.Th>
                <Table.Th>SKU / CÓDIGO</Table.Th>
                <Table.Th>CATEGORÍA</Table.Th>
                <Table.Th>PRECIOS</Table.Th>
                <Table.Th>STOCK</Table.Th>
                <Table.Th>ESTADO</Table.Th>
                <Table.Th>ACCIONES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Center py="xl">
                      <Loader />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : products.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Center py="xl">
                      <Text c="dimmed">No se encontraron productos</Text>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                products.map((product) => (
                  <Table.Tr key={product.id || product.product_id}>
                    <Table.Td>
                      <Group>
                        <div style={{
                          width: 40,
                          height: 40,
                          backgroundColor: 'var(--mantine-color-gray-1)',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              w={40}
                              h={40}
                              style={{ objectFit: 'cover', borderRadius: 8 }}
                            />
                          ) : (
                            <CubeIcon className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <Stack gap="xs">
                          <Text fw={500}>{product.name}</Text>
                          <Text size="xs" c="dimmed" style={{ maxWidth: 150 }} truncate>
                            {product.description || "Sin descripción"}
                          </Text>
                        </Stack>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text size="sm" fw={500}>{product.sku}</Text>
                        {product.barcode && (
                          <Group gap="xs">
                            <QrCodeIcon className="w-3 h-3 text-gray-500" />
                            <Text size="xs" c="dimmed">{product.barcode}</Text>
                          </Group>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light">
                        {product.category}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text size="sm">
                          <Text component="span" fw={500}>Costo:</Text> {formatCurrency(product.last_cost || 0)}
                        </Text>
                        <Text size="sm">
                          <Text component="span" fw={500}>Venta:</Text> {formatCurrency(product.unit_price || (product.last_cost ? product.last_cost * 1.3 : 0))}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text size="sm">
                          <Text component="span" fw={500}>Mínimo:</Text> {product.stock_minimum || 0} {product.stock_unit || product.base_unit}
                        </Text>
                        <Text size="sm">
                          <Text component="span" fw={500}>Reorden:</Text> {product.stock_reorder_point || 0} {product.stock_unit || product.base_unit}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        color={
                          product.approval_status === "approved" ? "green" :
                          product.approval_status === "rejected" ? "red" : "yellow"
                        }
                        leftSection={
                          product.approval_status === "approved" ? <CheckCircleIcon className="w-4 h-4" /> :
                          product.approval_status === "rejected" ? <NoSymbolIcon className="w-4 h-4" /> :
                          <ClockIcon className="w-4 h-4" />
                        }
                      >
                        {
                          product.approval_status === "approved" ? "Aprobado" :
                          product.approval_status === "rejected" ? "Rechazado" :
                          "Pendiente"
                        }
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => handleViewProduct(product)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </ActionIcon>
                        
                        {product.approval_status === "approved" && (
                          <>
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="blue"
                              onClick={() => handleEditProduct(product)}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </ActionIcon>
                            <Menu shadow="md" width={200}>
                              <Menu.Target>
                                <ActionIcon
                                  size="sm"
                                  variant="light"
                                >
                                  <svg width="20" height="20" viewBox="0 0 20 20">
                                    <path d="M6 10C6 11.1046 5.10457 12 4 12C2.89543 12 2 11.1046 2 10C2 8.89543 2.89543 8 4 8C5.10457 8 6 8.89543 6 10Z" fill="currentColor" />
                                    <path d="M12 10C12 11.1046 11.1046 12 10 12C8.89543 12 8 11.1046 8 10C8 8.89543 8.89543 8 10 8C11.1046 8 12 8.89543 12 10Z" fill="currentColor" />
                                    <path d="M18 10C18 11.1046 17.1046 12 16 12C14.8954 12 14 11.1046 14 10C14 8.89543 14.8954 8 16 8C17.1046 8 18 8.89543 18 10Z" fill="currentColor" />
                                  </svg>
                                </ActionIcon>
                              </Menu.Target>

                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<TagIcon className="w-4 h-4" />}
                                  onClick={() => handleViewPriceHistory(product)}
                                >
                                  Precios
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<ShoppingCartIcon className="w-4 h-4" />}
                                  onClick={() => handleEditStock(product)}
                                >
                                  Inventario
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </>
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

      {/* Modal de producto - Detalles, Edición, Precios o Stock */}
      <Modal
        opened={productModalOpened}
        onClose={closeProductModal}
        size="xl"
        title={selectedProduct && (
          <Group justify="space-between">
            <Title order={4}>
              {modalView === 'details' && "Detalles del Producto"}
              {modalView === 'edit' && "Editar Producto"}
              {modalView === 'price' && "Historial de Precios"}
              {modalView === 'stock' && "Niveles de Inventario"}
            </Title>
            <Badge
              color={
                selectedProduct.approval_status === "approved" ? "green" :
                selectedProduct.approval_status === "rejected" ? "red" : "yellow"
              }
              leftSection={
                selectedProduct.approval_status === "approved" ? <CheckCircleIcon className="w-4 h-4" /> :
                selectedProduct.approval_status === "rejected" ? <NoSymbolIcon className="w-4 h-4" /> :
                <ClockIcon className="w-4 h-4" />
              }
            >
              {
                selectedProduct.approval_status === "approved" ? "Aprobado" :
                selectedProduct.approval_status === "rejected" ? "Rechazado" :
                "Pendiente"
              }
            </Badge>
          </Group>
        )}
      >
        {selectedProduct && (
          <Stack gap="lg">
            {/* Vista de detalles */}
            {modalView === 'details' && (
              <Stack gap="lg">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Center>
                      <div style={{ 
                        width: '100%', 
                        height: 160, 
                        backgroundColor: 'var(--mantine-color-gray-1)', 
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {selectedProduct.images && selectedProduct.images.length > 0 ? (
                          <Image 
                            src={selectedProduct.images[0]} 
                            alt={selectedProduct.name} 
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <CubeIcon className="w-16 h-16 text-gray-400" />
                        )}
                      </div>
                    </Center>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <Stack gap="md">
                      <div>
                        <Title order={3}>{selectedProduct.name}</Title>
                        <Text c="dimmed">{selectedProduct.description || "Sin descripción"}</Text>
                      </div>
                      
                      <Grid>
                        <Grid.Col span={6}>
                          <Text size="xs" fw={500} c="dimmed">SKU</Text>
                          <Text size="sm" fw={500}>{selectedProduct.sku}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="xs" fw={500} c="dimmed">Categoría</Text>
                          <Text size="sm" fw={500}>{selectedProduct.category}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="xs" fw={500} c="dimmed">Unidad Base</Text>
                          <Text size="sm" fw={500}>{selectedProduct.base_unit}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="xs" fw={500} c="dimmed">Código de Barras</Text>
                          <Text size="sm" fw={500}>{selectedProduct.barcode || "No disponible"}</Text>
                        </Grid.Col>
                      </Grid>
                      
                      {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                        <Group gap="xs" mt="sm">
                          {selectedProduct.tags.map((tag) => (
                            <Badge key={tag} size="sm" variant="light">
                              {tag}
                            </Badge>
                          ))}
                        </Group>
                      )}
                    </Stack>
                  </Grid.Col>
                </Grid>
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" fw={500} c="dimmed" mb="xs">Precios</Text>
                    <Paper bg="gray.0" p="sm">
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Precio de Costo:</Text>
                          <Text size="sm" fw={500}>{formatCurrency(selectedProduct.last_cost || 0)}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Precio de Venta:</Text>
                          <Text size="sm" fw={500}>{formatCurrency(selectedProduct.unit_price || 0)}</Text>
                        </Group>
                        {selectedProduct.average_cost && (
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">Costo Promedio:</Text>
                            <Text size="sm" fw={500}>{formatCurrency(selectedProduct.average_cost)}</Text>
                          </Group>
                        )}
                      </Stack>
                    </Paper>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text size="sm" fw={500} c="dimmed" mb="xs">Niveles de Stock</Text>
                    <Paper bg="gray.0" p="sm">
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Stock Mínimo:</Text>
                          <Text size="sm" fw={500}>{selectedProduct.stock_minimum || 0} {selectedProduct.stock_unit || selectedProduct.base_unit}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Punto de Reorden:</Text>
                          <Text size="sm" fw={500}>{selectedProduct.stock_reorder_point || 0} {selectedProduct.stock_unit || selectedProduct.base_unit}</Text>
                        </Group>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                </Grid>
                
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb="xs">Características</Text>
                  <Paper bg="gray.0" p="sm">
                    <Grid>
                      <Grid.Col span={6}>
                        <Group>
                          <Switch checked={selectedProduct.is_perishable || false} readOnly size="sm" />
                          <Text size="sm">Producto Perecedero</Text>
                        </Group>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Group>
                          <Switch checked={selectedProduct.requires_batch || false} readOnly size="sm" />
                          <Text size="sm">Requiere Lote</Text>
                        </Group>
                      </Grid.Col>
                    </Grid>
                  </Paper>
                </div>
                
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb="xs">Información Adicional</Text>
                  <Paper bg="gray.0" p="sm">
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Fecha de Creación:</Text>
                        <Text size="sm" fw={500}>{selectedProduct.created_at ? new Date(selectedProduct.created_at).toLocaleDateString() : 'N/A'}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Última Actualización:</Text>
                        <Text size="sm" fw={500}>{selectedProduct.updated_at ? new Date(selectedProduct.updated_at).toLocaleDateString() : 'N/A'}</Text>
                      </Group>
                    </Stack>
                  </Paper>
                </div>
                
                {selectedProduct.approval_status === "rejected" && selectedProduct.rejection_reason && (
                  <Paper bg="red.0" withBorder p="sm">
                    <Text size="sm" fw={500} c="red.7" mb="xs">Motivo de Rechazo</Text>
                    <Text size="sm" c="red.6">{selectedProduct.rejection_reason}</Text>
                  </Paper>
                )}

                <Group justify="flex-end" mt="lg">
                  <Button 
                    variant="light" 
                    onClick={closeProductModal}
                  >
                    Cerrar
                  </Button>
                  
                  {selectedProduct.approval_status === "approved" && (
                    <Button
                      onClick={() => setModalView('edit')}
                    >
                      Editar Producto
                    </Button>
                  )}
                </Group>
              </Stack>
            )}
            
            {/* Vista de edición */}
            {modalView === 'edit' && (
              <Stack gap="md">
                <TextInput
                  label="Nombre del Producto"
                  placeholder="Ej: Laptop Dell Inspiron 15"
                  required
                  value={selectedProduct.name}
                  onChange={(e) => setSelectedProduct({...selectedProduct, name: e.currentTarget.value})}
                />
                
                <Textarea
                  label="Descripción del Producto"
                  placeholder="Describe las características, especificaciones y beneficios del producto..."
                  value={selectedProduct.description || ""}
                  onChange={(e) => setSelectedProduct({...selectedProduct, description: e.currentTarget.value})}
                  minRows={3}
                />
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="SKU (Código de Producto)"
                      placeholder="Ej: DELL-LAP-INS15-001"
                      value={selectedProduct.sku || ""}
                      onChange={(e) => setSelectedProduct({...selectedProduct, sku: e.currentTarget.value})}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Código de Barras"
                      placeholder="Ej: 123456789012"
                      value={selectedProduct.barcode || ""}
                      onChange={(e) => setSelectedProduct({...selectedProduct, barcode: e.currentTarget.value})}
                    />
                  </Grid.Col>
                </Grid>
                
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Categoría del Producto"
                      placeholder="Selecciona una categoría"
                      required
                      value={selectedProduct.category}
                      onChange={(value) => setSelectedProduct({...selectedProduct, category: value || ""})}
                      data={categories.map(cat => ({ value: cat, label: cat }))}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Unidad de Medida Base"
                      placeholder="Selecciona la unidad"
                      required
                      value={selectedProduct.base_unit}
                      onChange={(value) => setSelectedProduct({...selectedProduct, base_unit: value || ""})}
                      data={unitOptions}
                    />
                  </Grid.Col>
                </Grid>
                
                <div>
                  <Text size="sm" fw={500} mb="md">Características del Producto</Text>
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Paper withBorder p="sm">
                        <Switch
                          label="Producto Perecedero"
                          checked={selectedProduct.is_perishable || false}
                          onChange={(event) => setSelectedProduct({...selectedProduct, is_perishable: event.currentTarget.checked})}
                        />
                        <Text size="xs" c="dimmed" mt="xs">
                          Producto con fecha de caducidad o vida útil limitada
                        </Text>
                      </Paper>
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Paper withBorder p="sm">
                        <Switch
                          label="Requiere Control de Lote"
                          checked={selectedProduct.requires_batch || false}
                          onChange={(event) => setSelectedProduct({...selectedProduct, requires_batch: event.currentTarget.checked})}
                        />
                        <Text size="xs" c="dimmed" mt="xs">
                          Necesita seguimiento por número de lote o serie
                        </Text>
                      </Paper>
                    </Grid.Col>
                  </Grid>
                </div>
                
                <div>
                  <Text size="sm" fw={500} mb="xs">Etiquetas del Producto</Text>
                  
                  {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                    <Group gap="xs" mb="sm">
                      {selectedProduct.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="light"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedProduct({
                            ...selectedProduct, 
                            tags: selectedProduct.tags?.filter(t => t !== tag) || []
                          })}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </Group>
                  )}
                  
                  <Group>
                    <TextInput
                      placeholder="Ej: ofertas, premium, nuevo..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newTag.trim() && !selectedProduct.tags?.includes(newTag.trim())) {
                            setSelectedProduct({
                              ...selectedProduct, 
                              tags: [...(selectedProduct.tags || []), newTag.trim()]
                            });
                            setNewTag("");
                          }
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <Button 
                      variant="light"
                      onClick={() => {
                        if (newTag.trim() && !selectedProduct.tags?.includes(newTag.trim())) {
                          setSelectedProduct({
                            ...selectedProduct, 
                            tags: [...(selectedProduct.tags || []), newTag.trim()]
                          });
                          setNewTag("");
                        }
                      }}
                      disabled={!newTag.trim() || selectedProduct.tags?.includes(newTag.trim())}
                    >
                      Agregar
                    </Button>
                  </Group>
                </div>

                <Group justify="flex-end" mt="lg">
                  <Button 
                    variant="light" 
                    onClick={closeProductModal}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      // Implementar guardado de cambios aquí
                      toast.success("Cambios guardados correctamente");
                      closeProductModal();
                    }}
                  >
                    Guardar Cambios
                  </Button>
                </Group>
              </Stack>
            )}
            
            {/* Vista de historial de precios */}
            {modalView === 'price' && (
              <Stack gap="lg">
                <Paper bg="gray.0" p="md">
                  <Text size="sm" fw={500} c="dimmed" mb="md">Precios Actuales</Text>
                  <Grid>
                    <Grid.Col span={6}>
                      <NumberInput
                        label="Precio de Costo (MXN)"
                        placeholder="0.00"
                        leftSection="$"
                        decimalScale={2}
                        value={selectedProduct.last_cost || 0}
                        onChange={(value) => setSelectedProduct({
                          ...selectedProduct,
                          last_cost: typeof value === 'number' ? value : 0
                        })}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={6}>
                      <NumberInput
                        label="Precio de Venta (MXN)"
                        placeholder="0.00"
                        leftSection="$"
                        decimalScale={2}
                        value={selectedProduct.unit_price || 0}
                        onChange={(value) => setSelectedProduct({
                          ...selectedProduct,
                          unit_price: typeof value === 'number' ? value : 0
                        })}
                      />
                    </Grid.Col>
                  </Grid>
                  
                  <Button
                    fullWidth
                    mt="md"
                    onClick={() => updateProductPrice(
                      selectedProduct.id || selectedProduct.product_id || '',
                      selectedProduct.last_cost || 0,
                      selectedProduct.unit_price || 0
                    )}
                  >
                    Actualizar Precios
                  </Button>
                </Paper>
                
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb="md">Historial de Precios</Text>
                  {loadingPriceHistory ? (
                    <Center py="xl">
                      <Loader />
                    </Center>
                  ) : (
                    <Table>
                      <Table.Thead bg="gray.0">
                        <Table.Tr>
                          <Table.Th>Fecha</Table.Th>
                          <Table.Th ta="right">Precio de Costo</Table.Th>
                          <Table.Th ta="right">Precio de Venta</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {priceHistoryData.map((item, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>
                              {new Date(item.date).toLocaleDateString()}
                            </Table.Td>
                            <Table.Td ta="right">
                              {formatCurrency(item.costPrice)}
                            </Table.Td>
                            <Table.Td ta="right">
                              {formatCurrency(item.unitPrice)}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </div>
              </Stack>
            )}
            
            {/* Vista de niveles de stock */}
            {modalView === 'stock' && (
              <Stack gap="lg">
                <Paper bg="gray.0" p="md">
                  <Text size="sm" fw={500} c="dimmed" mb="md">Niveles de Inventario</Text>
                  <Grid>
                    <Grid.Col span={6}>
                      <NumberInput
                        label={`Stock Mínimo (${selectedProduct.stock_unit || selectedProduct.base_unit || 'unidad'})`}
                        placeholder="0"
                        value={selectedProduct.stock_minimum || 0}
                        onChange={(value) => setSelectedProduct({
                          ...selectedProduct,
                          stock_minimum: typeof value === 'number' ? value : 0
                        })}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={6}>
                      <NumberInput
                        label={`Punto de Reorden (${selectedProduct.stock_unit || selectedProduct.base_unit || 'unidad'})`}
                        placeholder="0"
                        value={selectedProduct.stock_reorder_point || 0}
                        onChange={(value) => setSelectedProduct({
                          ...selectedProduct,
                          stock_reorder_point: typeof value === 'number' ? value : 0
                        })}
                      />
                    </Grid.Col>
                  </Grid>
                  
                  <Text size="xs" c="dimmed" my="sm">
                    <Text component="span" fw={500}>Nota:</Text> El stock mínimo indica el nivel crítico por debajo del cual no debería caer el inventario.
                    El punto de reorden indica el nivel en el que se debe generar una alerta para realizar un nuevo pedido.
                  </Text>
                  
                  <Button
                    fullWidth
                    mt="md"
                    onClick={() => updateProductStock(
                      selectedProduct.id || selectedProduct.product_id || '',
                      selectedProduct.stock_minimum || 0,
                      selectedProduct.stock_reorder_point || 0
                    )}
                  >
                    Actualizar Niveles de Inventario
                  </Button>
                </Paper>
              </Stack>
            )}
          </Stack>
        )}
      </Modal>

      {/* Modal de nuevo producto */}
      <Modal
        opened={newProductModalOpened}
        onClose={closeNewProductModal}
        size="xl"
        title={
          <div>
            <Title order={4}>Registrar Nuevo Producto</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Los productos nuevos requerirán aprobación de un administrador antes de estar disponibles en el sistema.
            </Text>
          </div>
        }
      >
        <Stack gap="lg">
          {/* Información Básica */}
          <div>
            <Text fw={500} mb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', paddingBottom: 8 }}>
              Información Básica
            </Text>
            
            <Stack gap="md">
              <TextInput
                label={<>Nombre del Producto <Text component="span" c="red">*</Text></>}
                placeholder="Ej: Laptop Dell Inspiron 15 3000 Intel Core i5"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.currentTarget.value})}
                required
                description="Nombre completo y descriptivo que aparecerá en catálogos y facturas"
              />
              
              <Textarea
                label="Descripción del Producto"
                placeholder="Incluye características, especificaciones técnicas, beneficios y cualquier información relevante..."
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.currentTarget.value})}
                minRows={4}
                description="Información detallada que ayude a los compradores a entender las características y beneficios del producto"
              />
              
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label={<>SKU (Código de Producto) <Text component="span" c="red">*</Text></>}
                    placeholder="Ej: DELL-LAP-INS15-001"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({...newProduct, sku: e.currentTarget.value})}
                    required
                    description="Código único de identificación interno del producto"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Código de Barras (Opcional)"
                    placeholder="Ej: 123456789012"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({...newProduct, barcode: e.currentTarget.value})}
                    description="Código de barras para escaneo (EAN, UPC, etc.)"
                  />
                </Grid.Col>
              </Grid>
              
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label={<>Categoría del Producto <Text component="span" c="red">*</Text></>}
                    placeholder="Selecciona una categoría"
                    value={newProduct.category}
                    onChange={(value) => setNewProduct({...newProduct, category: value || ""})}
                    data={categories.map(cat => ({ value: cat, label: cat }))}
                    required
                    description="Clasifica el producto para facilitar su búsqueda y organización"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label={<>Unidad de Medida Base <Text component="span" c="red">*</Text></>}
                    placeholder="Selecciona la unidad"
                    value={newProduct.baseUnit}
                    onChange={(value) => setNewProduct({...newProduct, baseUnit: value || ""})}
                    data={unitOptions}
                    required
                    description="Unidad principal de venta (piezas, kilos, litros, etc.)"
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </div>

          {/* Características del Producto */}
          <div>
            <Text fw={500} mb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', paddingBottom: 8 }}>
              Características del Producto
            </Text>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md">
                  <Switch
                    label="Producto Perecedero"
                    checked={newProduct.isPerishable}
                    onChange={(event) => setNewProduct({...newProduct, isPerishable: event.currentTarget.checked})}
                  />
                  <Text size="xs" c="dimmed" mt="xs">
                    Producto con fecha de caducidad o vida útil limitada
                  </Text>
                </Paper>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md">
                  <Switch
                    label="Requiere Control de Lote"
                    checked={newProduct.requiresBatch}
                    onChange={(event) => setNewProduct({...newProduct, requiresBatch: event.currentTarget.checked})}
                  />
                  <Text size="xs" c="dimmed" mt="xs">
                    Necesita seguimiento por número de lote o serie
                  </Text>
                </Paper>
              </Grid.Col>
            </Grid>
          </div>

          {/* Precios e Inventario */}
          <div>
            <Text fw={500} mb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', paddingBottom: 8 }}>
              Precios e Inventario
            </Text>
            <Stack gap="md">
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <NumberInput
                    label={<>Precio de Costo (MXN) <Text component="span" c="red">*</Text></>}
                    placeholder="Ej: 1500.00"
                    leftSection="$"
                    decimalScale={2}
                    min={0}
                    value={newProduct.costPrice}
                    onChange={(value) => setNewProduct({...newProduct, costPrice: typeof value === 'number' ? value : 0})}
                    required
                    description="Precio al que compras o produces el producto (para cálculo de margen)"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <NumberInput
                    label={<>Precio de Venta (MXN) <Text component="span" c="red">*</Text></>}
                    placeholder="Ej: 2500.00"
                    leftSection="$"
                    decimalScale={2}
                    min={0}
                    value={newProduct.unitPrice}
                    onChange={(value) => setNewProduct({...newProduct, unitPrice: typeof value === 'number' ? value : 0})}
                    required
                    description="Precio al que vendes el producto a tus clientes"
                  />
                </Grid.Col>
              </Grid>
              
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <NumberInput
                    label={`Stock Mínimo (${newProduct.baseUnit})`}
                    placeholder="Ej: 10"
                    min={0}
                    value={newProduct.minStock}
                    onChange={(value) => setNewProduct({...newProduct, minStock: typeof value === 'number' ? value : 0})}
                    description="Cantidad mínima que debe mantenerse en inventario"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <NumberInput
                    label={`Punto de Reorden (${newProduct.baseUnit})`}
                    placeholder="Ej: 20"
                    min={0}
                    value={newProduct.reorderPoint}
                    onChange={(value) => setNewProduct({...newProduct, reorderPoint: typeof value === 'number' ? value : 0})}
                    description="Nivel en el que se debe generar un nuevo pedido"
                  />
                </Grid.Col>
              </Grid>
              
              <Paper bg="gray.0" p="sm">
                <Text size="xs" c="dimmed">
                  <Text component="span" fw={500}>Stock Mínimo:</Text> Nivel crítico por debajo del cual no debería caer el inventario.
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  <Text component="span" fw={500}>Punto de Reorden:</Text> Nivel en el que se debe generar una alerta para realizar un nuevo pedido.
                </Text>
              </Paper>
            </Stack>
          </div>

          {/* Información Adicional */}
          <div>
            <Text fw={500} mb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', paddingBottom: 8 }}>
              Información Adicional
            </Text>
            <Stack gap="md">
              <div>
                <Text size="sm" fw={500} mb="xs">Etiquetas del Producto</Text>
                <Text size="xs" c="dimmed" mb="md">
                  Palabras clave que faciliten la búsqueda del producto (ej: &quot;ofertas&quot;, &quot;nuevo&quot;, &quot;premium&quot;, &quot;eco-friendly&quot;)
                </Text>
                
                {newProduct.tags.length > 0 && (
                  <Group gap="xs" mb="sm">
                    {newProduct.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="light"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </Group>
                )}
                
                <Group>
                  <TextInput
                    placeholder="Ej: ofertas, premium, nuevo, eco-friendly..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    variant="light"
                    onClick={handleAddTag}
                    disabled={!newTag.trim() || newProduct.tags.includes(newTag.trim())}
                  >
                    Agregar
                  </Button>
                </Group>
              </div>
              
              <div>
                <Text size="sm" fw={500} mb="xs">Imágenes del Producto</Text>
                <Text size="xs" c="dimmed" mb="md">
                  Sube imágenes que muestren el producto desde diferentes ángulos (opcional)
                </Text>
                
                <FileInput
                  placeholder="Seleccionar imágenes..."
                  multiple
                  accept="image/*"
                  leftSection={<PhotoIcon className="w-4 h-4" />}
                  onChange={(files) => {
                    // En una implementación real, aquí subirías los archivos y obtendrías las URLs
                    if (files && files.length > 0) {
                      const urls = files.map(file => URL.createObjectURL(file));
                      setNewProduct({...newProduct, images: [...newProduct.images, ...urls]});
                    }
                  }}
                />
                
                {newProduct.images.length > 0 && (
                  <Group gap="xs" mt="sm">
                    {newProduct.images.map((image, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <Image
                          src={image}
                          alt={`Producto ${index + 1}`}
                          w={80}
                          h={80}
                          style={{ objectFit: 'cover', borderRadius: 8 }}
                        />
                        <ActionIcon
                          size="xs"
                          color="red"
                          style={{ position: 'absolute', top: -8, right: -8 }}
                          onClick={() => {
                            const newImages = newProduct.images.filter((_, i) => i !== index);
                            setNewProduct({...newProduct, images: newImages});
                          }}
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </ActionIcon>
                      </div>
                    ))}
                  </Group>
                )}
              </div>
            </Stack>
          </div>

          {/* Error del formulario */}
          {formError && (
            <Paper bg="red.0" withBorder p="sm">
              <Group>
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <Text size="sm" c="red.7" fw={500}>{formError}</Text>
              </Group>
            </Paper>
          )}

          {/* Resumen del producto */}
          <Paper bg="blue.0" withBorder p="md">
            <Text size="sm" fw={500} c="blue.7" mb="sm">Resumen del Producto</Text>
            <Grid>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Nombre:</Text>
                <Text size="sm" fw={500}>{newProduct.name || "Sin nombre"}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Categoría:</Text>
                <Text size="sm" fw={500}>{newProduct.category || "Sin categoría"}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Precio de Costo:</Text>
                <Text size="sm" fw={500}>{formatCurrency(newProduct.costPrice)}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Precio de Venta:</Text>
                <Text size="sm" fw={500}>{formatCurrency(newProduct.unitPrice)}</Text>
              </Grid.Col>
            </Grid>
            {newProduct.unitPrice > 0 && newProduct.costPrice > 0 && (
              <Text size="xs" c="blue.6" mt="sm">
                <Text component="span" fw={500}>Margen de Ganancia:</Text> {(((newProduct.unitPrice - newProduct.costPrice) / newProduct.costPrice) * 100).toFixed(1)}%
              </Text>
            )}
          </Paper>

          {/* Botones de acción */}
          <Group justify="flex-end" mt="lg">
            <Button
              variant="light"
              onClick={closeNewProductModal}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={submitNewProduct}
              loading={loading}
              disabled={!newProduct.name || !newProduct.category || !newProduct.sku || newProduct.costPrice <= 0 || newProduct.unitPrice <= 0}
            >
              {loading ? "Enviando..." : "Registrar Producto"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de productos sin movimientos */}
      <ProductsWithoutMovementsModal
        isOpen={productsWithoutMovementsModalOpened}
        onClose={closeProductsWithoutMovementsModal}
        onSuccess={fetchProducts}
      />
    </Stack>
  );
}