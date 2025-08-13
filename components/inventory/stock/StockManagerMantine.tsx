"use client"

import React, { useState, useEffect } from 'react'
import {
  Card,
  Stack,
  Group,
  Text,
  Title,
  Button,
  TextInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  Menu,
  Loader,
  Center,
  Paper
} from '@mantine/core'
import {
  IconSearch,
  IconPlus,
  IconArrowUp,
  IconArrowDown,
  IconArrowsRightLeft,
  IconEye,
  IconFilter,
  IconDots,
  IconCube,
  IconMapPin
} from '@tabler/icons-react'
import { useRole } from "@/hooks/useRole"
import StockModal from "./StockModal"

interface Product {
  id: string
  name: string
  sku: string
  category: string
  base_unit: string
}

interface StockItem {
  id: string
  product: {
    id: string
    name: string
    sku: string
    category: string
  }
  location_id: string
  available_quantity: number
  reserved_quantity: number
  quarantine_quantity: number
  unit: string
  last_movement?: {
    movement_type: string
    created_at: string
  }
}

export default function StockManagerMantine() {
  const { isAdmin, isGerente } = useRole()
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // Modal states
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null)
  const [stockAction, setStockAction] = useState<'in' | 'out' | 'transfer' | 'adjust'>('adjust')

  useEffect(() => {
    fetchStockItems()
  }, [])

  const fetchStockItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory/stock')
      const data = await response.json()
      
      if (data.success) {
        setStockItems(data.stock || [])
      } else {
        console.error('Error fetching stock items:', data.error)
      }
    } catch (error) {
      console.error('Error fetching stock items:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = 
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLocation = selectedLocation === 'all' || item.location_id === selectedLocation
    const matchesCategory = selectedCategory === 'all' || item.product?.category === selectedCategory
    
    return matchesSearch && matchesLocation && matchesCategory
  })

  const handleStockAction = (action: 'in' | 'out' | 'transfer' | 'adjust', item?: StockItem) => {
    setStockAction(action)
    setSelectedStock(item || null)
    setIsStockModalOpen(true)
  }

  const getStockStatus = (item: StockItem) => {
    if (item.available_quantity === 0) return { color: 'red', label: 'Agotado' }
    if (item.available_quantity < 10) return { color: 'orange', label: 'Bajo' }
    return { color: 'green', label: 'Disponible' }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX')
  }

  const rows = filteredItems.map((item) => {
    const status = getStockStatus(item)
    
    return (
      <tr key={item.id}>
        <td>
          <Group>
            <IconCube size={20} className="text-blue-600" />
            <div>
              <Text weight={500}>{item.product?.name || 'Producto sin nombre'}</Text>
              <Text size="sm" color="dimmed">{item.product?.category || 'Sin categoría'}</Text>
            </div>
          </Group>
        </td>
        <td>
          <Badge variant="light" color="gray" style={{ fontFamily: 'monospace' }}>
            {item.product?.sku || 'N/A'}
          </Badge>
        </td>
        <td>
          <Group spacing="xs">
            <IconMapPin size={16} />
            <Text size="sm">{item.location_id}</Text>
          </Group>
        </td>
        <td>
          <Text weight={600}>{item.available_quantity} {item.unit}</Text>
        </td>
        <td>
          <Text color="orange">{item.reserved_quantity} {item.unit}</Text>
        </td>
        <td>
          <Badge color={status.color} variant="light">
            {status.label}
          </Badge>
        </td>
        <td>
          {item.last_movement ? (
            <div>
              <Text size="sm" weight={500}>{item.last_movement.movement_type}</Text>
              <Text size="xs" color="dimmed">{formatDate(item.last_movement.created_at)}</Text>
            </div>
          ) : (
            <Text size="sm" color="dimmed">Sin movimientos</Text>
          )}
        </td>
        <td>
          <Group spacing={0}>
            <ActionIcon 
              variant="light" 
              onClick={() => handleStockAction('adjust', item)}
            >
              <IconEye size={16} />
            </ActionIcon>
            
            {(isAdmin || isGerente) && (
              <Menu position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="light">
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item 
                    icon={<IconArrowUp size={14} />}
                    onClick={() => handleStockAction('in', item)}
                  >
                    Entrada
                  </Menu.Item>
                  <Menu.Item 
                    icon={<IconArrowDown size={14} />}
                    onClick={() => handleStockAction('out', item)}
                  >
                    Salida
                  </Menu.Item>
                  <Menu.Item 
                    icon={<IconArrowsRightLeft size={14} />}
                    onClick={() => handleStockAction('transfer', item)}
                  >
                    Transferir
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </td>
      </tr>
    )
  })

  return (
    <Stack spacing="md">
      {/* Header */}
      <Card>
        <Group position="apart">
          <div>
            <Title order={3}>Gestión de Stock</Title>
            <Text color="dimmed" size="sm">
              {stockItems.length} productos en inventario
            </Text>
          </div>
          
          {(isAdmin || isGerente) && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => handleStockAction('adjust')}
            >
              Ajustar Stock
            </Button>
          )}
        </Group>
      </Card>

      {/* Filters */}
      <Card>
        <Stack spacing="sm">
          <Text weight={500}>Filtros</Text>
          
          <Group grow>
            <TextInput
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              icon={<IconSearch size={16} />}
            />
            
            <Select
              placeholder="Ubicación"
              value={selectedLocation}
              onChange={(value) => setSelectedLocation(value || 'all')}
              data={[
                { value: 'all', label: 'Todas las ubicaciones' },
                { value: 'almacen', label: 'Almacén' },
                { value: 'cocina', label: 'Cocina' },
                { value: 'salon', label: 'Salón' }
              ]}
            />
            
            <Select
              placeholder="Categoría"
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value || 'all')}
              data={[
                { value: 'all', label: 'Todas las categorías' },
                { value: 'bebidas', label: 'Bebidas' },
                { value: 'comida', label: 'Comida' },
                { value: 'decoracion', label: 'Decoración' },
                { value: 'mobiliario', label: 'Mobiliario' }
              ]}
            />
          </Group>
        </Stack>
      </Card>

      {/* Stock Table */}
      <Card>
        {loading ? (
          <Center style={{ height: 200 }}>
            <Stack align="center">
              <Loader />
              <Text color="dimmed">Cargando inventario...</Text>
            </Stack>
          </Center>
        ) : (
          <Table striped highlightOnHover>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Ubicación</th>
                <th>Disponible</th>
                <th>Reservado</th>
                <th>Estado</th>
                <th>Último Movimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? rows : (
                <tr>
                  <td colSpan={8}>
                    <Center style={{ padding: 40 }}>
                      <Stack align="center">
                        <IconCube size={48} className="text-gray-400" />
                        <Text color="dimmed">No se encontraron productos</Text>
                      </Stack>
                    </Center>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Stock Modal */}
      <StockModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false)
          setSelectedStock(null)
        }}
        stockItem={selectedStock || {} as StockItem}
        onSuccess={() => {
          fetchStockItems()
          setIsStockModalOpen(false)
          setSelectedStock(null)
        }}
      />
    </Stack>
  )
}