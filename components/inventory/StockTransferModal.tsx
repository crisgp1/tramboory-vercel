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
  Divider,
  Autocomplete,
  AutocompleteItem
} from "@heroui/react"
import {
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  TruckIcon,
  BuildingStorefrontIcon
} from "@heroicons/react/24/outline"
import toast from "react-hot-toast"

interface TransferItem {
  productId: string
  productName: string
  productSku: string
  batchNumber?: string
  quantity: number
  unit: string
  availableQuantity: number
}

interface StockTransfer {
  _id?: string
  transferId?: string
  fromLocation: string
  toLocation: string
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  items: TransferItem[]
  notes?: string
  requestedBy?: string
  approvedBy?: string
  completedBy?: string
  requestedAt?: string
  approvedAt?: string
  completedAt?: string
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
  }
  trackBatches: boolean
}

interface StockLocation {
  location: string
  quantity: number
  batches?: Array<{
    batchNumber: string
    quantity: number
  }>
}

interface ProductStock {
  productId: string
  productName: string
  productSku: string
  locations: StockLocation[]
}

interface StockTransferModalProps {
  isOpen: boolean
  onClose: () => void
  transfer?: StockTransfer | null
  mode: 'create' | 'edit' | 'view'
  onSuccess: () => void
}

export default function StockTransferModal({
  isOpen,
  onClose,
  transfer,
  mode,
  onSuccess
}: StockTransferModalProps) {
  const [formData, setFormData] = useState<StockTransfer>({
    fromLocation: '',
    toLocation: '',
    status: 'pending',
    items: []
  })

  const [products, setProducts] = useState<Product[]>([])
  const [productStocks, setProductStocks] = useState<ProductStock[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchLocations()
      
      if (transfer && mode !== 'create') {
        setFormData(transfer)
      } else {
        resetForm()
      }
    }
  }, [isOpen, transfer, mode])

  useEffect(() => {
    if (formData.fromLocation) {
      fetchProductStocks(formData.fromLocation)
    }
  }, [formData.fromLocation])

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

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/inventory/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchProductStocks = async (location: string) => {
    try {
      const response = await fetch(`/api/inventory/stock?location=${encodeURIComponent(location)}`)
      if (response.ok) {
        const data = await response.json()
        setProductStocks(data.stocks || [])
      }
    } catch (error) {
      console.error('Error fetching product stocks:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      fromLocation: '',
      toLocation: '',
      status: 'pending',
      items: []
    })
  }

  const addItem = () => {
    const newItem: TransferItem = {
      productId: '',
      productName: '',
      productSku: '',
      quantity: 0,
      unit: '',
      availableQuantity: 0
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
  }

  const updateItem = (index: number, field: keyof TransferItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      
      // Si es un producto, actualizar información automáticamente
      if (field === 'productId') {
        const product = products.find(p => p._id === value)
        const stock = productStocks.find(s => s.productId === value)
        
        if (product && stock) {
          newItems[index].productName = product.name
          newItems[index].productSku = product.sku
          newItems[index].unit = product.units.base.code
          
          // Calcular cantidad disponible en la ubicación origen
          const locationStock = stock.locations.find(l => l.location === formData.fromLocation)
          newItems[index].availableQuantity = locationStock?.quantity || 0
        }
      }
      
      return { ...prev, items: newItems }
    })
  }

  const updateBatchItem = (index: number, batchNumber: string) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], batchNumber }
      
      // Actualizar cantidad disponible del lote específico
      const stock = productStocks.find(s => s.productId === newItems[index].productId)
      if (stock) {
        const locationStock = stock.locations.find(l => l.location === formData.fromLocation)
        const batch = locationStock?.batches?.find(b => b.batchNumber === batchNumber)
        newItems[index].availableQuantity = batch?.quantity || 0
      }
      
      return { ...prev, items: newItems }
    })
  }

  const handleSubmit = async () => {
    if (!formData.fromLocation || !formData.toLocation) {
      toast.error('Selecciona las ubicaciones de origen y destino')
      return
    }
    
    if (formData.fromLocation === formData.toLocation) {
      toast.error('Las ubicaciones de origen y destino deben ser diferentes')
      return
    }
    
    if (formData.items.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }
    
    if (formData.items.some(item => !item.productId || item.quantity <= 0)) {
      toast.error('Completa todos los campos de los productos')
      return
    }
    
    if (formData.items.some(item => item.quantity > item.availableQuantity)) {
      toast.error('La cantidad a transferir no puede ser mayor a la disponible')
      return
    }

    setLoading(true)
    try {
      const url = mode === 'create' 
        ? '/api/inventory/transfers'
        : `/api/inventory/transfers/${transfer?._id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(`Transferencia ${mode === 'create' ? 'creada' : 'actualizada'} exitosamente`)
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al guardar la transferencia')
      }
    } catch (error) {
      console.error('Error saving transfer:', error)
      toast.error('Error al guardar la transferencia')
    } finally {
      setLoading(false)
    }
  }

  const getAvailableBatches = (productId: string) => {
    const stock = productStocks.find(s => s.productId === productId)
    if (!stock) return []
    
    const locationStock = stock.locations.find(l => l.location === formData.fromLocation)
    return locationStock?.batches || []
  }

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
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <TruckIcon className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {mode === 'create' ? 'Nueva Transferencia de Stock' : 
                 mode === 'edit' ? 'Editar Transferencia' : 'Ver Transferencia'}
              </h3>
              {transfer?.transferId && (
                <p className="text-sm text-gray-600">ID: {transfer.transferId}</p>
              )}
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody className="px-6">
          <div className="space-y-6">
            {/* Información de ubicaciones */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <BuildingStorefrontIcon className="w-4 h-4" />
                  Ubicaciones
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación de Origen *
                    </label>
                    <Select
                      placeholder="Selecciona origen"
                      selectedKeys={formData.fromLocation ? [formData.fromLocation] : []}
                      onSelectionChange={(keys) => setFormData(prev => ({
                        ...prev,
                        fromLocation: Array.from(keys)[0] as string,
                        items: [] // Limpiar items al cambiar origen
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
                      {locations.map((location) => (
                        <SelectItem key={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ArrowRightIcon className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación de Destino *
                    </label>
                    <Select
                      placeholder="Selecciona destino"
                      selectedKeys={formData.toLocation ? [formData.toLocation] : []}
                      onSelectionChange={(keys) => setFormData(prev => ({
                        ...prev,
                        toLocation: Array.from(keys)[0] as string
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
                      {locations.filter(loc => loc !== formData.fromLocation).map((location) => (
                        <SelectItem key={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Items de transferencia */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Productos a Transferir</h4>
                  {!isReadOnly && formData.fromLocation && (
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
                
                {!formData.fromLocation && !isReadOnly && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Selecciona primero la ubicación de origen</p>
                  </div>
                )}
                
                {formData.fromLocation && formData.items.length > 0 ? (
                  <Table aria-label="Items de transferencia">
                    <TableHeader>
                      <TableColumn>PRODUCTO</TableColumn>
                      <TableColumn>LOTE</TableColumn>
                      <TableColumn>CANTIDAD</TableColumn>
                      <TableColumn>DISPONIBLE</TableColumn>
                      <TableColumn>ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => {
                        const product = products.find(p => p._id === item.productId)
                        const availableBatches = getAvailableBatches(item.productId)
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              {isReadOnly ? (
                                <div>
                                  <p className="font-medium">{item.productName}</p>
                                  <p className="text-sm text-gray-500">{item.productSku}</p>
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
                                  {productStocks.map((stock) => (
                                    <SelectItem key={stock.productId}>
                                      {stock.productName} ({stock.productSku})
                                    </SelectItem>
                                  ))}
                                </Select>
                              )}
                            </TableCell>
                            <TableCell>
                              {product?.trackBatches ? (
                                isReadOnly ? (
                                  <span>{item.batchNumber || 'N/A'}</span>
                                ) : (
                                  <Select
                                    placeholder="Selecciona lote"
                                    selectedKeys={item.batchNumber ? [item.batchNumber] : []}
                                    onSelectionChange={(keys) => updateBatchItem(index, Array.from(keys)[0] as string)}
                                    className="min-w-[120px]"
                                    isDisabled={!item.productId}
                                    variant="flat"
                                    classNames={{
                                      trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                                      value: "text-gray-900",
                                      listboxWrapper: "bg-white",
                                      popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                                    }}
                                  >
                                    {availableBatches.map((batch) => (
                                      <SelectItem key={batch.batchNumber}>
                                        {batch.batchNumber}
                                      </SelectItem>
                                    ))}
                                  </Select>
                                )
                              ) : (
                                <span className="text-gray-400">Sin lotes</span>
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
                                  className="w-24"
                                  min="0.01"
                                  step="0.01"
                                  max={item.availableQuantity}
                                  endContent={item.unit}
                                  variant="flat"
                                  classNames={{
                                    input: "text-gray-900",
                                    inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{item.availableQuantity} {item.unit}</span>
                                {item.quantity > item.availableQuantity && (
                                  <Chip color="danger" size="sm" variant="flat">
                                    Insuficiente
                                  </Chip>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {!isReadOnly ? (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  onPress={() => removeItem(index)}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              ) : (
                                <span>-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : formData.fromLocation && !isReadOnly ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay productos agregados</p>
                    <Button
                      className="mt-2"
                      color="primary"
                      variant="light"
                      startContent={<PlusIcon className="w-4 h-4" />}
                      onPress={addItem}
                    >
                      Agregar primer producto
                    </Button>
                  </div>
                ) : null}
              </CardBody>
            </Card>

            {/* Estado y notas */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <Select
                      placeholder="Selecciona estado"
                      selectedKeys={[formData.status]}
                      onSelectionChange={(keys) => setFormData(prev => ({
                        ...prev,
                        status: Array.from(keys)[0] as any
                      }))}
                      isDisabled={isReadOnly || mode === 'create'}
                      variant="flat"
                      classNames={{
                        trigger: `${(isReadOnly || mode === 'create') ? 'bg-gray-100 opacity-60' : 'bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900'}`,
                        value: "text-gray-900",
                        listboxWrapper: "bg-white",
                        popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                      }}
                    >
                      <SelectItem key="pending">Pendiente</SelectItem>
                      <SelectItem key="in_transit">En Tránsito</SelectItem>
                      <SelectItem key="completed">Completada</SelectItem>
                      <SelectItem key="cancelled">Cancelada</SelectItem>
                    </Select>
                  </div>
                  
                  <div></div>
                </div>
                
                <div className="mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas
                    </label>
                    <Textarea
                      placeholder="Notas adicionales para la transferencia..."
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
                startContent={!loading && <TruckIcon className="w-4 h-4" />}
              >
                {mode === 'create' ? 'Crear Transferencia' : 'Guardar Cambios'}
              </Button>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}