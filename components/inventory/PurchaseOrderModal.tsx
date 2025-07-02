"use client"

import React, { useState, useEffect } from "react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  DateInput,
  Divider,
  Autocomplete,
  AutocompleteItem
} from "@heroui/react"
import { parseDate, CalendarDate } from "@internationalized/date"
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalculatorIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline"
import toast from "react-hot-toast"

interface PurchaseOrderItem {
  productId: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  notes?: string
}

interface PurchaseOrder {
  _id?: string
  purchaseOrderId?: string
  supplierId: string
  supplierName: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
  items: PurchaseOrderItem[]
  subtotal: number
  tax: number
  taxRate: number
  total: number
  currency: string
  expectedDeliveryDate?: string
  deliveryLocation: string
  paymentTerms: {
    method: 'cash' | 'credit' | 'transfer' | 'check'
    creditDays: number
  }
  notes?: string
}

interface Product {
  _id: string
  name: string
  sku: string
  units: {
    base: {
      code: string
      name: string
    }
    alternatives: Array<{
      code: string
      name: string
      conversionFactor: number
    }>
  }
  suppliers: Array<{
    supplierId: string
    lastPurchasePrice: number
  }>
}

interface Supplier {
  _id: string
  name: string
  code: string
  paymentTerms: {
    creditDays: number
    paymentMethod: string
  }
}

interface PurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order?: PurchaseOrder | null
  mode: 'create' | 'edit' | 'view'
  onSuccess: () => void
}

export default function PurchaseOrderModal({
  isOpen,
  onClose,
  order,
  mode,
  onSuccess
}: PurchaseOrderModalProps) {
  const [formData, setFormData] = useState<PurchaseOrder>({
    supplierId: '',
    supplierName: '',
    status: 'DRAFT',
    items: [],
    subtotal: 0,
    tax: 0,
    taxRate: 0.16,
    total: 0,
    currency: 'MXN',
    deliveryLocation: 'Almacén Principal',
    paymentTerms: {
      method: 'cash',
      creditDays: 0
    }
  })

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchProduct, setSearchProduct] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers()
      fetchProducts()
      
      if (order && mode !== 'create') {
        setFormData(order)
      } else {
        resetForm()
      }
    }
  }, [isOpen, order, mode])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/inventory/suppliers?limit=100')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory/products?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      supplierId: '',
      supplierName: '',
      status: 'DRAFT',
      items: [],
      subtotal: 0,
      tax: 0,
      taxRate: 0.16,
      total: 0,
      currency: 'MXN',
      deliveryLocation: 'Almacén Principal',
      paymentTerms: {
        method: 'cash',
        creditDays: 0
      }
    })
  }

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s._id === supplierId)
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        supplierId,
        supplierName: supplier.name,
        paymentTerms: {
          method: supplier.paymentTerms.paymentMethod as any,
          creditDays: supplier.paymentTerms.creditDays
        }
      }))
    }
  }

  const addItem = () => {
    const newItem: PurchaseOrderItem = {
      productId: '',
      productName: '',
      quantity: 1,
      unit: '',
      unitPrice: 0,
      totalPrice: 0
    }
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
    recalculateTotals()
  }

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      
      // Si es un producto, actualizar información automáticamente
      if (field === 'productId') {
        const product = products.find(p => p._id === value)
        if (product) {
          newItems[index].productName = product.name
          newItems[index].unit = product.units.base.code
          
          // Buscar precio del proveedor
          const supplierPrice = product.suppliers.find(s => s.supplierId === formData.supplierId)
          if (supplierPrice) {
            newItems[index].unitPrice = supplierPrice.lastPurchasePrice
          }
        }
      }
      
      // Recalcular precio total del item
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice
      }
      
      return { ...prev, items: newItems }
    })
    
    // Recalcular totales después de actualizar
    setTimeout(recalculateTotals, 0)
  }

  const recalculateTotals = () => {
    setFormData(prev => {
      const subtotal = prev.items.reduce((sum, item) => sum + item.totalPrice, 0)
      const tax = subtotal * prev.taxRate
      const total = subtotal + tax
      
      return {
        ...prev,
        subtotal,
        tax,
        total
      }
    })
  }

  const handleSubmit = async () => {
    if (!formData.supplierId) {
      toast.error('Selecciona un proveedor')
      return
    }
    
    if (formData.items.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }
    
    if (formData.items.some(item => !item.productId || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast.error('Completa todos los campos de los productos')
      return
    }

    setLoading(true)
    try {
      const url = mode === 'create' 
        ? '/api/inventory/purchase-orders'
        : `/api/inventory/purchase-orders/${order?._id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(`Orden ${mode === 'create' ? 'creada' : 'actualizada'} exitosamente`)
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al guardar la orden')
      }
    } catch (error) {
      console.error('Error saving order:', error)
      toast.error('Error al guardar la orden')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchProduct.toLowerCase())
  )

  const isReadOnly = mode === 'view'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      backdrop="opaque"
      placement="center"
      classNames={{
        backdrop: "bg-gray-900/20",
        base: "bg-white border border-gray-200",
        wrapper: "z-[1001] items-center justify-center p-4",
        header: "border-b border-gray-100 flex-shrink-0",
        body: "p-6 max-h-[80vh] overflow-y-auto",
        footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
      }}
    >
      <ModalContent>
        <ModalHeader className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {mode === 'create' ? 'Nueva Orden de Compra' : 
                 mode === 'edit' ? 'Editar Orden de Compra' : 'Ver Orden de Compra'}
              </h3>
              {order?.purchaseOrderId && (
                <p className="text-sm text-gray-600">ID: {order.purchaseOrderId}</p>
              )}
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody className="px-6">
          <div className="space-y-6">
            {/* Información del proveedor */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Información del Proveedor</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proveedor *
                    </label>
                    <Select
                      placeholder="Selecciona un proveedor"
                      selectedKeys={formData.supplierId ? [formData.supplierId] : []}
                      onSelectionChange={(keys) => handleSupplierChange(Array.from(keys)[0] as string)}
                      isDisabled={isReadOnly}
                      variant="flat"
                      classNames={{
                        trigger: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`,
                        value: "text-gray-900",
                        listboxWrapper: "bg-white",
                        popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                      }}
                    >
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier._id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación de Entrega *
                    </label>
                    <Input
                      placeholder="Ej: Almacén Principal"
                      value={formData.deliveryLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                      isDisabled={isReadOnly}
                      variant="flat"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago
                    </label>
                    <Select
                      placeholder="Selecciona método"
                      selectedKeys={[formData.paymentTerms.method]}
                      onSelectionChange={(keys) => setFormData(prev => ({
                        ...prev,
                        paymentTerms: { ...prev.paymentTerms, method: Array.from(keys)[0] as any }
                      }))}
                      isDisabled={isReadOnly}
                      variant="flat"
                      classNames={{
                        trigger: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`,
                        value: "text-gray-900",
                        listboxWrapper: "bg-white",
                        popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                      }}
                    >
                      <SelectItem key="cash">Efectivo</SelectItem>
                      <SelectItem key="credit">Crédito</SelectItem>
                      <SelectItem key="transfer">Transferencia</SelectItem>
                      <SelectItem key="check">Cheque</SelectItem>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de Crédito
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.paymentTerms.creditDays.toString()}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        paymentTerms: { ...prev.paymentTerms, creditDays: parseInt(e.target.value) || 0 }
                      }))}
                      isDisabled={isReadOnly}
                      variant="flat"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Entrega Esperada
                    </label>
                    <DateInput
                      placeholder="Selecciona fecha"
                      value={formData.expectedDeliveryDate ? parseDate(formData.expectedDeliveryDate.split('T')[0]) : null}
                      onChange={(date) => setFormData(prev => ({
                        ...prev,
                        expectedDeliveryDate: date?.toString()
                      }))}
                      isDisabled={isReadOnly}
                      variant="flat"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                      }}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Items de la orden */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Productos</h4>
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      color="primary"
                      startContent={<PlusIcon className="w-4 h-4" />}
                      onPress={addItem}
                    >
                      Agregar Producto
                    </Button>
                  )}
                </div>
                
                {formData.items.length > 0 ? (
                  <Table aria-label="Items de la orden">
                    <TableHeader>
                      <TableColumn>PRODUCTO</TableColumn>
                      <TableColumn>CANTIDAD</TableColumn>
                      <TableColumn>PRECIO UNIT.</TableColumn>
                      <TableColumn>TOTAL</TableColumn>
                      {!isReadOnly ? <TableColumn>ACCIONES</TableColumn> : null}
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {isReadOnly ? (
                              <div>
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-gray-500">{item.unit}</p>
                              </div>
                            ) : (
                              <Select
                                placeholder="Selecciona producto"
                                selectedKeys={item.productId ? [item.productId] : []}
                                onSelectionChange={(keys) => updateItem(index, 'productId', Array.from(keys)[0])}
                                className="min-w-[200px]"
                                variant="flat"
                                classNames={{
                                  trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                                  value: "text-gray-900",
                                  listboxWrapper: "bg-white",
                                  popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                                }}
                              >
                                {filteredProducts.map((product) => (
                                  <SelectItem key={product._id}>
                                    {product.name} ({product.sku})
                                  </SelectItem>
                                ))}
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            {isReadOnly ? (
                              <span>{item.quantity} {item.unit}</span>
                            ) : (
                              <Input
                                type="number"
                                placeholder="0"
                                value={item.quantity.toString()}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-20"
                                min="0.01"
                                step="0.01"
                                variant="flat"
                                classNames={{
                                  input: "text-gray-900",
                                  inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {isReadOnly ? (
                              formatCurrency(item.unitPrice)
                            ) : (
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={item.unitPrice.toString()}
                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-24"
                                min="0"
                                step="0.01"
                                startContent="$"
                                variant="flat"
                                classNames={{
                                  input: "text-gray-900",
                                  inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                          </TableCell>
                          {!isReadOnly ? (
                            <TableCell>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => removeItem(index)}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay productos agregados</p>
                    {!isReadOnly && (
                      <Button
                        className="mt-2"
                        color="primary"
                        variant="light"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={addItem}
                      >
                        Agregar primer producto
                      </Button>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Totales */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <CalculatorIcon className="w-4 h-4" />
                  Totales
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(formData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA ({(formData.taxRate * 100).toFixed(0)}%):</span>
                    <span className="font-medium">{formatCurrency(formData.tax)}</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(formData.total)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Notas */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <Textarea
                    placeholder="Notas adicionales para la orden..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    isDisabled={isReadOnly}
                    maxRows={3}
                    variant="flat"
                    classNames={{
                      input: "text-gray-900",
                      inputWrapper: `${isReadOnly ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        </ModalBody>
        
        <ModalFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <Button
              variant="light"
              onPress={onClose}
              isDisabled={loading}
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            {!isReadOnly && (
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={loading}
                startContent={!loading && <DocumentTextIcon className="w-4 h-4" />}
              >
                {mode === 'create' ? 'Crear Orden' : 'Guardar Cambios'}
              </Button>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}