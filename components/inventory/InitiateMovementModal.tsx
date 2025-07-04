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
  CubeIcon,
  MapPinIcon,
  PlusIcon,
  HashtagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import toast from "react-hot-toast"

interface Product {
  _id: string
  name: string
  sku: string
  category: string
  units: {
    base: {
      code: string
      name: string
    }
  }
}

interface InitiateMovementModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
  onSuccess: () => void
}

const AVAILABLE_LOCATIONS = [
  { id: 'almacen', name: 'Almacén Principal' },
  { id: 'cocina', name: 'Cocina' },
  { id: 'salon', name: 'Salón' },
  { id: 'bodega', name: 'Bodega' },
  { id: 'recepcion', name: 'Recepción' }
]

export default function InitiateMovementModal({ isOpen, onClose, product, onSuccess }: InitiateMovementModalProps) {
  const [selectedLocation, setSelectedLocation] = useState("")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("Stock inicial")
  const [notes, setNotes] = useState("")
  const [batchId, setBatchId] = useState("")
  const [costPerUnit, setCostPerUnit] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!selectedLocation || !quantity || !reason) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    setLoading(true)
    try {
      const movementData = {
        productId: product._id,
        locationId: selectedLocation,
        type: 'ENTRADA',
        quantity: parseFloat(quantity),
        unit: product.units.base.code,
        reason,
        notes,
        isInitialMovement: true, // Marcar como movimiento inicial
        ...(batchId && { batchId }),
        ...(costPerUnit && { costPerUnit: parseFloat(costPerUnit) }),
        ...(expiryDate && { expiryDate: new Date(expiryDate).toISOString() })
      }

      const response = await fetch('/api/inventory/stock/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movementData)
      })

      if (response.ok) {
        toast.success("Primer movimiento registrado exitosamente")
        onSuccess()
        handleClose()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al registrar el movimiento")
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedLocation("")
    setQuantity("")
    setReason("Stock inicial")
    setNotes("")
    setBatchId("")
    setCostPerUnit("")
    setExpiryDate("")
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      backdrop="opaque"
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <PlusIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Iniciar Movimientos de Inventario</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">{product.name}</span>
                <Chip size="sm" variant="flat" color="primary">{product.sku}</Chip>
              </div>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody className="px-6">
          <div className="space-y-6">
            <Card className="border border-orange-200 bg-orange-50">
              <CardBody className="p-4">
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Primer movimiento de inventario</p>
                  <p>Este será el primer registro de inventario para este producto. Selecciona la ubicación inicial y la cantidad de stock.</p>
                </div>
              </CardBody>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  placeholder="Ubicación *"
                  selectedKeys={selectedLocation ? [selectedLocation] : []}
                  onSelectionChange={(keys) => setSelectedLocation(Array.from(keys)[0] as string)}
                  variant="flat"
                  startContent={<MapPinIcon className="w-4 h-4 text-gray-400" />}
                >
                  {AVAILABLE_LOCATIONS.map((location) => (
                    <SelectItem key={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <Input
                  type="number"
                  placeholder="Cantidad inicial *"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  startContent={<HashtagIcon className="w-4 h-4 text-gray-400" />}
                  endContent={
                    <span className="text-gray-400 text-sm">
                      {product.units.base.code}
                    </span>
                  }
                  variant="flat"
                />
              </div>
            </div>

            <div>
              <Input
                placeholder="Razón del movimiento *"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                variant="flat"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="ID del Lote (opcional)"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  startContent={<TagIcon className="w-4 h-4 text-gray-400" />}
                  variant="flat"
                />
              </div>
              
              <div>
                <Input
                  type="number"
                  placeholder="Costo por unidad"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                  variant="flat"
                />
              </div>
              
              <div>
                <Input
                  type="date"
                  placeholder="Fecha de vencimiento"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
                  variant="flat"
                />
              </div>
            </div>

            <div>
              <Textarea
                placeholder="Notas adicionales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                minRows={2}
                variant="flat"
              />
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <Button
              variant="light"
              onPress={handleClose}
            >
              Cancelar
            </Button>
            
            <Button
              color="warning"
              onPress={handleSubmit}
              isLoading={loading}
              isDisabled={!selectedLocation || !quantity || !reason}
              startContent={!loading && <PlusIcon className="w-4 h-4" />}
            >
              {loading ? 'Creando...' : 'Crear Primer Movimiento'}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}