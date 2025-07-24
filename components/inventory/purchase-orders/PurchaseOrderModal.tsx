import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  XMarkIcon, 
  PlusIcon, 
  TrashIcon, 
  BuildingOffice2Icon, 
  CubeIcon, 
  CalculatorIcon, 
  DocumentTextIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { Modal, ModalFooter, ModalActions, ModalButton } from '@/components/shared/modals';

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
    const selectedSupplier = suppliers.find(s => s._id === supplierId);
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
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={DocumentTextIcon}
      size="lg"
      footer={
        <ModalFooter>
          <div>
            {!isReadOnly && formData.items.length === 0 && (
              <p className="text-red-600 text-sm">Agrega al menos un producto</p>
            )}
          </div>
          
          <ModalActions>
            <ModalButton
              onClick={onClose}
              variant="secondary"
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </ModalButton>
            
            {!isReadOnly && (
              <ModalButton
                onClick={handleSubmit}
                disabled={loading || !formData.supplier_id || formData.items.length === 0}
                loading={loading}
                variant="primary"
              >
                {mode === 'create' ? 'Crear Orden' : 'Actualizar Orden'}
              </ModalButton>
            )}
          </ModalActions>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        
        {/* Información del Proveedor */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BuildingOffice2Icon className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Información del Proveedor</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Proveedor *
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => handleSupplierChange(e.target.value)}
                disabled={isReadOnly || loadingSuppliers}
                className={`glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer ${
                  isReadOnly ? 'opacity-60' : ''
                }`}
              >
                <option value="">
                  {loadingSuppliers ? "Cargando proveedores..." : "Seleccione un proveedor"}
                </option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name} ({supplier.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                disabled={isReadOnly}
                className={`glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer ${
                  isReadOnly ? 'opacity-60' : ''
                }`}
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CubeIcon className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-slate-800">Productos</h4>
            </div>
            
            {!isReadOnly && (
              <ModalButton
                onClick={handleAddItem}
                size="sm"
                variant="primary"
              >
                <PlusIcon className="w-4 h-4" />
                Agregar Producto
              </ModalButton>
            )}
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="glass-card p-4 border border-slate-200/50">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Producto
                    </label>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      disabled={isReadOnly}
                      className={`glass-input w-full px-3 py-2 text-slate-800 appearance-none cursor-pointer ${
                        isReadOnly ? 'opacity-60' : ''
                      }`}
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      readOnly={isReadOnly}
                      className={`glass-input w-full px-3 py-2 text-slate-800 ${
                        isReadOnly ? 'opacity-60' : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Precio Unit.
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      readOnly={isReadOnly}
                      className={`glass-input w-full px-3 py-2 text-slate-800 ${
                        isReadOnly ? 'opacity-60' : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Total
                    </label>
                    <input
                      type="text"
                      value={`$${item.total_price.toFixed(2)}`}
                      readOnly
                      className="glass-input w-full px-3 py-2 text-slate-800 opacity-60"
                    />
                  </div>

                  <div className="flex items-end">
                    {!isReadOnly && (
                      <ModalButton
                        onClick={() => handleRemoveItem(index)}
                        variant="danger"
                        size="sm"
                        className="w-full"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </ModalButton>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {formData.items.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                {isReadOnly ? 'No hay productos en esta orden' : 'Haz clic en "Agregar Producto" para comenzar'}
              </div>
            )}
          </div>
        </div>

        {/* Totales */}
        {formData.items.length > 0 && (
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CalculatorIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-slate-800">Totales</h4>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold text-slate-800">
                  ${calculatedSubtotal.toFixed(2)} {formData.currency}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-600">IVA ({formData.tax_rate}%):</span>
                <span className="font-semibold text-slate-800">
                  ${calculatedTax.toFixed(2)} {formData.currency}
                </span>
              </div>
              
              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-800">Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${calculatedTotal.toFixed(2)} {formData.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información Adicional */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-orange-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Información Adicional</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Entrega Esperada
              </label>
              <input
                type="date"
                value={formData.expected_delivery_date || ''}
                onChange={(e) => handleInputChange('expected_delivery_date', e.target.value)}
                readOnly={isReadOnly}
                className={`glass-input w-full px-4 py-3 text-slate-800 ${
                  isReadOnly ? 'opacity-60' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ubicación de Entrega
              </label>
              <input
                type="text"
                value={formData.delivery_location}
                onChange={(e) => handleInputChange('delivery_location', e.target.value)}
                readOnly={isReadOnly}
                className={`glass-input w-full px-4 py-3 text-slate-800 ${
                  isReadOnly ? 'opacity-60' : ''
                }`}
                placeholder="Ubicación de entrega"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                readOnly={isReadOnly}
                rows={3}
                className={`glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 resize-none ${
                  isReadOnly ? 'opacity-60' : ''
                }`}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}