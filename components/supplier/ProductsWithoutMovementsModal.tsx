"use client"

import React, { useState, useEffect } from "react"
import {
  Modal,
  Stack,
  Group,
  Text,
  Title,
  Button,
  Table,
  Badge,
  Card,
  Alert,
  Loader,
  Center
} from '@mantine/core'
import {
  IconX,
  IconPackage,
  IconAlertTriangle,
  IconPlus,
  IconRefresh
} from '@tabler/icons-react'
import toast from "react-hot-toast"
import InitiateMovementModal from "@/components/inventory/stock/InitiateMovementModal"

interface Product {
  _id: string
  name: string
  sku: string
  category: string
  base_unit?: string
  units?: {
    base?: {
      code: string
      name: string
    }
  }
}

interface ProductsWithoutMovementsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ProductsWithoutMovementsModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: ProductsWithoutMovementsModalProps) {
  const [productsWithoutMovements, setProductsWithoutMovements] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchProductsWithoutMovements()
    }
  }, [isOpen])

  const fetchProductsWithoutMovements = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inventory/products?withoutMovements=true')
      if (response.ok) {
        const data = await response.json()
        setProductsWithoutMovements(data.products || [])
      } else {
        toast.error("Error al cargar productos sin movimientos")
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error("Error al cargar productos sin movimientos")
    } finally {
      setLoading(false)
    }
  }

  const handleInitiateMovement = (product: Product) => {
    setSelectedProduct(product)
    setIsInitiateModalOpen(true)
  }

  const handleMovementSuccess = () => {
    // Refrescar la lista de productos sin movimientos
    fetchProductsWithoutMovements()
    // Llamar al callback de éxito si se proporciona
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleClose = () => {
    setProductsWithoutMovements([])
    onClose()
  }

  const rows = productsWithoutMovements.map((product) => (
    <tr key={product._id}>
      <td>
        <Group>
          <IconPackage size={20} className="text-gray-500" />
          <Text fw={500}>{product.name}</Text>
        </Group>
      </td>
      <td>
        <Badge variant="light" color="gray" style={{ fontFamily: 'monospace' }}>
          {product.sku}
        </Badge>
      </td>
      <td>
        <Text size="sm">{product.category}</Text>
      </td>
      <td>
        <Text size="sm">
          {product.units?.base?.name || product.base_unit || 'N/A'}
        </Text>
      </td>
      <td>
        <Button
          onClick={() => handleInitiateMovement(product)}
          leftSection={<IconPlus size={16} />}
          size="sm"
          color="orange"
          variant="light"
        >
          Iniciar Movimientos
        </Button>
      </td>
    </tr>
  ))

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={handleClose}
        title={
          <Group>
            <IconAlertTriangle size={24} className="text-orange-600" />
            <Stack gap={2}>
              <Title order={3}>Productos sin Movimientos de Inventario</Title>
              <Text size="sm" c="dimmed">
                {productsWithoutMovements.length} productos encontrados
              </Text>
            </Stack>
          </Group>
        }
        size="xl"
        styles={{
          content: {
            maxHeight: '90vh',
            overflow: 'hidden'
          },
          body: {
            maxHeight: 'calc(90vh - 120px)',
            overflow: 'auto',
            padding: '1rem'
          }
        }}
      >
        <Stack gap="md">
          {loading ? (
            <Center style={{ padding: 40 }}>
              <Stack align="center" gap="xs">
                <Loader size="lg" />
                <Text c="dimmed">Cargando productos...</Text>
              </Stack>
            </Center>
          ) : productsWithoutMovements.length === 0 ? (
            <Center style={{ padding: 40 }}>
              <Stack align="center" gap="xs">
                <IconPackage size={64} className="text-gray-300" />
                <Title order={3} c="dimmed">¡Excelente!</Title>
                <Text c="dimmed" ta="center">
                  Todos tus productos tienen movimientos de inventario registrados.
                </Text>
              </Stack>
            </Center>
          ) : (
            <>
              {/* Warning Alert */}
              <Alert
                icon={<IconAlertTriangle size={16} />}
                title="Productos que requieren configuración inicial"
                color="orange"
              >
                Estos productos no tienen movimientos de inventario registrados.
                Haz clic en &quot;Iniciar Movimientos&quot; para configurar el stock inicial.
              </Alert>

              {/* Products Table */}
              <Card withBorder>
                <div style={{ overflowX: 'auto' }}>
                  <Table striped highlightOnHover>
                    <thead>
                      <tr>
                        <th>PRODUCTO</th>
                        <th>SKU</th>
                        <th>CATEGORÍA</th>
                        <th>UNIDAD BASE</th>
                        <th>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                  </Table>
                </div>
              </Card>

              {/* Footer Actions */}
              <Group justify="flex-end" gap="sm">
                <Button
                  onClick={fetchProductsWithoutMovements}
                  leftSection={<IconRefresh size={16} />}
                  variant="light"
                >
                  Actualizar Lista
                </Button>
                <Button onClick={handleClose} variant="light">
                  Cerrar
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>

      {/* Modal para iniciar movimiento */}
      {selectedProduct && (
        <InitiateMovementModal
          isOpen={isInitiateModalOpen}
          onClose={() => setIsInitiateModalOpen(false)}
          product={selectedProduct as any}
          onSuccess={handleMovementSuccess}
        />
      )}
    </>
  )
}