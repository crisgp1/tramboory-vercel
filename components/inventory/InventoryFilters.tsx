"use client"

import React from "react"
import { 
  Select,
  SelectItem,
  Card,
  CardBody,
  Chip
} from "@heroui/react"
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
    <div className="space-y-4">
      <Card className="border border-gray-200">
        <CardBody className="p-4">
          <h4 className="font-medium mb-4">Filtros de Inventario</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por ubicación */}
            <div>
              <Select
                label="Ubicación"
                placeholder="Selecciona una ubicación"
                selectedKeys={[selectedLocation]}
                onSelectionChange={(keys) => onLocationChange(Array.from(keys)[0] as string)}
              >
                {locations.map((location) => (
                  <SelectItem key={location.key}>
                    {location.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Filtro por categoría */}
            <div>
              <Select
                label="Categoría"
                placeholder="Selecciona una categoría"
                selectedKeys={[selectedCategory]}
                onSelectionChange={(keys) => onCategoryChange(Array.from(keys)[0] as string)}
              >
                {categories.map((category) => (
                  <SelectItem key={category.key}>
                    {category.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Filtros activos */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {selectedLocation !== "all" && (
                <Chip
                  size="sm"
                  variant="flat"
                  color="primary"
                  onClose={() => onLocationChange("all")}
                >
                  Ubicación: {locations.find(l => l.key === selectedLocation)?.label}
                </Chip>
              )}
              {selectedCategory !== "all" && (
                <Chip
                  size="sm"
                  variant="flat"
                  color="secondary"
                  onClose={() => onCategoryChange("all")}
                >
                  Categoría: {categories.find(c => c.key === selectedCategory)?.label}
                </Chip>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}