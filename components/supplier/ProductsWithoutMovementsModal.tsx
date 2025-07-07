"use client"

import React, { useState, useEffect } from "react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  useDisclosure
} from "@heroui/react"
import {
  CubeIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline"
import toast from "react-hot-toast"
import InitiateMovementModal from "@/components/inventory/InitiateMovementModal"

interface Product {
  _id: string
  name: string
  sku: string
  category: string
  units: {
    base: {
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

  const { 
    isOpen: isInitiateModalOpen, 
    onOpen: onInitiateModalOpen, 
    onClose: onInitiateModalClose 
  } = useDisclosure()

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
    onInitiateModalOpen()
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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="4xl"
        scrollBehavior="inside"
        backdrop="opaque"
        classNames={{
          backdrop: "bg-gray-900/50",
          base: "bg-white",
          header: "border-b border-gray-200",
          body: "p-6",
          footer: "border-t border-gray-200"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3 px-6 py-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Productos sin Movimientos de Inventario
              </h3>
              <p className="text-sm text-gray-600">
                {productsWithoutMovements.length} productos encontrados
              </p>
            </div>
          </ModalHeader>

          <ModalBody>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner size="lg" label="Cargando productos..." />
              </div>
            ) : productsWithoutMovements.length === 0 ? (
              <div className="text-center py-12">
                <CubeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¡Excelente!
                </h3>
                <p className="text-gray-600">
                  Todos tus productos tienen movimientos de inventario registrados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-orange-800">
                        Productos que requieren configuración inicial
                      </h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Estos productos no tienen movimientos de inventario registrados. 
                        Haz clic en "Iniciar Movimientos" para configurar el stock inicial.
                      </p>
                    </div>
                  </div>
                </div>

                <Table
                  aria-label="Tabla de productos sin movimientos"
                  classNames={{
                    wrapper: "shadow-none border border-gray-200 rounded-lg",
                  }}
                >
                  <TableHeader>
                    <TableColumn>PRODUCTO</TableColumn>
                    <TableColumn>SKU</TableColumn>
                    <TableColumn>CATEGORÍA</TableColumn>
                    <TableColumn>UNIDAD BASE</TableColumn>
                    <TableColumn>ACCIONES</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {productsWithoutMovements.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <CubeIcon className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" variant="flat" color="default">
                            {product.sku}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{product.category}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {product.units.base.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            color="warning"
                            variant="flat"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            onPress={() => handleInitiateMovement(product)}
                          >
                            Iniciar Movimientos
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </ModalBody>

          <ModalFooter className="px-6 py-4">
            <Button
              variant="light"
              onPress={handleClose}
            >
              Cerrar
            </Button>
            {productsWithoutMovements.length > 0 && (
              <Button
                color="primary"
                variant="flat"
                onPress={fetchProductsWithoutMovements}
              >
                Actualizar Lista
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para iniciar movimiento */}
      {selectedProduct && (
        <InitiateMovementModal
          isOpen={isInitiateModalOpen}
          onClose={onInitiateModalClose}
          product={selectedProduct}
          onSuccess={handleMovementSuccess}
        />
      )}
    </>
  )
}