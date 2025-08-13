"use client"

import React, { useState, useEffect } from "react"
import { 
  Card, 
  Button, 
  Badge,
  Modal,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  Paper,
  Grid
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
  IconAlertTriangle,
  IconClock,
  IconX,
  IconEye
} from "@tabler/icons-react"
import { AlertPriority, AlertType } from "@/types/inventory"

// Local interface for inventory alerts
interface IInventoryAlert {
  _id?: string;
  type: AlertType;
  priority: AlertPriority;
  message: string;
  productId?: string;
  productName?: string;
  currentStock?: number;
  minStock?: number;
  expiryDate?: string;
  metadata?: Record<string, any>;
  status: 'active' | 'dismissed' | 'resolved';
  createdBy: string;
  dismissedBy?: string;
  dismissedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function InventoryAlerts() {
  const [alerts, setAlerts] = useState<IInventoryAlert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<IInventoryAlert | null>(null)
  const [opened, { open, close }] = useDisclosure(false)

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
        setAlerts(alerts.filter(alert => alert._id?.toString() !== alertId))
      }
    } catch (error) {
      console.error('Error dismissing alert:', error)
    }
  }

  const handleViewAlert = (alert: IInventoryAlert) => {
    setSelectedAlert(alert)
    open()
  }

  const getPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case AlertPriority.CRITICAL:
        return 'red'
      case AlertPriority.HIGH:
        return 'orange'
      case AlertPriority.MEDIUM:
        return 'blue'
      case AlertPriority.LOW:
        return 'gray'
      default:
        return 'gray'
    }
  }

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.LOW_STOCK:
        return <IconAlertTriangle size={16} />
      case AlertType.EXPIRY_WARNING:
        return <IconClock size={16} />
      default:
        return <IconAlertTriangle size={16} />
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
      <Card withBorder p="md" style={{ borderLeft: '4px solid #fd7e14', backgroundColor: '#fff8f1' }}>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Group align="flex-start">
              <ActionIcon
                size="lg"
                radius="xl"
                color="orange"
                variant="light"
              >
                <IconAlertTriangle size={20} />
              </ActionIcon>
              <Stack gap={2}>
                <Title order={4} size="md" c="orange.9">
                  Alertas de Inventario ({alerts.length})
                </Title>
                <Text size="sm" c="orange.7">
                  Productos que requieren atención inmediata
                </Text>
              </Stack>
            </Group>
            <Button
              size="sm"
              variant="light"
              color="orange"
              onClick={() => handleViewAlert(alerts[0])}
            >
              Ver Todas
            </Button>
          </Group>

          {/* Lista de alertas críticas */}
          <Stack gap="sm">
            {alerts.slice(0, 3).map((alert) => (
              <Paper
                key={alert._id?.toString()}
                p="sm"
                withBorder
                bg="white"
                style={{ borderColor: '#fed7aa' }}
              >
                <Group justify="space-between" align="flex-start">
                  <Group align="flex-start" style={{ flex: 1 }}>
                    <div style={{ color: '#ea580c', marginTop: '2px' }}>
                      {getTypeIcon(alert.type)}
                    </div>
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text size="sm" fw={500} c="gray.9">
                        {alert.message}
                      </Text>
                      <Group gap="xs">
                        <Badge
                          size="sm"
                          variant="light"
                          color={getPriorityColor(alert.priority)}
                        >
                          {getTypeLabel(alert.type)}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {new Date(alert.createdAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit'
                          })}
                        </Text>
                      </Group>
                    </Stack>
                  </Group>
                  <Group gap="xs">
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="gray"
                      onClick={() => handleViewAlert(alert)}
                    >
                      <IconEye size={14} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="gray"
                      onClick={() => handleDismissAlert(alert._id?.toString() || '')}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Card>

      {/* Modal de detalles de alerta */}
      <Modal
        opened={opened}
        onClose={close}
        size="lg"
        title={null}
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        styles={{
          body: { padding: 0 },
          header: { display: 'none' }
        }}
      >
        <Stack gap="lg">
          <Paper p="lg" withBorder={false}>
            <Group>
              <ActionIcon
                size="lg"
                radius="md"
                color={selectedAlert ? getPriorityColor(selectedAlert.priority) : 'gray'}
                variant="light"
              >
                {selectedAlert && getTypeIcon(selectedAlert.type)}
              </ActionIcon>
              <Stack gap={2}>
                <Title order={4} size="lg" fw={600}>Detalles de Alerta</Title>
                {selectedAlert && (
                  <Group gap="xs">
                    <Badge
                      size="sm"
                      variant="light"
                      color={getPriorityColor(selectedAlert.priority)}
                    >
                      {getTypeLabel(selectedAlert.type)}
                    </Badge>
                    <Badge
                      size="sm"
                      variant="light"
                      color={getPriorityColor(selectedAlert.priority)}
                    >
                      {selectedAlert.priority.toUpperCase()}
                    </Badge>
                  </Group>
                )}
              </Stack>
            </Group>
          </Paper>
          <Stack gap="lg" p="lg" pt={0}>
            {selectedAlert && (
              <Stack gap="lg">
                {/* Mensaje principal */}
                <Card withBorder p="md">
                  <Group align="flex-start">
                    <ActionIcon
                      size="sm"
                      radius="xl"
                      color={getPriorityColor(selectedAlert.priority)}
                      variant="light"
                    >
                      {getTypeIcon(selectedAlert.type)}
                    </ActionIcon>
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text size="sm" fw={500} c="gray.9">Mensaje de Alerta</Text>
                      <Text size="sm" c="gray.7">{selectedAlert.message}</Text>
                    </Stack>
                  </Group>
                </Card>
                
                {/* Información de la alerta */}
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="sm">
                      <Group gap="xs">
                        <IconClock size={16} color="gray" />
                        <Text size="sm" fw={500} c="gray.7">Fecha de Creación</Text>
                      </Group>
                      <Paper p="sm" bg="gray.0" withBorder>
                        <Text size="sm" c="gray.9">
                          {new Date(selectedAlert.createdAt).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </Paper>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="sm">
                      <Group gap="xs">
                        <IconAlertTriangle size={16} color="gray" />
                        <Text size="sm" fw={500} c="gray.7">Estado</Text>
                      </Group>
                      <Paper p="sm" bg="gray.0" withBorder>
                        <Badge
                          size="sm"
                          variant="light"
                          color="green"
                        >
                          ACTIVA
                        </Badge>
                      </Paper>
                    </Stack>
                  </Grid.Col>
                </Grid>

                {/* Información adicional */}
                {selectedAlert.metadata && (
                  <Stack gap="sm">
                    <Text size="sm" fw={500} c="gray.7">Información Adicional</Text>
                    <Card withBorder p="md">
                      <pre style={{ 
                        fontSize: '12px', 
                        color: '#495057', 
                        whiteSpace: 'pre-wrap', 
                        fontFamily: 'monospace', 
                        backgroundColor: '#f8f9fa', 
                        padding: '12px', 
                        borderRadius: '4px', 
                        border: '1px solid #dee2e6', 
                        overflowX: 'auto' 
                      }}>
                        {JSON.stringify(selectedAlert.metadata, null, 2)}
                      </pre>
                    </Card>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
          <Paper p="lg" withBorder style={{ borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={close}
                size="sm"
              >
                Cerrar
              </Button>
              {selectedAlert && (
                <Button
                  color="red"
                  size="sm"
                  leftSection={<IconX size={16} />}
                  onClick={() => {
                    handleDismissAlert(selectedAlert._id?.toString() || '')
                    close()
                  }}
                >
                  Descartar Alerta
                </Button>
              )}
            </Group>
          </Paper>
        </Stack>
      </Modal>
    </>
  )
}