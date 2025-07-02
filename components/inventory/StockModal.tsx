"use client"

import React, { useState } from "react"
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
  Chip
} from "@heroui/react"
import {
  ArrowsRightLeftIcon,
  CubeIcon,
  DocumentTextIcon,
  HashtagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  TagIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { MovementType } from "@/types/inventory"
import toast from "react-hot-toast"

interface StockItem {
  _id: string
  productId: {
    _id: string
    name: string
    sku: string
    category: string
  }
  locationId: string
  totals: {
    available: number
    reserved: number
    quarantine: number
    unit: string
  }
}

interface StockModalProps {
  isOpen: boolean
  onClose: () => void
  stockItem: StockItem
  onSuccess: () => void
}

export default function StockModal({ isOpen, onClose, stockItem, onSuccess }: StockModalProps) {
  const [movementType, setMovementType] = useState<string>(MovementType.ENTRADA)
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [batchId, setBatchId] = useState("")
  const [costPerUnit, setCostPerUnit] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!quantity || !reason) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    setLoading(true)
    try {
      const movementData = {
        productId: stockItem.productId._id,
        locationId: stockItem.locationId,
        type: movementType,
        quantity: parseFloat(quantity),
        unit: stockItem.totals.unit,
        reason,
        notes,
        ...(batchId && { batchId }),
        ...(costPerUnit && { costPerUnit: parseFloat(costPerUnit) }),
        ...(expiryDate && { expiryDate: new Date(expiryDate).toISOString() })
      }

      const response = await fetch('/api/inventory/stock/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movementData)
      })

      if (response.ok) {
        toast.success("Movimiento de inventario registrado exitosamente")
        onSuccess()
        handleClose()
      } else {
        const error = await response.json()
        toast.error(error.message || "Error al registrar el movimiento")
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMovementType(MovementType.ENTRADA)
    setQuantity("")
    setReason("")
    setNotes("")
    setBatchId("")
    setCostPerUnit("")
    setExpiryDate("")
    onClose()
  }

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case MovementType.ENTRADA:
        return 'success'
      case MovementType.SALIDA:
        return 'danger'
      case MovementType.TRANSFERENCIA:
        return 'primary'
      case MovementType.AJUSTE:
        return 'warning'
      case MovementType.MERMA:
        return 'danger'
      default:
        return 'default'
    }
  }

  const movementTypes = [
    { key: MovementType.ENTRADA, label: "Entrada", description: "Agregar stock al inventario" },
    { key: MovementType.SALIDA, label: "Salida", description: "Retirar stock del inventario" },
    { key: MovementType.TRANSFERENCIA, label: "Transferencia", description: "Mover entre ubicaciones" },
    { key: MovementType.AJUSTE, label: "Ajuste", description: "Corrección de inventario" },
    { key: MovementType.MERMA, label: "Merma", description: "Pérdida o deterioro" }
  ]

  const commonReasons = {
    [MovementType.ENTRADA]: [
      "Compra a proveedor",
      "Devolución de cliente",
      "Producción interna",
      "Transferencia desde otra ubicación"
    ],
    [MovementType.SALIDA]: [
      "Venta a cliente",
      "Uso en evento",
      "Transferencia a otra ubicación",
      "Muestra o degustación"
    ],
    [MovementType.AJUSTE]: [
      "Corrección de inventario",
      "Conteo físico",
      "Error de sistema",
      "Reconciliación"
    ],
    [MovementType.MERMA]: [
      "Producto vencido",
      "Daño durante transporte",
      "Deterioro por almacenamiento",
      "Rotura o derrame"
    ],
    [MovementType.TRANSFERENCIA]: [
      "Reubicación interna",
      "Optimización de espacio",
      "Reorganización de almacén"
    ]
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      scrollBehavior="inside"
      backdrop="opaque"
      placement="center"
      classNames={{
        backdrop: "bg-gray-900/20",
        base: "bg-white border border-gray-200 max-h-[90vh] my-4",
        wrapper: "z-[1001] items-center justify-center p-4 overflow-y-auto",
        header: "border-b border-gray-100 flex-shrink-0",
        body: "p-0 overflow-y-auto max-h-[calc(90vh-140px)]",
        footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
      }}
    >
      <ModalContent>
        <ModalHeader className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowsRightLeftIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Movimiento de Inventario
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600 truncate">{stockItem.productId?.name}</span>
                  <Chip size="sm" variant="flat" color="primary">
                    {stockItem.productId?.sku}
                  </Chip>
                  <Chip size="sm" variant="flat" color="default">
                    {stockItem.productId?.category}
                  </Chip>
                </div>
              </div>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody className="p-4 sm:p-6">
          {/* Layout responsivo con CSS Grid para desktop y Flexbox para móvil */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            
            {/* Stock Actual - Información destacada */}
            <Card className="border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 lg:col-span-3">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BuildingStorefrontIcon className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Stock Actual</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <span className="text-gray-600 block text-sm mb-1">Disponible</span>
                    <p className="font-bold text-green-600 text-xl">{stockItem.totals?.available}</p>
                    <span className="text-xs text-gray-500">{stockItem.totals?.unit}</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <span className="text-gray-600 block text-sm mb-1">Reservado</span>
                    <p className="font-bold text-orange-600 text-xl">{stockItem.totals?.reserved}</p>
                    <span className="text-xs text-gray-500">{stockItem.totals?.unit}</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <span className="text-gray-600 block text-sm mb-1">Ubicación</span>
                    <p className="font-semibold text-gray-900 text-lg">{stockItem.locationId}</p>
                    <span className="text-xs text-gray-500">Almacén</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Configuración del Movimiento - 2 columnas en desktop */}
            <Card className="border border-gray-200 lg:col-span-2">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CubeIcon className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Configuración del Movimiento</h4>
                </div>
                
                <div className="space-y-4">
                  {/* Tipo de movimiento */}
                  <div>
                    <Select
                      placeholder="Tipo de Movimiento *"
                      selectedKeys={[movementType]}
                      onSelectionChange={(keys) => setMovementType(Array.from(keys)[0] as string)}
                      variant="flat"
                      classNames={{
                        trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                        value: "text-gray-900",
                        listboxWrapper: "bg-white",
                        popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                      }}
                    >
                      {movementTypes.map((type) => (
                        <SelectItem key={type.key}>
                          <div className="flex items-center gap-2">
                            <Chip
                              size="sm"
                              variant="flat"
                              color={getMovementTypeColor(type.key) as any}
                              startContent={
                                type.key === MovementType.ENTRADA ? <PlusIcon className="w-3 h-3" /> :
                                type.key === MovementType.SALIDA ? <MinusIcon className="w-3 h-3" /> :
                                type.key === MovementType.TRANSFERENCIA ? <ArrowPathIcon className="w-3 h-3" /> :
                                type.key === MovementType.AJUSTE ? <CubeIcon className="w-3 h-3" /> :
                                <ExclamationTriangleIcon className="w-3 h-3" />
                              }
                            >
                              {type.label}
                            </Chip>
                            <span className="text-sm text-gray-600 hidden sm:inline">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Cantidad y Razón en grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="number"
                        placeholder="Cantidad *"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        startContent={<HashtagIcon className="w-4 h-4 text-gray-400" />}
                        endContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">{stockItem.totals?.unit}</span>
                          </div>
                        }
                        variant="flat"
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                        }}
                      />
                    </div>

                    <div>
                      <Select
                        placeholder="Razón del Movimiento *"
                        selectedKeys={reason ? [reason] : []}
                        onSelectionChange={(keys) => setReason(Array.from(keys)[0] as string)}
                        variant="flat"
                        classNames={{
                          trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900",
                          value: "text-gray-900",
                          listboxWrapper: "bg-white",
                          popoverContent: "bg-white border border-gray-200 shadow-lg rounded-lg"
                        }}
                      >
                        {(commonReasons[movementType as keyof typeof commonReasons] || []).map((reasonOption) => (
                          <SelectItem key={reasonOption}>
                            {reasonOption}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Notas adicionales */}
                  <div>
                    <Textarea
                      placeholder="Notas adicionales sobre el movimiento..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      minRows={2}
                      variant="flat"
                      classNames={{
                        input: "text-gray-900",
                        inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                      }}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Panel lateral para información adicional */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Información</h4>
                </div>
                
                <div className="space-y-3">
                  {/* Tipo de movimiento seleccionado */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Tipo Seleccionado</div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getMovementTypeColor(movementType) as any}
                      startContent={
                        movementType === MovementType.ENTRADA ? <PlusIcon className="w-3 h-3" /> :
                        movementType === MovementType.SALIDA ? <MinusIcon className="w-3 h-3" /> :
                        movementType === MovementType.TRANSFERENCIA ? <ArrowPathIcon className="w-3 h-3" /> :
                        movementType === MovementType.AJUSTE ? <CubeIcon className="w-3 h-3" /> :
                        <ExclamationTriangleIcon className="w-3 h-3" />
                      }
                    >
                      {movementTypes.find(t => t.key === movementType)?.label}
                    </Chip>
                  </div>

                  {/* Cálculo de stock resultante */}
                  {quantity && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-blue-600 mb-1">Stock Resultante</div>
                      <div className="text-sm font-medium text-blue-900">
                        {movementType === MovementType.ENTRADA
                          ? (stockItem.totals?.available || 0) + (parseFloat(quantity) || 0)
                          : (stockItem.totals?.available || 0) - (parseFloat(quantity) || 0)
                        } {stockItem.totals?.unit}
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Campos adicionales para entradas - Ocupa toda la fila */}
            {movementType === MovementType.ENTRADA && (
              <Card className="border border-blue-200 bg-blue-50 lg:col-span-3">
                <CardBody className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <PlusIcon className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Información de Entrada</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID del Lote
                      </label>
                      <Input
                        placeholder="Opcional"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        startContent={<TagIcon className="w-4 h-4 text-gray-400" />}
                        variant="flat"
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: "bg-white border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-500"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Costo por Unidad
                      </label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={costPerUnit}
                        onChange={(e) => setCostPerUnit(e.target.value)}
                        startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                        variant="flat"
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: "bg-white border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-500"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Caducidad
                      </label>
                      <Input
                        type="date"
                        placeholder="Opcional"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
                        variant="flat"
                        classNames={{
                          input: "text-gray-900",
                          inputWrapper: "bg-white border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-500"
                        }}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </ModalBody>
        
        <ModalFooter className="px-6 py-4">
          <div className="flex gap-3 justify-between items-center w-full">
            <div className="flex gap-3">
              {/* Espacio para botones adicionales si es necesario */}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="light"
                onPress={handleClose}
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </Button>
              
              <Button
                onPress={handleSubmit}
                isLoading={loading}
                isDisabled={!quantity || !reason}
                size="sm"
                className="bg-gray-900 text-white hover:bg-gray-800"
                startContent={!loading && <ArrowsRightLeftIcon className="w-4 h-4" />}
              >
                {loading ? 'Registrando...' : 'Registrar Movimiento'}
              </Button>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}