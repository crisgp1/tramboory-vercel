"use client"

import React, { useState, useEffect } from "react"
import { 
  Paper,
  Badge,
  Button,
  Modal,
  Loader,
  Progress,
  Divider,
  Stack,
  Group,
  Text,
  ActionIcon,
  Title,
  Center,
  Indicator
} from "@mantine/core"
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
import { mapHeroUIColorToMantine } from "@/lib/migration-utils"

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
    return mapHeroUIColorToMantine(SEVERITY_CONFIG[severity].color)
  }

  const getStatusColor = (status: PenaltyStatus) => {
    switch (status) {
      case PenaltyStatus.ACTIVE:
        return 'red'
      case PenaltyStatus.EXPIRED:
        return 'gray'
      case PenaltyStatus.APPEALED:
        return 'yellow'
      case PenaltyStatus.REVERSED:
        return 'green'
      default:
        return 'gray'
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
    if (points <= 10) return { level: 'Bajo', color: 'green', progress: 25 }
    if (points <= 30) return { level: 'Medio', color: 'yellow', progress: 50 }
    if (points <= 50) return { level: 'Alto', color: 'red', progress: 75 }
    return { level: 'Crítico', color: 'red', progress: 100 }
  }

  const riskLevel = getPenaltyRiskLevel(totalPenaltyPoints)

  if (loading) {
    return (
      <Paper className={`${className}`} withBorder p="lg" shadow="sm">
        <Center>
          <Group gap="sm">
            <Loader size="lg" color="blue" />
            <Text c="dimmed">Cargando penalizaciones...</Text>
          </Group>
        </Center>
      </Paper>
    )
  }

  return (
    <>
      <Paper className={`${className}`} withBorder p="lg" shadow="sm">
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <ShieldExclamationIcon className="w-5 h-5 text-orange-600" />
            <Title order={4}>Penalizaciones</Title>
          </Group>
          {penalties.length > 0 && (
            <Indicator 
              size={20} 
              color="red" 
              label={penalties.length}
            >
              <ExclamationTriangleSolid className="w-5 h-5 text-red-600" />
            </Indicator>
          )}
        </Group>
        
        {error ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <XCircleIcon className="w-12 h-12 text-red-500" />
              <Text c="red">{error}</Text>
              <Button 
                size="sm" 
                variant="light" 
                color="blue"
                leftSection={<ArrowPathIcon className="w-4 h-4" />}
                onClick={fetchPenalties}
              >
                Reintentar
              </Button>
            </Stack>
          </Center>
        ) : penalties.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <CheckCircleIcon className="w-12 h-12 text-green-500" />
              <Text c="green" fw={500}>¡Sin penalizaciones!</Text>
              <Text c="dimmed" size="sm">Tu cuenta está en buen estado</Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap="md">
            {/* Resumen de puntos de penalización */}
            <Paper bg="gray.0" p="md" radius="md">
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500} c="dimmed">Total de Puntos de Penalización</Text>
                <Text size="lg" fw={700} c="red.6">{totalPenaltyPoints} pts</Text>
              </Group>
              <Progress 
                value={Math.min(riskLevel.progress, 100)} 
                color={riskLevel.color}
                mb="xs"
              />
              <Group justify="space-between">
                <Badge 
                  size="sm" 
                  variant="light" 
                  color={riskLevel.color}
                >
                  Riesgo {riskLevel.level}
                </Badge>
                <Text size="xs" c="dimmed">
                  {totalPenaltyPoints > 70 ? 'Riesgo de suspensión' : 'Cuenta activa'}
                </Text>
              </Group>
            </Paper>

            <Divider />

            {/* Lista de penalizaciones */}
            <Stack gap="sm">
              <Text fw={500}>Penalizaciones Activas</Text>
              {penalties.slice(0, 5).map((penalty) => {
                const concept = PENALTY_CONCEPTS.find(c => c.concept === penalty.concept)
                return (
                  <Paper
                    key={penalty._id}
                    p="sm"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
                    <Group justify="space-between" align="flex-start">
                      <Group gap="sm" align="flex-start" style={{ flex: 1 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: penalty.severity === PenaltySeverity.CRITICAL 
                            ? 'var(--mantine-color-red-1)' 
                            : penalty.severity === PenaltySeverity.MAJOR 
                              ? 'var(--mantine-color-orange-1)' 
                              : 'var(--mantine-color-yellow-1)'
                        }}>
                          <ExclamationTriangleIcon className={`w-4 h-4 ${
                            penalty.severity === PenaltySeverity.CRITICAL 
                              ? 'text-red-600' 
                              : penalty.severity === PenaltySeverity.MAJOR 
                                ? 'text-orange-600' 
                                : 'text-yellow-600'
                          }`} />
                        </div>
                        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                          <Group gap="sm" align="center">
                            <Text size="sm" fw={500} truncate>
                              {concept?.label || penalty.concept}
                            </Text>
                            <Badge 
                              size="xs" 
                              variant="light" 
                              color={getPenaltyColor(penalty.severity)}
                            >
                              {SEVERITY_CONFIG[penalty.severity].label}
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {penalty.description}
                          </Text>
                          <Group gap="md">
                            <Group gap="xs">
                              <ClockIcon className="w-3 h-3 text-gray-400" />
                              <Text size="xs" c="dimmed">
                                {formatTimeAgo(penalty.appliedAt)}
                              </Text>
                            </Group>
                            <Text size="xs" fw={500} c="red.6">
                              {penalty.penaltyValue} pts
                            </Text>
                          </Group>
                        </Stack>
                      </Group>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => handleViewDetails(penalty)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </ActionIcon>
                    </Group>
                  </Paper>
                )
              })}
            </Stack>

            {penalties.length > 5 && (
              <Center pt="sm">
                <Button variant="light" size="sm" color="blue">
                  Ver todas las penalizaciones ({penalties.length})
                </Button>
              </Center>
            )}
          </Stack>
        )}
      </Paper>

      {/* Modal de detalles */}
      <Modal 
        opened={showModal} 
        onClose={() => setShowModal(false)}
        title="Detalles de la Penalización"
        size="lg"
      >
        {selectedPenalty && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">Información completa del castigo aplicado</Text>
            
            <Group grow>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Concepto</Text>
                <Text size="sm">
                  {PENALTY_CONCEPTS.find(c => c.concept === selectedPenalty.concept)?.label || selectedPenalty.concept}
                </Text>
              </Stack>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Severidad</Text>
                <Badge 
                  size="sm" 
                  variant="light" 
                  color={getPenaltyColor(selectedPenalty.severity)}
                >
                  {SEVERITY_CONFIG[selectedPenalty.severity].label}
                </Badge>
              </Stack>
            </Group>

            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">Descripción</Text>
              <Text size="sm">{selectedPenalty.description}</Text>
            </Stack>

            <Group grow>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Puntos de Penalización</Text>
                <Text size="sm" fw={700} c="red.6">{selectedPenalty.penaltyValue} pts</Text>
              </Stack>
              {selectedPenalty.monetaryPenalty && (
                <Stack gap="xs">
                  <Text size="sm" fw={500} c="dimmed">Penalización Monetaria</Text>
                  <Text size="sm" fw={700} c="red.6">${selectedPenalty.monetaryPenalty}</Text>
                </Stack>
              )}
            </Group>

            <Group grow>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Fecha de Aplicación</Text>
                <Group gap="xs">
                  <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                  <Text size="sm">
                    {new Date(selectedPenalty.appliedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </Group>
              </Stack>
              {selectedPenalty.expiresAt && (
                <Stack gap="xs">
                  <Text size="sm" fw={500} c="dimmed">Fecha de Expiración</Text>
                  <Group gap="xs">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                    <Text size="sm">
                      {new Date(selectedPenalty.expiresAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </Group>
                </Stack>
              )}
            </Group>

            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">Estado</Text>
              <Badge 
                size="sm" 
                variant="light" 
                color={getStatusColor(selectedPenalty.status)}
              >
                {getStatusLabel(selectedPenalty.status)}
              </Badge>
            </Stack>

            {selectedPenalty.notes && (
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">Notas Adicionales</Text>
                <Text size="sm">{selectedPenalty.notes}</Text>
              </Stack>
            )}

            <Paper p="md" bg="blue.0" style={{ border: '1px solid var(--mantine-color-blue-3)' }}>
              <Group gap="sm" align="flex-start">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                <Stack gap="xs">
                  <Text fw={500} c="blue.9">Información Importante</Text>
                  <Text size="sm" c="blue.7">
                    Las penalizaciones afectan tu puntuación general y pueden impactar tu elegibilidad para recibir nuevas órdenes. 
                    Si consideras que esta penalización es injusta, puedes contactar a nuestro equipo de soporte.
                  </Text>
                </Stack>
              </Group>
            </Paper>

            <Group justify="flex-end" gap="sm">
              <Button 
                variant="light" 
                onClick={() => setShowModal(false)}
              >
                Cerrar
              </Button>
              <Button 
                color="blue" 
                variant="light"
                leftSection={<InformationCircleIcon className="w-4 h-4" />}
              >
                Contactar Soporte
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  )
}