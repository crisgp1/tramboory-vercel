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
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/react"
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  StarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline"
import { Avatar } from "@heroui/react"
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid"
import { useRole } from "@/hooks/useRole"
import SupplierModal from "./SupplierModal"
import SupplierPenaltyModal from "./SupplierPenaltyModal"
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
  // Campos de penalizaciones
  penaltyData?: {
    totalPoints: number
    activePenalties: number
    lastPenaltyDate?: string
  }
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
  const { isOpen: isPenaltyModalOpen, onOpen: onPenaltyModalOpen, onClose: onPenaltyModalClose } = useDisclosure()

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

  const handleApplyPenalty = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    onPenaltyModalOpen()
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
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= overallRating ? (
              <StarSolidIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
            ) : (
              <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
            )}
          </div>
        ))}
        <span className="text-xs sm:text-sm text-gray-600 ml-1">({overallRating})</span>
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
    <div className="space-y-8">
      {/* Header minimalista */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">
            Proveedores
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {suppliers.length} proveedores en total
          </p>
        </div>
        {(isAdmin || isGerente) && (
          <Button
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleCreateSupplier}
            className="bg-gray-900 text-white hover:bg-gray-800 text-sm"
            size="md"
          >
            Nuevo Proveedor
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
          />
        </div>
        {(isAdmin || isGerente) && (
          <Button 
            variant="bordered"
            startContent={<UserIcon className="w-4 h-4" />}
            onPress={() => {
              window.open('/admin/suppliers/link', '_blank')
            }}
            className="text-sm"
          >
            Configuración Surtinet
          </Button>
        )}
      </div>

      {/* Contenido principal */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600 text-sm">Cargando proveedores...</p>
            </div>
          ) : (
            <>
              {/* Vista de tabla minimalista */}
              <div className="hidden lg:block w-full overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Proveedor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Calificación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Órdenes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Total Gastado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Última Orden
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wide w-20">
                      
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        No se encontraron proveedores
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 max-w-xs">
                            <div className="flex-shrink-0">
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
                            </div>
                            
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{item.name}</p>
                              <div className="flex items-center gap-1 flex-wrap">
                                {item.penaltyData && item.penaltyData.totalPoints > 0 && (
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color={
                                      item.penaltyData.totalPoints > 50 ? 'danger' :
                                      item.penaltyData.totalPoints > 30 ? 'warning' :
                                      'default'
                                    }
                                    startContent={<ExclamationTriangleIcon className="w-3 h-3" />}
                                  >
                                    {item.penaltyData.totalPoints} pts
                                  </Chip>
                                )}
                                
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
                              <p className="text-xs text-gray-500 truncate">
                                {item.isFromDb 
                                  ? `${item.paymentTerms.creditDays} días de crédito`
                                  : 'Información pendiente'
                                }
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm max-w-[180px]">
                            <p className="truncate">{item.contactInfo.email}</p>
                            <p className="text-gray-500 truncate">{item.contactInfo.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {renderStars(item.rating)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{item.totalOrders}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{formatCurrency(item.totalSpent)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {item.lastOrderDate ? (
                            <span className="text-sm">{formatDate(item.lastOrderDate)}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Sin órdenes</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Chip
                            size="sm"
                            variant="flat"
                            color={item.isActive ? 'success' : 'danger'}
                          >
                            {item.isActive ? 'Activo' : 'Inactivo'}
                          </Chip>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Dropdown 
                              placement="bottom-end"
                              classNames={{
                                base: "before:bg-white",
                                content: "bg-white border border-gray-200 shadow-lg"
                              }}
                            >
                              <DropdownTrigger>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                >
                                  <EllipsisVerticalIcon className="w-4 h-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu 
                                aria-label="Acciones del proveedor"
                                itemClasses={{
                                  base: [
                                    "rounded-md",
                                    "transition-colors",
                                    "data-[hover=true]:bg-gray-100",
                                  ],
                                }}
                              >
                                <DropdownItem
                                  key="view"
                                  startContent={<EyeIcon className="w-4 h-4 text-gray-600" />}
                                  onPress={() => handleViewSupplier(item)}
                                  className="text-gray-700"
                                >
                                  Ver detalles
                                </DropdownItem>
                                
{(isAdmin || isGerente) ? (
                                  <>
                                    <DropdownItem
                                      key="edit"
                                      startContent={<PencilIcon className="w-4 h-4 text-blue-600" />}
                                      onPress={() => handleEditSupplier(item)}
                                      className="text-gray-700"
                                    >
                                      {item.isFromDb ? "Editar" : "Completar información"}
                                    </DropdownItem>
                                    
                                    <DropdownItem
                                      key="penalty"
                                      startContent={<ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />}
                                      onPress={() => handleApplyPenalty(item)}
                                      className="text-gray-700 data-[hover=true]:bg-orange-50 data-[hover=true]:text-orange-700"
                                    >
                                      Aplicar castigo
                                    </DropdownItem>
                                    
                                    {item.isFromDb ? (
                                      <DropdownItem
                                        key="delete"
                                        startContent={<TrashIcon className="w-4 h-4 text-red-600" />}
                                        onPress={() => handleDeleteSupplier(item)}
                                        className="text-gray-700 data-[hover=true]:bg-red-50 data-[hover=true]:text-red-700"
                                      >
                                        Eliminar
                                      </DropdownItem>
                                    ) : null}
                                  </>
                                ) : null}
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

              {/* Vista en grid para mobile */}
              <div className="lg:hidden">
                {suppliers.length === 0 ? (
                  <div className="text-center py-20">
                    <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm">No hay proveedores disponibles</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {suppliers.map((item) => (
                      <Card 
                        key={item._id} 
                        className="border border-gray-200 hover:border-gray-300 transition-colors duration-200 bg-white shadow-none hover:shadow-sm"
                      >
                        <CardBody className="p-4">
                  <div className="space-y-4">
                    {/* Header del proveedor */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {item.userImageUrl ? (
                          <Avatar
                            src={item.userImageUrl}
                            name={item.userFullName || item.name}
                            size="md"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 text-lg">{item.name}</h3>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={item.isActive ? 'success' : 'danger'}
                          >
                            {item.isActive ? 'Activo' : 'Inactivo'}
                          </Chip>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {/* Indicador de penalizaciones */}
                          {item.penaltyData && item.penaltyData.totalPoints > 0 && (
                            <Chip
                              size="sm"
                              variant="flat"
                              color={
                                item.penaltyData.totalPoints > 50 ? 'danger' :
                                item.penaltyData.totalPoints > 30 ? 'warning' :
                                'default'
                              }
                              startContent={<ExclamationTriangleIcon className="w-3 h-3" />}
                            >
                              {item.penaltyData.totalPoints} pts
                            </Chip>
                          )}
                          
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
                        
                        <p className="text-sm text-gray-500 mt-1">
                          {item.isFromDb 
                            ? `${item.paymentTerms.creditDays} días de crédito`
                            : 'Información pendiente de completar'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Información de contacto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</p>
                        <p className="text-sm text-gray-900 mt-1">{item.contactInfo.email}</p>
                        <p className="text-sm text-gray-600">{item.contactInfo.phone}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</p>
                        <div className="mt-1">
                          {renderStars(item.rating)}
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{item.totalOrders}</p>
                        <p className="text-xs text-gray-500">Órdenes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(item.totalSpent)}</p>
                        <p className="text-xs text-gray-500">Total Gastado</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {item.lastOrderDate ? formatDate(item.lastOrderDate) : 'Sin órdenes'}
                        </p>
                        <p className="text-xs text-gray-500">Última Orden</p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => handleViewSupplier(item)}
                        startContent={<EyeIcon className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Ver
                      </Button>
                      
                      {(isAdmin || isGerente) && (
                        <>
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => handleEditSupplier(item)}
                            startContent={<PencilIcon className="w-4 h-4" />}
                            className="flex-1"
                          >
                            Editar
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="light"
                            color="warning"
                            onPress={() => handleApplyPenalty(item)}
                            startContent={<ExclamationTriangleIcon className="w-4 h-4" />}
                            className="flex-1"
                          >
                            Castigo
                          </Button>
                          
                          {item.isFromDb && (
                            <Button
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleDeleteSupplier(item)}
                              startContent={<TrashIcon className="w-4 h-4" />}
                              className="flex-1"
                            >
                              Eliminar
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
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
            </>
          )}
        </div>
      </div>

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

      {/* Modal de castigo */}
      <SupplierPenaltyModal
        isOpen={isPenaltyModalOpen}
        onClose={onPenaltyModalClose}
        supplier={selectedSupplier}
        onSuccess={() => {
          fetchSuppliers()
          toast.success('Castigo aplicado correctamente')
        }}
      />

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