"use client"

import React, { useState } from "react"
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
import { Modal, ModalFooter, ModalActions, ModalButton } from '@/components/shared/modals'

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
  const [selectedConcept, setSelectedConcept] = useState<PenaltyConcept | "">("")
  const [selectedSeverity, setSelectedSeverity] = useState<PenaltySeverity | "">("")
  const [incidentDate, setIncidentDate] = useState("")
  const [description, setDescription] = useState("")
  const [evidenceDescription, setEvidenceDescription] = useState("")
  const [economicImpact, setEconomicImpact] = useState("")
  const [loading, setLoading] = useState(false)

  // Get concept configuration
  const conceptConfig = selectedConcept ? (PENALTY_CONCEPTS as any)[selectedConcept] : undefined
  const severityConfig = selectedSeverity ? (SEVERITY_CONFIG as any)[selectedSeverity] : undefined

  // Calculate penalty points
  const calculatePenaltyPoints = (): number => {
    if (!conceptConfig || !severityConfig) return 0
    return (conceptConfig?.basePoints || 0) * (severityConfig?.multiplier || 1)
  }

  const handleSubmit = async () => {
    if (!supplier || !selectedConcept || !selectedSeverity || !incidentDate || !description) {
      toast.error("Por favor completa todos los campos requeridos")
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
          concept: selectedConcept,
          severity: selectedSeverity,
          incidentDate: new Date(incidentDate).toISOString(),
          description,
          evidenceDescription: evidenceDescription || undefined,
          economicImpact: economicImpact ? parseFloat(economicImpact) : undefined,
          points: calculatePenaltyPoints()
        })
      })

      if (response.ok) {
        toast.success("Penalización registrada exitosamente")
        onSuccess()
        onClose()
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al registrar la penalización")
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedConcept("")
    setSelectedSeverity("")
    setIncidentDate("")
    setDescription("")
    setEvidenceDescription("")
    setEconomicImpact("")
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  const getTitle = () => 'Registrar Penalización'
  const getSubtitle = () => supplier ? `${supplier.name} • ${supplier.code}` : undefined

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={ExclamationTriangleIcon}
      size="lg"
      footer={
        <ModalFooter>
          <div>
            {!selectedConcept || !selectedSeverity || !incidentDate || !description ? (
              <p className="text-red-600 text-sm">Completa todos los campos requeridos</p>
            ) : null}
          </div>
          
          <ModalActions>
            <ModalButton
              onClick={handleClose}
              disabled={loading}
              variant="secondary"
            >
              Cancelar
            </ModalButton>
            
            <ModalButton
              onClick={handleSubmit}
              disabled={loading || !selectedConcept || !selectedSeverity || !incidentDate || !description}
              loading={loading}
              variant="danger"
            >
              Registrar Penalización
            </ModalButton>
          </ModalActions>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        
        {/* Información del Proveedor */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-orange-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Proveedor Afectado</h4>
          </div>

          {supplier && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h5 className="font-semibold text-slate-800">{supplier.name}</h5>
                <p className="text-sm text-slate-600">Código: {supplier.code}</p>
                {supplier.contactInfo?.contactPerson && (
                  <p className="text-sm text-slate-600">Contacto: {supplier.contactInfo.contactPerson}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Configuración de la Penalización */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            </div>
            <h4 className="font-semibold text-slate-800">Detalles de la Penalización</h4>
          </div>

          <div className="space-y-6">
            {/* Concepto y Severidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Concepto de Penalización *
                </label>
                <select
                  value={selectedConcept}
                  onChange={(e) => setSelectedConcept(e.target.value as PenaltyConcept)}
                  className="glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer"
                >
                  <option value="">Selecciona un concepto</option>
                  {Object.entries(PENALTY_CONCEPTS).map(([key, config]) => {
                    const IconComponent = iconMap[config.icon] || DocumentTextIcon
                    return (
                      <option key={key} value={key}>
                        {config.label} ({(config as any).basePoints || 0} pts base)
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Severidad *
                </label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value as PenaltySeverity)}
                  className="glass-input w-full px-4 py-3 text-slate-800 appearance-none cursor-pointer"
                >
                  <option value="">Selecciona la severidad</option>
                  {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label} (x{(config as any).multiplier || 1})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Concepto seleccionado */}
            {conceptConfig && (
              <div className="glass-card bg-orange-50/80 border border-orange-200/50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  {(() => {
                    const IconComponent = iconMap[conceptConfig.icon] || DocumentTextIcon
                    return <IconComponent className="w-5 h-5 text-orange-600" />
                  })()}
                  <h5 className="font-semibold text-orange-800">{conceptConfig.label}</h5>
                </div>
                <p className="text-orange-700 text-sm mb-2">{conceptConfig.description}</p>
                <div className="text-xs text-orange-600">
                  <span className="font-medium">Puntos base:</span> {(conceptConfig as any)?.basePoints || 0} •
                  <span className="font-medium ml-2">Categoría:</span> {conceptConfig.category}
                </div>
              </div>
            )}

            {/* Fecha del Incidente */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Fecha del Incidente *
              </label>
              <div className="relative">
                <CalendarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="glass-input w-full pl-12 pr-4 py-3 text-slate-800"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Descripción del Incidente *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 resize-none"
                placeholder="Describe detalladamente el incidente que motivó esta penalización..."
              />
            </div>

            {/* Evidencia */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Evidencia y Documentación
              </label>
              <textarea
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                rows={2}
                className="glass-input w-full px-4 py-3 text-slate-800 placeholder-slate-500 resize-none"
                placeholder="Descripción de evidencias, documentos o referencias relacionadas..."
              />
            </div>

            {/* Impacto Económico */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Impacto Económico (Opcional)
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={economicImpact}
                  onChange={(e) => setEconomicImpact(e.target.value)}
                  className="glass-input w-full pl-12 pr-4 py-3 text-slate-800 placeholder-slate-500"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Monto aproximado del impacto económico causado por el incidente
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de Puntos */}
        {selectedConcept && selectedSeverity && (
          <div className="glass-card bg-red-50/80 border border-red-200/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <CalculatorIcon className="w-5 h-5 text-red-600" />
              </div>
              <h4 className="font-semibold text-red-800">Resumen de Penalización</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-red-700">Puntos base del concepto:</span>
                <span className="font-semibold text-red-800">{(conceptConfig as any)?.basePoints || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-700">Multiplicador de severidad:</span>
                <span className="font-semibold text-red-800">x{(severityConfig as any)?.multiplier || 1}</span>
              </div>
              <div className="border-t border-red-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-red-800">Total de puntos:</span>
                  <span className="text-xl font-bold text-red-600">{calculatePenaltyPoints()}</span>
                </div>
              </div>
              
              {severityConfig && (
                <div className={`text-center py-2 px-4 rounded-lg text-sm font-medium ${(severityConfig as any)?.bgColor || ''} ${(severityConfig as any)?.textColor || ''}`}>
                  Severidad: {severityConfig.label}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}