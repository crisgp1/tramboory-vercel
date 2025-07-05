"use client"

import React, { useState } from "react"
import { 
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Textarea,
  Input,
  Card,
  CardBody,
  Chip,
  Divider,
  Avatar
} from "@heroui/react"
import {
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ArchiveBoxIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  XCircleIcon,
  DocumentMagnifyingGlassIcon,
  CalculatorIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  ArrowPathIcon,
  EllipsisHorizontalIcon
} from "@heroicons/react/24/outline"
import { 
  PenaltyConcept, 
  PenaltySeverity, 
  PENALTY_CONCEPTS, 
  SEVERITY_CONFIG,
  PenaltyConceptConfig 
} from "@/types/supplier-penalties"
import toast from "react-hot-toast"

interface Supplier {
  _id: string
  name: string
  code: string
  contactInfo: {
    email: string
    phone: string
    contactPerson?: string
  }
  userImageUrl?: string
  isActive: boolean
}

interface SupplierPenaltyModalProps {
  isOpen: boolean
  onClose: () => void
  supplier: Supplier | null
  onSuccess: () => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ClockIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  ExclamationCircleIcon,
  ShieldExclamationIcon,
  CalendarDaysIcon,
  XCircleIcon,
  DocumentMagnifyingGlassIcon,
  CalculatorIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon
}

export default function SupplierPenaltyModal({
  isOpen,
  onClose,
  supplier,
  onSuccess
}: SupplierPenaltyModalProps) {
  const [selectedConcept, setSelectedConcept] = useState<PenaltyConcept | null>(null)
  const [selectedSeverity, setSelectedSeverity] = useState<PenaltySeverity | null>(null)
  const [description, setDescription] = useState("")
  const [penaltyPoints, setPenaltyPoints] = useState<number>(0)
  const [monetaryPenalty, setMonetaryPenalty] = useState<number>(0)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedConceptConfig = selectedConcept 
    ? PENALTY_CONCEPTS.find(c => c.concept === selectedConcept)
    : null

  const handleConceptChange = (concept: PenaltyConcept) => {
    setSelectedConcept(concept)
    const config = PENALTY_CONCEPTS.find(c => c.concept === concept)
    if (config) {
      setSelectedSeverity(config.defaultSeverity)
      setPenaltyPoints(config.defaultPoints)
      setDescription(config.description)
    }
  }

  const handleSeverityChange = (severity: PenaltySeverity) => {
    setSelectedSeverity(severity)
    if (selectedConceptConfig) {
      // Ajustar puntos basado en severidad
      const basePuntos = selectedConceptConfig.defaultPoints
      let multiplicador = 1
      
      switch (severity) {
        case PenaltySeverity.MINOR:
          multiplicador = 0.7
          break
        case PenaltySeverity.MODERATE:
          multiplicador = 1
          break
        case PenaltySeverity.MAJOR:
          multiplicador = 1.5
          break
        case PenaltySeverity.CRITICAL:
          multiplicador = 2
          break
      }
      
      setPenaltyPoints(Math.round(basePuntos * multiplicador))
    }
  }

  const handleSubmit = async () => {
    if (!supplier || !selectedConcept || !selectedSeverity) {
      toast.error("Por favor completa todos los campos obligatorios")
      return
    }

    if (!description.trim()) {
      toast.error("La descripción es obligatoria")
      return
    }

    if (penaltyPoints <= 0) {
      toast.error("Los puntos de penalización deben ser mayor a 0")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/inventory/suppliers/penalties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId: supplier._id,
          supplierName: supplier.name,
          concept: selectedConcept,
          severity: selectedSeverity,
          description: description.trim(),
          penaltyValue: penaltyPoints,
          monetaryPenalty: monetaryPenalty > 0 ? monetaryPenalty : undefined,
          notes: notes.trim() || undefined
        })
      })

      if (response.ok) {
        toast.success("Castigo aplicado exitosamente")
        onSuccess()
        handleClose()
      } else {
        const error = await response.json()
        toast.error(error.message || "Error al aplicar el castigo")
      }
    } catch (error) {
      console.error('Error aplicando castigo:', error)
      toast.error("Error al aplicar el castigo")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedConcept(null)
    setSelectedSeverity(null)
    setDescription("")
    setPenaltyPoints(0)
    setMonetaryPenalty(0)
    setNotes("")
    onClose()
  }

  if (!supplier) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      backdrop="opaque"
      placement="center"
      scrollBehavior="inside"
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
        <ModalHeader className="px-6 py-4">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Aplicar Castigo</h3>
              <p className="text-sm text-gray-600 mt-1">
                Penalizar proveedor por incumplimientos o problemas
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Información del Proveedor */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={supplier.userImageUrl}
                    icon={!supplier.userImageUrl ? <UserIcon className="w-4 h-4" /> : undefined}
                    size="md"
                    className="bg-gray-100 text-gray-600"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                    <p className="text-sm text-gray-500">{supplier.code}</p>
                    <p className="text-xs text-gray-500">{supplier.contactInfo.email}</p>
                  </div>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={supplier.isActive ? 'success' : 'danger'}
                  >
                    {supplier.isActive ? 'Activo' : 'Inactivo'}
                  </Chip>
                </div>
              </CardBody>
            </Card>

            {/* Concepto del Castigo */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                Concepto del Castigo *
              </label>
              <Select
                placeholder="Selecciona el motivo del castigo"
                selectedKeys={selectedConcept ? [selectedConcept] : []}
                onSelectionChange={(keys) => {
                  const concept = Array.from(keys)[0] as PenaltyConcept
                  if (concept) handleConceptChange(concept)
                }}
                className="w-full"
                variant="flat"
                classNames={{
                  trigger: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-red-500",
                  value: "text-gray-900"
                }}
              >
                {Object.entries(
                  PENALTY_CONCEPTS.reduce((acc, concept) => {
                    if (!acc[concept.category]) acc[concept.category] = []
                    acc[concept.category].push(concept)
                    return acc
                  }, {} as Record<string, PenaltyConceptConfig[]>)
                ).map(([category, concepts]) => (
                  <SelectItem key={`category-${category}`} className="text-xs text-gray-500 font-medium" isDisabled>
                    {category.toUpperCase()}
                  </SelectItem>
                )).concat(
                  PENALTY_CONCEPTS.map((concept) => {
                    const IconComponent = iconMap[concept.icon]
                    return (
                      <SelectItem 
                        key={concept.concept}
                        startContent={
                          IconComponent ? (
                            <IconComponent className="w-4 h-4 text-gray-500" />
                          ) : null
                        }
                        description={concept.description}
                      >
                        {concept.label}
                      </SelectItem>
                    )
                  })
                )}
              </Select>
            </div>

            {/* Severidad */}
            {selectedConcept && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ShieldExclamationIcon className="w-4 h-4 text-gray-500" />
                  Severidad *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(SEVERITY_CONFIG).map(([severity, config]) => (
                    <Button
                      key={severity}
                      variant={selectedSeverity === severity ? "solid" : "bordered"}
                      color={selectedSeverity === severity ? config.color : "default"}
                      size="sm"
                      className="h-auto p-3 flex flex-col items-center gap-1"
                      onPress={() => handleSeverityChange(severity as PenaltySeverity)}
                    >
                      <span className="font-medium text-xs">{config.label}</span>
                      <span className="text-xs opacity-70">{config.pointRange}</span>
                    </Button>
                  ))}
                </div>
                {selectedSeverity && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600">
                      {SEVERITY_CONFIG[selectedSeverity].description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Descripción */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Descripción Detallada *
              </label>
              <Textarea
                placeholder="Describe detalladamente el problema o incumplimiento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                minRows={3}
                maxRows={5}
                variant="flat"
                classNames={{
                  input: "bg-gray-50 border-0",
                  inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-red-500"
                }}
              />
            </div>

            {/* Puntos de Penalización */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Puntos de Penalización *
                </label>
                <Input
                  type="number"
                  value={penaltyPoints.toString()}
                  onChange={(e) => setPenaltyPoints(parseInt(e.target.value) || 0)}
                  min={1}
                  max={100}
                  placeholder="0"
                  variant="flat"
                  classNames={{
                    input: "bg-gray-50 border-0",
                    inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-red-500"
                  }}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                  Penalización Monetaria (Opcional)
                </label>
                <Input
                  type="number"
                  value={monetaryPenalty.toString()}
                  onChange={(e) => setMonetaryPenalty(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">$</span>
                    </div>
                  }
                  variant="flat"
                  classNames={{
                    input: "bg-gray-50 border-0",
                    inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-red-500"
                  }}
                />
              </div>
            </div>

            {/* Notas Adicionales */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Notas Adicionales
              </label>
              <Textarea
                placeholder="Información adicional, acciones tomadas, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                minRows={2}
                maxRows={3}
                variant="flat"
                classNames={{
                  input: "bg-gray-50 border-0",
                  inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                }}
              />
            </div>

            {/* Resumen */}
            {selectedConcept && selectedSeverity && (
              <>
                <Divider />
                <Card className="border border-red-200 bg-red-50">
                  <CardBody className="p-4">
                    <h5 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      Resumen del Castigo
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-red-700">Concepto:</span>
                        <span className="font-medium text-red-900">{selectedConceptConfig?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Severidad:</span>
                        <Chip size="sm" variant="flat" color={SEVERITY_CONFIG[selectedSeverity].color}>
                          {SEVERITY_CONFIG[selectedSeverity].label}
                        </Chip>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Puntos de Penalización:</span>
                        <span className="font-bold text-red-900">{penaltyPoints} pts</span>
                      </div>
                      {monetaryPenalty > 0 && (
                        <div className="flex justify-between">
                          <span className="text-red-700">Penalización Monetaria:</span>
                          <span className="font-bold text-red-900">${monetaryPenalty.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <Button
              variant="light"
              onPress={handleClose}
              disabled={loading}
              className="text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleSubmit}
              isLoading={loading}
              disabled={!selectedConcept || !selectedSeverity || !description.trim() || penaltyPoints <= 0}
              startContent={!loading ? <ExclamationTriangleIcon className="w-4 h-4" /> : null}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {loading ? "Aplicando..." : "Aplicar Castigo"}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}