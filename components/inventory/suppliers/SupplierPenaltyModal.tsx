"use client"

import React, { useState } from "react"
import {
  IconAlertTriangle,
  IconCurrencyDollar,
  IconFileText,
  IconCalendar,
  IconUser,
  IconShieldExclamation,
  IconClock,
  IconArchive,
  IconAlertCircle,
  IconCalendarEvent,
  IconCircleX,
  IconFileSearch,
  IconCalculator,
  IconShieldCheck,
  IconMessageCircle,
  IconPhone,
  IconRefresh,
  IconDots
} from "@tabler/icons-react"
import { 
  PenaltyConcept, 
  PenaltySeverity, 
  PENALTY_CONCEPTS, 
  SEVERITY_CONFIG,
  PenaltyConceptConfig 
} from "@/types/supplier-penalties"
import toast from "react-hot-toast"
import { Modal, Button, Select, TextInput, Textarea, NumberInput, Group, Stack, Badge, Text, Divider, Paper, Avatar } from '@mantine/core'
import { DateInput } from '@mantine/dates'

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

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  ClockIcon: IconClock,
  ExclamationTriangleIcon: IconAlertTriangle,
  ArchiveBoxIcon: IconArchive,
  ExclamationCircleIcon: IconAlertCircle,
  ShieldExclamationIcon: IconShieldExclamation,
  CalendarDaysIcon: IconCalendarEvent,
  XCircleIcon: IconCircleX,
  DocumentMagnifyingGlassIcon: IconFileSearch,
  CalculatorIcon: IconCalculator,
  ShieldCheckIcon: IconShieldCheck,
  ChatBubbleLeftRightIcon: IconMessageCircle,
  PhoneIcon: IconPhone,
  ArrowPathIcon: IconRefresh,
  DocumentTextIcon: IconFileText,
  EllipsisHorizontalIcon: IconDots
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
      opened={isOpen}
      onClose={handleClose}
      title={getTitle()}
      size="lg"
    >
      <Stack spacing="md">
        {/* Subtitle */}
        {supplier && (
          <Text size="sm" color="dimmed">{supplier.name} • {supplier.code}</Text>
        )}
        
        {/* Información del Proveedor */}
        <Paper p="md" withBorder>
          <Group mb="sm">
            <IconUser size={20} className="text-orange-600" />
            <Text weight={600}>Proveedor Afectado</Text>
          </Group>

          {supplier && (
            <Group>
              <Avatar size="lg" color="gray">
                <IconUser size={24} />
              </Avatar>
              <div>
                <Text weight={600}>{supplier.name}</Text>
                <Text size="sm" color="dimmed">Código: {supplier.code}</Text>
                {supplier.contactInfo?.contactPerson && (
                  <Text size="sm" color="dimmed">Contacto: {supplier.contactInfo.contactPerson}</Text>
                )}
              </div>
            </Group>
          )}
        </Paper>

        {/* Configuración de la Penalización */}
        <Paper p="md" withBorder>
          <Group mb="md">
            <IconAlertTriangle size={20} className="text-red-600" />
            <Text weight={600}>Detalles de la Penalización</Text>
          </Group>

          <Stack>
            {/* Concepto y Severidad */}
            <Group grow>
              <Select
                label="Concepto de Penalización"
                placeholder="Selecciona un concepto"
                required
                value={selectedConcept}
                onChange={(value) => setSelectedConcept(value as PenaltyConcept)}
                data={Object.entries(PENALTY_CONCEPTS).map(([key, config]) => ({
                  value: key,
                  label: `${config.label} (${(config as any).basePoints || 0} pts base)`
                }))}
              />

              <Select
                label="Severidad"
                placeholder="Selecciona la severidad"
                required
                value={selectedSeverity}
                onChange={(value) => setSelectedSeverity(value as PenaltySeverity)}
                data={Object.entries(SEVERITY_CONFIG).map(([key, config]) => ({
                  value: key,
                  label: `${config.label} (x${(config as any).multiplier || 1})`
                }))}
              />
            </Group>

            {/* Concepto seleccionado */}
            {conceptConfig && (
              <Paper p="sm" withBorder style={{ backgroundColor: 'rgba(251, 146, 60, 0.1)' }}>
                <Group mb="xs">
                  {(() => {
                    const IconComponent = iconMap[conceptConfig.icon] || IconFileText
                    return <IconComponent size={20} className="text-orange-600" />
                  })()}
                  <Text weight={600} color="orange">{conceptConfig.label}</Text>
                </Group>
                <Text size="sm" color="orange" mb="xs">{conceptConfig.description}</Text>
                <Group spacing="xs">
                  <Text size="xs" color="orange">
                    <Text span weight={500}>Puntos base:</Text> {(conceptConfig as any)?.basePoints || 0}
                  </Text>
                  <Text size="xs" color="orange">•</Text>
                  <Text size="xs" color="orange">
                    <Text span weight={500}>Categoría:</Text> {conceptConfig.category}
                  </Text>
                </Group>
              </Paper>
            )}

            {/* Fecha del Incidente */}
            <DateInput
              label="Fecha del Incidente"
              placeholder="Selecciona la fecha"
              required
              value={incidentDate ? new Date(incidentDate) : null}
              onChange={(value) => setIncidentDate(value ? value.toISOString().split('T')[0] : '')}
              maxDate={new Date()}
              icon={<IconCalendar size={16} />}
            />

            {/* Descripción */}
            <Textarea
              label="Descripción del Incidente"
              placeholder="Describe detalladamente el incidente que motivó esta penalización..."
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minRows={4}
            />

            {/* Evidencia */}
            <Textarea
              label="Evidencia y Documentación"
              placeholder="Descripción de evidencias, documentos o referencias relacionadas..."
              value={evidenceDescription}
              onChange={(e) => setEvidenceDescription(e.target.value)}
              minRows={2}
            />

            {/* Impacto Económico */}
            <NumberInput
              label="Impacto Económico (Opcional)"
              placeholder="0.00"
              value={economicImpact ? parseFloat(economicImpact) : ''}
              onChange={(value) => setEconomicImpact(value ? value.toString() : '')}
              min={0}
              precision={2}
              step={0.01}
              icon={<IconCurrencyDollar size={16} />}
              description="Monto aproximado del impacto económico causado por el incidente"
            />
          </Stack>
        </Paper>

        {/* Resumen de Puntos */}
        {selectedConcept && selectedSeverity && (
          <Paper p="md" withBorder style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
            <Group mb="sm">
              <IconCalculator size={20} className="text-red-600" />
              <Text weight={600} color="red">Resumen de Penalización</Text>
            </Group>
            
            <Stack spacing="xs">
              <Group position="apart">
                <Text color="red">Puntos base del concepto:</Text>
                <Text weight={600} color="red">{(conceptConfig as any)?.basePoints || 0}</Text>
              </Group>
              <Group position="apart">
                <Text color="red">Multiplicador de severidad:</Text>
                <Text weight={600} color="red">x{(severityConfig as any)?.multiplier || 1}</Text>
              </Group>
              <Divider color="red.2" />
              <Group position="apart">
                <Text size="lg" weight={600} color="red">Total de puntos:</Text>
                <Text size="xl" weight={700} color="red">{calculatePenaltyPoints()}</Text>
              </Group>
              
              {severityConfig && (
                <Badge 
                  fullWidth 
                  size="lg" 
                  color={selectedSeverity === 'low' ? 'yellow' : selectedSeverity === 'medium' ? 'orange' : selectedSeverity === 'high' ? 'red' : 'gray'}
                >
                  Severidad: {severityConfig.label}
                </Badge>
              )}
            </Stack>
          </Paper>
        )}

        {/* Error message */}
        {!selectedConcept || !selectedSeverity || !incidentDate || !description ? (
          <Text color="red" size="sm">Completa todos los campos requeridos</Text>
        ) : null}

        {/* Footer Actions */}
        <Group position="right">
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="light"
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedConcept || !selectedSeverity || !incidentDate || !description}
            loading={loading}
            color="red"
          >
            Registrar Penalización
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}