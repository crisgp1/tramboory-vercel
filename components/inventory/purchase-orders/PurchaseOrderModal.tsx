import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  IconX, 
  IconPlus, 
  IconTrash, 
  IconBuilding, 
  IconCube, 
  IconCalculator, 
  IconFileText, 
  IconExclamationCircle 
} from '@tabler/icons-react';
import { Modal, Stack, Card, TextInput, Textarea, Select, Button, Group, Text, Title, NumberInput } from '@mantine/core';

// Types
interface PurchaseOrderItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  notes?: string;
}

interface PurchaseOrder {
  id?: string;
  purchase_order_id?: string;
  supplier_id: string;
  supplier_name: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  tax_rate: number;
  total: number;
  currency: string;
  expected_delivery_date?: string;
  delivery_location: string;
  payment_method: 'cash' | 'credit' | 'transfer' | 'check';
  payment_credit_days: number;
  notes?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
  category: string;
}

interface Supplier {
  _id: string;
  name: string;
  code: string;
}

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  mode: 'create' | 'edit' | 'view';
  onSuccess: () => void;
}

const statusConfig = {
  DRAFT: { label: 'Borrador', color: 'gray', bgColor: 'bg-gray-100/80', textColor: 'text-gray-800' },
  PENDING: { label: 'Pendiente', color: 'yellow', bgColor: 'bg-yellow-100/80', textColor: 'text-yellow-800' },
  APPROVED: { label: 'Aprobada', color: 'blue', bgColor: 'bg-blue-100/80', textColor: 'text-blue-800' },
  ORDERED: { label: 'Ordenada', color: 'indigo', bgColor: 'bg-indigo-100/80', textColor: 'text-indigo-800' },
  RECEIVED: { label: 'Recibida', color: 'green', bgColor: 'bg-green-100/80', textColor: 'text-green-800' },
  CANCELLED: { label: 'Cancelada', color: 'red', bgColor: 'bg-red-100/80', textColor: 'text-red-800' }
};

export default function PurchaseOrderModal({ 
  isOpen, 
  onClose, 
  purchaseOrder, 
  mode, 
  onSuccess 
}: PurchaseOrderModalProps) {
  // State
  const [formData, setFormData] = useState<PurchaseOrder>({
    supplier_id: '',
    supplier_name: '',
    status: 'DRAFT',
    items: [],
    subtotal: 0,
    tax: 0,
    tax_rate: 16,
    total: 0,
    currency: 'MXN',
    delivery_location: 'Almacén Principal',
    payment_method: 'credit',
    payment_credit_days: 30,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Ensure data arrays are never undefined
  const safeSuppliers = suppliers || [];
  const safeProducts = products || [];

  // Computed values
  const isReadOnly = mode === 'view';
  const statusInfo = statusConfig[formData.status];

  // Calculate totals
  const calculatedSubtotal = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + item.total_price, 0);
  }, [formData.items]);

  const calculatedTax = useMemo(() => {
    return calculatedSubtotal * (formData.tax_rate / 100);
  }, [calculatedSubtotal, formData.tax_rate]);

  const calculatedTotal = useMemo(() => {
    return calculatedSubtotal + calculatedTax;
  }, [calculatedSubtotal, calculatedTax]);

  // Effects
  useEffect(() => {
    if (purchaseOrder && (mode === 'edit' || mode === 'view')) {
      setFormData(purchaseOrder);
    } else {
      setFormData({
        supplier_id: '',
        supplier_name: '',
        status: 'DRAFT',
        items: [],
        subtotal: 0,
        tax: 0,
        tax_rate: 16,
        total: 0,
        currency: 'MXN',
        delivery_location: 'Almacén Principal',
        payment_method: 'credit',
        payment_credit_days: 30,
        notes: ''
      });
    }
  }, [purchaseOrder, mode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      fetchProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      total: calculatedTotal
    }));
  }, [calculatedSubtotal, calculatedTax, calculatedTotal]);

  // Event handlers
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await fetch('/api/inventory/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch('/api/inventory/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSupplierChange = (supplierId: string) => {
    const selectedSupplier = safeSuppliers.find(s => s._id === supplierId);
    if (selectedSupplier) {
      setFormData(prev => ({
        ...prev,
        supplier_id: supplierId,
        supplier_name: selectedSupplier.name
      }));
    }
  };

  const handleAddItem = () => {
    const newItem: PurchaseOrderItem = {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit: '',
      unit_price: 0,
      total_price: 0,
      notes: ''
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Update product info if product_id changes
          if (field === 'product_id') {
            const selectedProduct = products.find(p => p.id === value);
            if (selectedProduct) {
              updatedItem.product_name = selectedProduct.name;
              updatedItem.unit = selectedProduct.unit;
            }
          }
          
          // Recalculate total price
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleSubmit = async () => {
    if (!formData.supplier_id || formData.items.length === 0) {
      alert('Por favor selecciona un proveedor y agrega al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const url = mode === 'create' 
        ? '/api/inventory/purchase-orders'
        : `/api/inventory/purchase-orders/${purchaseOrder?.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al guardar la orden de compra');
      }
    } catch (error) {
      alert('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === 'create') return 'Crear Orden de Compra';
    if (mode === 'edit') return 'Editar Orden de Compra';
    return 'Detalles de Orden de Compra';
  };

  const getSubtitle = () => {
    if (purchaseOrder && mode !== 'create') {
      return `${purchaseOrder.purchase_order_id || purchaseOrder.id} • ${statusInfo.label}`;
    }
    return undefined;
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Stack gap="xs">
          <Title order={3}>{getTitle()}</Title>
          {getSubtitle() && <Text c="dimmed" size="sm">{getSubtitle()}</Text>}
        </Stack>
      }
      size="xl"
      styles={{
        content: {
          maxHeight: '95vh',
          overflow: 'hidden'
        },
        body: {
          maxHeight: 'calc(95vh - 120px)',
          overflow: 'auto',
          padding: '1rem'
        }
      }}
    >
      <Stack gap="lg">
        
        {/* Información del Proveedor */}
        <Card withBorder p="lg">
          <Title order={4} mb="md">
            <Group gap="xs">
              <IconBuilding size={20} />
              Información del Proveedor
            </Group>
          </Title>

          <Group grow align="flex-start">
            <Select
              label="Proveedor"
              placeholder={loadingSuppliers ? "Cargando proveedores..." : "Seleccione un proveedor"}
              value={formData.supplier_id}
              onChange={(value) => handleSupplierChange(value || '')}
              disabled={isReadOnly || loadingSuppliers}
              data={safeSuppliers.map((supplier) => ({
                value: supplier._id || '',
                label: `${supplier.name || 'Sin nombre'} (${supplier.code || 'Sin código'})`
              }))}
              required
            />

            <Select
              label="Estado"
              value={formData.status}
              onChange={(value) => handleInputChange('status', value)}
              disabled={isReadOnly}
              data={Object.entries(statusConfig).map(([key, config]) => ({
                value: key || '',
                label: config.label || ''
              }))}
            />
          </Group>
        </Card>

        {/* Productos */}
        <Card withBorder p="lg">
          <Group justify="space-between" mb="md">
            <Title order={4}>
              <Group gap="xs">
                <IconCube size={20} />
                Productos
              </Group>
            </Title>
            
            {!isReadOnly && (
              <Button
                onClick={handleAddItem}
                size="sm"
                leftSection={<IconPlus size={16} />}
              >
                Agregar Producto
              </Button>
            )}
          </Group>

          <Stack gap="md">
            {formData.items.map((item, index) => (
              <Card key={index} withBorder p="md">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Select
                      label="Producto"
                      value={item.product_id}
                      onChange={(value) => handleItemChange(index, 'product_id', value || '')}
                      disabled={isReadOnly}
                      data={safeProducts.map((product) => ({
                        value: product.id || '',
                        label: `${product.name || 'Sin nombre'} (${product.sku || 'Sin SKU'})`
                      }))}
                      placeholder="Seleccionar producto"
                    />
                  </div>

                  <NumberInput
                    label="Cantidad"
                    min={0}
                    step={0.01}
                    value={item.quantity}
                    onChange={(value) => handleItemChange(index, 'quantity', value || 0)}
                    readOnly={isReadOnly}
                  />

                  <NumberInput
                    label="Precio Unit."
                    min={0}
                    step={0.01}
                    value={item.unit_price}
                    onChange={(value) => handleItemChange(index, 'unit_price', value || 0)}
                    readOnly={isReadOnly}
                  />

                  <TextInput
                    label="Total"
                    value={`$${item.total_price.toFixed(2)}`}
                    readOnly
                  />

                  {!isReadOnly && (
                    <Button
                      onClick={() => handleRemoveItem(index)}
                      color="red"
                      size="sm"
                      style={{ alignSelf: 'flex-end' }}
                    >
                      <IconTrash size={16} />
                    </Button>
                  )}
                </div>
              </Card>
            ))}

            {formData.items.length === 0 && (
              <Text ta="center" py="xl" c="dimmed">
                {isReadOnly ? 'No hay productos en esta orden' : 'Haz clic en "Agregar Producto" para comenzar'}
              </Text>
            )}
          </Stack>
        </Card>

        {/* Totales */}
        {formData.items.length > 0 && (
          <Card withBorder p="lg">
            <Title order={4} mb="md">
              <Group gap="xs">
                <IconCalculator size={20} />
                Totales
              </Group>
            </Title>

            <Stack gap="md">
              <Group justify="space-between">
                <Text c="dimmed">Subtotal:</Text>
                <Text fw={600}>
                  ${calculatedSubtotal.toFixed(2)} {formData.currency}
                </Text>
              </Group>
              
              <Group justify="space-between">
                <Text c="dimmed">IVA ({formData.tax_rate}%):</Text>
                <Text fw={600}>
                  ${calculatedTax.toFixed(2)} {formData.currency}
                </Text>
              </Group>
              
              <Group justify="space-between" pt="md" style={{ borderTop: '1px solid #e9ecef' }}>
                <Text size="lg" fw={600}>Total:</Text>
                <Text size="xl" fw={700} c="blue">
                  ${calculatedTotal.toFixed(2)} {formData.currency}
                </Text>
              </Group>
            </Stack>
          </Card>
        )}

        {/* Información Adicional */}
        <Card withBorder p="lg">
          <Title order={4} mb="md">
            <Group gap="xs">
              <IconFileText size={20} />
              Información Adicional
            </Group>
          </Title>

          <Group grow align="flex-start" mb="md">
            <TextInput
              type="date"
              label="Fecha de Entrega Esperada"
              value={formData.expected_delivery_date || ''}
              onChange={(e) => handleInputChange('expected_delivery_date', e.currentTarget.value)}
              readOnly={isReadOnly}
            />

            <TextInput
              label="Ubicación de Entrega"
              value={formData.delivery_location}
              onChange={(e) => handleInputChange('delivery_location', e.currentTarget.value)}
              readOnly={isReadOnly}
              placeholder="Ubicación de entrega"
            />
          </Group>

          <Textarea
            label="Notas"
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.currentTarget.value)}
            readOnly={isReadOnly}
            rows={3}
            placeholder="Notas adicionales..."
          />
        </Card>

        {/* Footer Buttons */}
        <Group justify="space-between" pt="lg">
          <div>
            {!isReadOnly && formData.items.length === 0 && (
              <Text c="red" size="sm">Agrega al menos un producto</Text>
            )}
          </div>
          
          <Group>
            <Button
              variant="default"
              onClick={onClose}
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            {!isReadOnly && (
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.supplier_id || formData.items.length === 0}
                loading={loading}
              >
                {mode === 'create' ? 'Crear Orden' : 'Actualizar Orden'}
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}