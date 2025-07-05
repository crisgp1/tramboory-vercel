"use client"

import React, { useState, useEffect } from "react"
import { 
  Card, 
  CardBody, 
  Button, 
  Badge,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react"
import {
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon,
  EyeIcon
} from "@heroicons/react/24/outline"
import { AlertPriority, AlertType } from "@/types/inventory"
import { IInventoryAlert } from "@/lib/models/inventory/InventoryAlert"

export default function InventoryAlerts() {
  const [alerts, setAlerts] = useState<IInventoryAlert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<IInventoryAlert | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Cargar alertas al montar el componente
  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/inventory/alerts?status=active')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const handleDismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/inventory/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'dismissed' })
      })

      if (response.ok) {
        setAlerts(alerts.filter(alert => alert._id !== alertId))
      }
    } catch (error) {
      console.error('Error dismissing alert:', error)
    }
  }

  const handleViewAlert = (alert: IInventoryAlert) => {
    setSelectedAlert(alert)
    onOpen()
  }

  const getPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case AlertPriority.CRITICAL:
        return 'danger'
      case AlertPriority.HIGH:
        return 'warning'
      case AlertPriority.MEDIUM:
        return 'primary'
      case AlertPriority.LOW:
        return 'default'
      default:
        return 'default'
    }
  }

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.LOW_STOCK:
        return <ExclamationTriangleIcon className="w-4 h-4" />
      case AlertType.EXPIRY_WARNING:
        return <ClockIcon className="w-4 h-4" />
      default:
        return <ExclamationTriangleIcon className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: AlertType) => {
    switch (type) {
      case AlertType.LOW_STOCK:
        return 'Stock Bajo'
      case AlertType.EXPIRY_WARNING:
        return 'Próximo a Vencer'
      case AlertType.REORDER_POINT:
        return 'Punto de Reorden'
      case AlertType.EXPIRED_PRODUCT:
        return 'Vencido'
      case AlertType.QUARANTINE_ALERT:
        return 'En Cuarentena'
      default:
        return 'Alerta'
    }
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <>
      <Card className="border-l-4 border-l-orange-500 bg-orange-50 border border-orange-200">
        <CardBody className="p-3 sm:p-4">
          <div className="flex flex-col xs:flex-row xs:items-center gap-3 xs:justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-orange-900 leading-tight">
                  Alertas de Inventario ({alerts.length})
                </h3>
                <p className="text-xs sm:text-sm text-orange-700 leading-tight">
                  Productos que requieren atención inmediata
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="light"
              className="text-orange-700 hover:bg-orange-100 w-full xs:w-auto font-medium"
              onPress={() => handleViewAlert(alerts[0])}
            >
              Ver Todas
            </Button>
          </div>

          {/* Lista de alertas críticas - Mobile-first */}
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert._id?.toString()}
                className="flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-orange-200"
              >
                <div className="text-orange-600 flex-shrink-0 mt-1 sm:mt-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5">
                    {getTypeIcon(alert.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 leading-tight">
                    {alert.message}
                  </p>
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mt-1">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getPriorityColor(alert.priority)}
                      className="text-xs px-2 py-1 self-start"
                    >
                      {getTypeLabel(alert.type)}
                    </Chip>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col xs:flex-row items-center gap-1 flex-shrink-0">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-gray-500 hover:text-gray-700 min-w-[2rem] h-8"
                    onPress={() => handleViewAlert(alert)}
                  >
                    <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-gray-500 hover:text-gray-700 min-w-[2rem] h-8"
                    onPress={() => handleDismissAlert(alert._id?.toString() || '')}
                  >
                    <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Modal de detalles de alerta */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        backdrop="opaque"
        placement="center"
        classNames={{
          backdrop: "bg-gray-900/20",
          base: "bg-white border border-gray-200",
          wrapper: "z-[1001] items-center justify-center p-4",
          header: "border-b border-gray-100 flex-shrink-0",
          body: "p-6",
          footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
        }}
      >
        <ModalContent>
          <ModalHeader className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                selectedAlert?.priority === AlertPriority.CRITICAL
                  ? 'bg-red-100'
                  : selectedAlert?.priority === AlertPriority.HIGH
                  ? 'bg-orange-100'
                  : selectedAlert?.priority === AlertPriority.MEDIUM
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
              }`}>
                <div className={`${
                  selectedAlert?.priority === AlertPriority.CRITICAL
                    ? 'text-red-600'
                    : selectedAlert?.priority === AlertPriority.HIGH
                    ? 'text-orange-600'
                    : selectedAlert?.priority === AlertPriority.MEDIUM
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}>
                  {selectedAlert && getTypeIcon(selectedAlert.type)}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Detalles de Alerta</h3>
                {selectedAlert && (
                  <div className="flex items-center gap-2 mt-1">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getPriorityColor(selectedAlert.priority)}
                      className="text-xs"
                    >
                      {getTypeLabel(selectedAlert.type)}
                    </Chip>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getPriorityColor(selectedAlert.priority)}
                      className="text-xs"
                    >
                      {selectedAlert.priority.toUpperCase()}
                    </Chip>
                  </div>
                )}
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-6">
            {selectedAlert && (
              <div className="space-y-6">
                {/* Mensaje principal */}
                <Card className="border border-gray-200">
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedAlert.priority === AlertPriority.CRITICAL
                          ? 'bg-red-100'
                          : selectedAlert.priority === AlertPriority.HIGH
                          ? 'bg-orange-100'
                          : selectedAlert.priority === AlertPriority.MEDIUM
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        <div className={`w-3 h-3 ${
                          selectedAlert.priority === AlertPriority.CRITICAL
                            ? 'text-red-600'
                            : selectedAlert.priority === AlertPriority.HIGH
                            ? 'text-orange-600'
                            : selectedAlert.priority === AlertPriority.MEDIUM
                            ? 'text-blue-600'
                            : 'text-gray-600'
                        }`}>
                          {getTypeIcon(selectedAlert.type)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Mensaje de Alerta</h4>
                        <p className="text-sm text-gray-700">{selectedAlert.message}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                
                {/* Información de la alerta - Responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-500" />
                      Fecha de Creación
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-900">
                        {new Date(selectedAlert.createdAt).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-gray-500" />
                      Estado
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Chip
                        size="sm"
                        variant="flat"
                        color="success"
                        className="text-xs"
                      >
                        ACTIVA
                      </Chip>
                    </div>
                  </div>
                </div>

                {/* Información adicional - Mobile optimized */}
                {selectedAlert.metadata && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Información Adicional</label>
                    <Card className="border border-gray-200">
                      <CardBody className="p-3 sm:p-4">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-2 sm:p-3 rounded border overflow-x-auto">
                          {JSON.stringify(selectedAlert.metadata, null, 2)}
                        </pre>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter className="px-6 py-4">
            <div className="flex gap-3 justify-end w-full">
              <Button
                variant="light"
                onPress={onClose}
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
              >
                Cerrar
              </Button>
              {selectedAlert && (
                <Button
                  color="danger"
                  size="sm"
                  startContent={<XMarkIcon className="w-4 h-4" />}
                  className="bg-red-600 text-white hover:bg-red-700"
                  onPress={() => {
                    handleDismissAlert(selectedAlert._id?.toString() || '')
                    onClose()
                  }}
                >
                  Descartar Alerta
                </Button>
              )}
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}