"use client"

import React, { useState, useEffect } from "react"
import { 
  Card, 
  CardBody, 
  Button, 
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Pagination,
  Spinner
} from "@heroui/react"
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  StarIcon,
  UserIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline"
import { Avatar } from "@heroui/react"
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid"
import { useRole } from "@/hooks/useRole"
import SupplierModal from "./SupplierModal"
import toast from "react-hot-toast"

interface Supplier {
  _id: string
  userId?: string
  name: string
  code: string
  description?: string
  contactInfo: {
    email: string
    phone: string
    address: string
    contactPerson?: string
  }
  paymentTerms: {
    creditDays: number
    paymentMethod?: string
    currency: string
    discountTerms?: string
  }
  rating: {
    quality: number
    delivery: number
    service: number
    price: number
    overall?: number
  }
  isActive: boolean
  totalOrders: number
  totalSpent: number
  lastOrderDate?: string
  createdAt: string
  // Nuevos campos para la integración
  userImageUrl?: string
  userFullName?: string
  isFromDb: boolean  // true = supplier completo, false = solo usuario proveedor
}

export default function SupplierManager() {
  const { role, isAdmin, isGerente } = useRole()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  
  const { isOpen: isSupplierModalOpen, onOpen: onSupplierModalOpen, onClose: onSupplierModalClose } = useDisclosure()
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure()

  const itemsPerPage = 10

  useEffect(() => {
    fetchSuppliers()
  }, [currentPage, searchTerm])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/inventory/suppliers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSupplier = () => {
    setSelectedSupplier(null)
    setModalMode('create')
    onSupplierModalOpen()
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setModalMode('edit')
    onSupplierModalOpen()
  }

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setModalMode('view')
    onSupplierModalOpen()
  }

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    onDeleteModalOpen()
  }

  const confirmDelete = async () => {
    if (!selectedSupplier) return

    try {
      const response = await fetch(`/api/inventory/suppliers/${selectedSupplier._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Proveedor eliminado exitosamente")
        fetchSuppliers()
        onDeleteModalClose()
      } else {
        toast.error("Error al eliminar el proveedor")
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error("Error al eliminar el proveedor")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX')
  }

  const renderStars = (rating: { quality: number; delivery: number; service: number; price: number; overall?: number }) => {
    const overallRating = rating.overall || Math.round(((rating.quality + rating.delivery + rating.service + rating.price) / 4) * 100) / 100
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= overallRating ? (
              <StarSolidIcon className="w-4 h-4 text-yellow-400" />
            ) : (
              <StarIcon className="w-4 h-4 text-gray-300" />
            )}
          </div>
        ))}
        <span className="text-sm text-gray-600 ml-1">({overallRating})</span>
      </div>
    )
  }

  const columns = [
    { key: "name", label: "PROVEEDOR" },
    { key: "contact", label: "CONTACTO" },
    { key: "rating", label: "CALIFICACIÓN" },
    { key: "orders", label: "ÓRDENES" },
    { key: "spent", label: "TOTAL GASTADO" },
    { key: "lastOrder", label: "ÚLTIMA ORDEN" },
    { key: "status", label: "ESTADO" },
    { key: "actions", label: "ACCIONES" }
  ]

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-2">
          {(isAdmin || isGerente) && (
            <>
              <Button
                color="primary"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={handleCreateSupplier}
              >
                Nuevo Proveedor
              </Button>
              <Button 
                color="secondary" 
                variant="flat"
                startContent={<UserIcon className="w-4 h-4" />}
                onPress={() => {
                  window.open('/admin/suppliers/link', '_blank')
                }}
              >
                Configuración de Surtinet
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabla de proveedores */}
      <Card className="border border-gray-200">
        <CardBody className="p-0">
          <Table
            aria-label="Tabla de proveedores"
            classNames={{
              wrapper: "min-h-[400px]",
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.key} className="bg-gray-50 text-gray-700 font-medium">
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={suppliers}
              isLoading={loading}
              loadingContent={<Spinner label="Cargando proveedores..." />}
              emptyContent="No se encontraron proveedores"
            >
              {(item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* Avatar del usuario si está disponible */}
                      {item.userImageUrl ? (
                        <Avatar
                          src={item.userImageUrl}
                          name={item.userFullName || item.name}
                          size="sm"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          
                          {/* Indicador de estado */}
                          {!item.isFromDb && (
                            <Chip
                              size="sm"
                              variant="flat"
                              color="warning"
                              startContent={<ExclamationTriangleIcon className="w-3 h-3" />}
                            >
                              Incompleto
                            </Chip>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500">
                          {item.isFromDb 
                            ? `${item.paymentTerms.creditDays} días de crédito`
                            : 'Información pendiente de completar'
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{item.contactInfo.email}</p>
                      <p className="text-gray-500">{item.contactInfo.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderStars(item.rating)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{item.totalOrders}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatCurrency(item.totalSpent)}</span>
                  </TableCell>
                  <TableCell>
                    {item.lastOrderDate ? (
                      <span className="text-sm">{formatDate(item.lastOrderDate)}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin órdenes</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={item.isActive ? 'success' : 'danger'}
                    >
                      {item.isActive ? 'Activo' : 'Inactivo'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleViewSupplier(item)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      
                      {(isAdmin || isGerente) && (
                        <>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => handleEditSupplier(item)}
                            title={item.isFromDb ? "Editar proveedor" : "Completar información del proveedor"}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          
                          {/* Solo permitir eliminar proveedores completos de la DB */}
                          {item.isFromDb && (
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleDeleteSupplier(item)}
                              title="Eliminar proveedor"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                showShadow
                color="primary"
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de proveedor */}
      {isSupplierModalOpen && (
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={onSupplierModalClose}
          supplier={selectedSupplier}
          mode={modalMode}
          onSuccess={fetchSuppliers}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        backdrop="opaque"
        placement="center"
        classNames={{
          backdrop: "bg-gray-900/20",
          base: "bg-white border border-gray-200",
          wrapper: "z-[1001] items-center justify-center p-4",
          header: "border-b border-gray-100 flex-shrink-0",
          body: "p-6",
          footer: "border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
        }}
      >
        <ModalContent>
          <ModalHeader className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrashIcon className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
            </div>
          </ModalHeader>
          <ModalBody className="px-6">
            <div className="space-y-3">
              <p className="text-gray-900">
                ¿Estás seguro de que deseas eliminar el proveedor{' '}
                <strong className="text-red-600">{selectedSupplier?.name}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  ⚠️ Esta acción no se puede deshacer y eliminará todos los datos relacionados.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="px-6 py-4">
            <div className="flex gap-3 justify-end w-full">
              <Button
                variant="light"
                onPress={onDeleteModalClose}
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </Button>
              <Button
                color="danger"
                onPress={confirmDelete}
                size="sm"
                startContent={<TrashIcon className="w-4 h-4" />}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar Proveedor
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}