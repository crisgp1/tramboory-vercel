"use client"

import React, { useState, useEffect } from "react"
import { 
  Card, 
  CardBody, 
  CardHeader,
  Chip,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Progress,
  Divider,
  Badge
} from "@heroui/react"
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ClockIcon,
  EyeIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline"
import { ExclamationTriangleIcon as ExclamationTriangleSolid } from "@heroicons/react/24/solid"
import { 
  SupplierPenalty, 
  PenaltySeverity, 
  PenaltyStatus, 
  PENALTY_CONCEPTS, 
  SEVERITY_CONFIG 
} from "@/types/supplier-penalties"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface SupplierPenaltyDisplayProps {
  supplierId: string
  className?: string
}

export default function SupplierPenaltyDisplay({ supplierId, className = "" }: SupplierPenaltyDisplayProps) {
  const [penalties, setPenalties] = useState<SupplierPenalty[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPenalty, setSelectedPenalty] = useState<SupplierPenalty | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPenaltyPoints, setTotalPenaltyPoints] = useState(0)

  useEffect(() => {
    fetchPenalties()
  }, [supplierId])

  const fetchPenalties = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/inventory/suppliers/penalties?supplierId=${supplierId}&status=ACTIVE&limit=10`)
      
      if (!response.ok) {
        throw new Error('Error al cargar penalizaciones')
      }
      
      const data = await response.json()
      setPenalties(data.penalties || [])
      
      // Calcular total de puntos de penalización activos
      const totalPoints = data.penalties
        ?.filter((p: SupplierPenalty) => p.status === PenaltyStatus.ACTIVE)
        .reduce((sum: number, p: SupplierPenalty) => sum + p.penaltyValue, 0) || 0
      
      setTotalPenaltyPoints(totalPoints)
    } catch (error) {
      console.error('Error fetching penalties:', error)
      setError('Error al cargar penalizaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (penalty: SupplierPenalty) => {
    setSelectedPenalty(penalty)
    setShowModal(true)
  }

  const getPenaltyIcon = (concept: string) => {
    const config = PENALTY_CONCEPTS.find(c => c.concept === concept)
    return config?.icon || 'ExclamationTriangleIcon'
  }

  const getPenaltyColor = (severity: PenaltySeverity) => {
    return SEVERITY_CONFIG[severity].color
  }

  const getStatusColor = (status: PenaltyStatus) => {
    switch (status) {
      case PenaltyStatus.ACTIVE:
        return 'danger'
      case PenaltyStatus.EXPIRED:
        return 'default'
      case PenaltyStatus.APPEALED:
        return 'warning'
      case PenaltyStatus.REVERSED:
        return 'success'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: PenaltyStatus) => {
    switch (status) {
      case PenaltyStatus.ACTIVE:
        return 'Activo'
      case PenaltyStatus.EXPIRED:
        return 'Expirado'
      case PenaltyStatus.APPEALED:
        return 'Apelado'
      case PenaltyStatus.REVERSED:
        return 'Revertido'
      default:
        return status
    }
  }

  const formatTimeAgo = (dateString: string | Date) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: es 
    })
  }

  const getPenaltyRiskLevel = (points: number) => {
    if (points <= 10) return { level: 'Bajo', color: 'success', progress: 25 }
    if (points <= 30) return { level: 'Medio', color: 'warning', progress: 50 }
    if (points <= 50) return { level: 'Alto', color: 'danger', progress: 75 }
    return { level: 'Crítico', color: 'danger', progress: 100 }
  }

  const riskLevel = getPenaltyRiskLevel(totalPenaltyPoints)

  if (loading) {
    return (
      <Card className={`${className} bg-white border-0 shadow-sm`}>
        <CardBody className="p-6">
          <div className="flex items-center justify-center">
            <Spinner size="lg" color="primary" />
            <span className="ml-2 text-gray-600">Cargando penalizaciones...</span>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <>
      <Card className={`${className} bg-white border-0 shadow-sm`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ShieldExclamationIcon className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Penalizaciones</h3>
            </div>
            {penalties.length > 0 && (
              <Badge content={penalties.length} color="danger" size="sm">
                <ExclamationTriangleSolid className="w-5 h-5 text-red-600" />
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardBody className="pt-0">
          {error ? (
            <div className="text-center py-8">
              <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button 
                size="sm" 
                variant="flat" 
                color="primary"
                startContent={<ArrowPathIcon className="w-4 h-4" />}
                onPress={fetchPenalties}
              >
                Reintentar
              </Button>
            </div>
          ) : penalties.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-green-600 font-medium">¡Sin penalizaciones!</p>
              <p className="text-gray-500 text-sm">Tu cuenta está en buen estado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumen de puntos de penalización */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Total de Puntos de Penalización</span>
                  <span className="text-lg font-bold text-red-600">{totalPenaltyPoints} pts</span>
                </div>
                <Progress 
                  value={Math.min(riskLevel.progress, 100)} 
                  color={riskLevel.color as any}
                  className="mb-2" 
                />
                <div className="flex items-center justify-between">
                  <Chip 
                    size="sm" 
                    variant="flat" 
                    color={riskLevel.color as any}
                    className="text-xs"
                  >
                    Riesgo {riskLevel.level}
                  </Chip>
                  <span className="text-xs text-gray-500">
                    {totalPenaltyPoints > 70 ? 'Riesgo de suspensión' : 'Cuenta activa'}
                  </span>
                </div>
              </div>

              <Divider />

              {/* Lista de penalizaciones */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Penalizaciones Activas</h4>
                {penalties.slice(0, 5).map((penalty) => {
                  const concept = PENALTY_CONCEPTS.find(c => c.concept === penalty.concept)
                  return (
                    <div 
                      key={penalty._id} 
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            penalty.severity === PenaltySeverity.CRITICAL 
                              ? 'bg-red-100' 
                              : penalty.severity === PenaltySeverity.MAJOR 
                                ? 'bg-orange-100' 
                                : 'bg-yellow-100'
                          }`}>
                            <ExclamationTriangleIcon className={`w-4 h-4 ${
                              penalty.severity === PenaltySeverity.CRITICAL 
                                ? 'text-red-600' 
                                : penalty.severity === PenaltySeverity.MAJOR 
                                  ? 'text-orange-600' 
                                  : 'text-yellow-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {concept?.label || penalty.concept}
                              </p>
                              <Chip 
                                size="sm" 
                                variant="flat" 
                                color={getPenaltyColor(penalty.severity)}
                                className="text-xs"
                              >
                                {SEVERITY_CONFIG[penalty.severity].label}
                              </Chip>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {penalty.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {formatTimeAgo(penalty.appliedAt)}
                              </span>
                              <span className="text-xs font-medium text-red-600">
                                {penalty.penaltyValue} pts
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => handleViewDetails(penalty)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {penalties.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="light" size="sm" color="primary">
                    Ver todas las penalizaciones ({penalties.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de detalles */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        size="2xl"
        backdrop="opaque"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Detalles de la Penalización</h3>
            <p className="text-sm text-gray-600">Información completa del castigo aplicado</p>
          </ModalHeader>
          <ModalBody>
            {selectedPenalty && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Concepto</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {PENALTY_CONCEPTS.find(c => c.concept === selectedPenalty.concept)?.label || selectedPenalty.concept}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Severidad</label>
                    <div className="mt-1">
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color={getPenaltyColor(selectedPenalty.severity)}
                      >
                        {SEVERITY_CONFIG[selectedPenalty.severity].label}
                      </Chip>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Descripción</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedPenalty.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Puntos de Penalización</label>
                    <p className="text-sm font-bold text-red-600 mt-1">{selectedPenalty.penaltyValue} pts</p>
                  </div>
                  {selectedPenalty.monetaryPenalty && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Penalización Monetaria</label>
                      <p className="text-sm font-bold text-red-600 mt-1">${selectedPenalty.monetaryPenalty}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fecha de Aplicación</label>
                    <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                      <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                      {new Date(selectedPenalty.appliedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {selectedPenalty.expiresAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Fecha de Expiración</label>
                      <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                        {new Date(selectedPenalty.expiresAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <div className="mt-1">
                    <Chip 
                      size="sm" 
                      variant="flat" 
                      color={getStatusColor(selectedPenalty.status)}
                    >
                      {getStatusLabel(selectedPenalty.status)}
                    </Chip>
                  </div>
                </div>

                {selectedPenalty.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notas Adicionales</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedPenalty.notes}</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Información Importante</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Las penalizaciones afectan tu puntuación general y pueden impactar tu elegibilidad para recibir nuevas órdenes. 
                        Si consideras que esta penalización es injusta, puedes contactar a nuestro equipo de soporte.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="light" 
              onPress={() => setShowModal(false)}
            >
              Cerrar
            </Button>
            <Button 
              color="primary" 
              variant="flat"
              startContent={<InformationCircleIcon className="w-4 h-4" />}
            >
              Contactar Soporte
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}