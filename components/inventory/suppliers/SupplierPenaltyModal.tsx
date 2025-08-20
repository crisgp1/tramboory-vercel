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
      <Stack gap="md">
        {/* Subtitle */}
        {supplier && (
          <Text size="sm" c="dimmed">{supplier.name} • {supplier.code}</Text>
        )}
        
        {/* Información del Proveedor */}
        <Paper p="md" withBorder>
          <Group mb="sm">
            <IconUser size={20} className="text-orange-600" />
            <Text fw={600}>Proveedor Afectado</Text>
          </Group>

          {supplier && (
            <Group>
              <Avatar size="lg" color="gray">
                <IconUser size={24} />
              </Avatar>
              <div>
                <Text fw={600}>{supplier.name}</Text>
                <Text size="sm" c="dimmed">Código: {supplier.code}</Text>
                {supplier.contactInfo?.contactPerson && (
                  <Text size="sm" c="dimmed">Contacto: {supplier.contactInfo.contactPerson}</Text>
                )}
              </div>
            </Group>
          )}
        </Paper>

        {/* Configuración de la Penalización */}
        <Paper p="md" withBorder>
          <Group mb="md">
            <IconAlertTriangle size={20} className="text-red-600" />
            <Text fw={600}>Detalles de la Penalización</Text>
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
                  <Text fw={600} c="orange">{conceptConfig.label}</Text>
                </Group>
                <Text size="sm" c="orange" mb="xs">{conceptConfig.description}</Text>
                <Group gap="xs">
                  <Text size="xs" c="orange">
                    <Text span fw={500}>Puntos base:</Text> {(conceptConfig as any)?.basePoints || 0}
                  </Text>
                  <Text size="xs" c="orange">•</Text>
                  <Text size="xs" c="orange">
                    <Text span fw={500}>Categoría:</Text> {conceptConfig.category}
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
              onChange={(value) => {
                if (value) {
                  try {
                    const date = new Date(value);
                    setIncidentDate(date.toISOString().split('T')[0]);
                  } catch {
                    setIncidentDate('');
                  }
                } else {
                  setIncidentDate('');
                }
              }}
              maxDate={new Date()}
              leftSection={<IconCalendar size={16} />}
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
              decimalScale={2}
              step={0.01}
              leftSection={<IconCurrencyDollar size={16} />}
              description="Monto aproximado del impacto económico causado por el incidente"
            />
          </Stack>
        </Paper>

        {/* Resumen de Puntos */}
        {selectedConcept && selectedSeverity && (
          <Paper p="md" withBorder style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
            <Group mb="sm">
              <IconCalculator size={20} className="text-red-600" />
              <Text fw={600} c="red">Resumen de Penalización</Text>
            </Group>
            
            <Stack gap="xs">
              <Group justify="space-between">
                <Text c="red">Puntos base del concepto:</Text>
                <Text fw={600} c="red">{(conceptConfig as any)?.basePoints || 0}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="red">Multiplicador de severidad:</Text>
                <Text fw={600} c="red">x{(severityConfig as any)?.multiplier || 1}</Text>
              </Group>
              <Divider c="red.2" />
              <Group justify="space-between">
                <Text size="lg" fw={600} c="red">Total de puntos:</Text>
                <Text size="xl" fw={700} c="red">{calculatePenaltyPoints()}</Text>
              </Group>
              
              {severityConfig && (
                <Badge 
                  fullWidth 
                  size="lg" 
                  c={selectedSeverity.toString().toLowerCase() === 'low' ? 'yellow' : selectedSeverity.toString().toLowerCase() === 'medium' ? 'orange' : selectedSeverity.toString().toLowerCase() === 'high' ? 'red' : 'gray'}
                >
                  Severidad: {severityConfig.label}
                </Badge>
              )}
            </Stack>
          </Paper>
        )}

        {/* Error message */}
        {!selectedConcept || !selectedSeverity || !incidentDate || !description ? (
          <Text c="red" size="sm">Completa todos los campos requeridos</Text>
        ) : null}

        {/* Footer Actions */}
        <Group justify="flex-end">
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