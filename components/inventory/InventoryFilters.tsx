"use client"

import React from "react"
import { 
  Select,
  Card,
  Badge,
  Stack,
  Text,
  Group
} from "@mantine/core"
import { PRODUCT_CATEGORIES } from "@/types/inventory"

interface InventoryFiltersProps {
  selectedLocation: string
  selectedCategory: string
  onLocationChange: (location: string) => void
  onCategoryChange: (category: string) => void
}

export default function InventoryFilters({
  selectedLocation,
  selectedCategory,
  onLocationChange,
  onCategoryChange
}: InventoryFiltersProps) {
  
  // Ubicaciones comunes (esto podría venir de una API)
  const locations = [
    { key: "all", label: "Todas las ubicaciones" },
    { key: "almacen-principal", label: "Almacén Principal" },
    { key: "cocina", label: "Cocina" },
    { key: "bar", label: "Bar" },
    { key: "bodega-fria", label: "Bodega Fría" },
    { key: "area-eventos", label: "Área de Eventos" },
    { key: "oficina", label: "Oficina" }
  ]

  const categories = [
    { key: "all", label: "Todas las categorías" },
    ...PRODUCT_CATEGORIES.map(cat => ({ key: cat, label: cat }))
  ]

  return (
    <Stack gap="md">
      <Card withBorder p="md">
        <Text fw={500} mb="md">Filtros de Inventario</Text>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--mantine-spacing-md)' }}>
            {/* Filtro por ubicación */}
            <Select
              label="Ubicación"
              placeholder="Selecciona una ubicación"
              value={selectedLocation}
              onChange={(value) => onLocationChange(value || 'all')}
              data={locations.map((location) => ({
                value: location.key,
                label: location.label
              }))}
            />

            {/* Filtro por categoría */}
            <Select
              label="Categoría"
              placeholder="Selecciona una categoría"
              value={selectedCategory}
              onChange={(value) => onCategoryChange(value || 'all')}
              data={categories.map((category) => ({
                value: category.key,
                label: category.label
              }))}
            />
          </div>

          {/* Filtros activos */}
          {(selectedLocation !== "all" || selectedCategory !== "all") && (
            <Group gap="xs" mt="md">
              {selectedLocation !== "all" && (
                <Badge
                  size="sm"
                  variant="light"
                  color="blue"
                >
                  Ubicación: {locations.find(l => l.key === selectedLocation)?.label}
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge
                  size="sm"
                  variant="light" 
                  color="green"
                >
                  Categoría: {categories.find(c => c.key === selectedCategory)?.label}
                </Badge>
              )}
            </Group>
          )}
      </Card>
    </Stack>
  )
}