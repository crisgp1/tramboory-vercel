"use client"

import React, { useState, useEffect } from "react"
import {
  Plus,
  Edit3,
  Eye,
  Trash2,
  Star,
  User,
  AlertTriangle
} from 'lucide-react'
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid"
import { StarIcon } from "@heroicons/react/24/outline"
import { useRole } from "@/hooks/useRole"
import SupplierModal from "./SupplierModal"
import SupplierPenaltyModal from "./SupplierPenaltyModal"
import SupplierLinkModal from "../SupplierLinkModal"
import { DataTable, StatusChip, PrimaryButton, SecondaryButton, DangerButton } from "@/components/shared/ui"
import { SearchInput } from "@/components/shared/forms"
import toast from "react-hot-toast"
import { createPortal } from "react-dom"

interface Supplier {
  id: string
  supplier_id: string
  user_id?: string
  name: string
  code: string
  description?: string
  contact_email?: string
  contact_phone?: string
  contact_address?: string
  contact_person?: string
  payment_credit_days: number
  payment_method: 'cash' | 'credit' | 'transfer' | 'check'
  payment_currency: string
  payment_discount_terms?: string
  delivery_lead_time_days: number
  delivery_minimum_order?: number
  delivery_zones?: string[]
  rating_quality: number
  rating_reliability: number
  rating_pricing: number
  rating_overall: number
  is_active: boolean
  is_preferred: boolean
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
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
  
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false)
  const [isSupplierLinkModalOpen, setIsSupplierLinkModalOpen] = useState(false)

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
        if (data.success) {
          setSuppliers(data.suppliers || [])
          setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
        } else {
          console.error('API Error:', data.error)
          setSuppliers([])
        }
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
    setIsSupplierModalOpen(true)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setModalMode('edit')
    setIsSupplierModalOpen(true)
  }

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setModalMode('view')
    setIsSupplierModalOpen(true)
  }

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsDeleteModalOpen(true)
  }

  const handleApplyPenalty = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsPenaltyModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedSupplier) return

    try {
      const response = await fetch(`/api/inventory/suppliers/${selectedSupplier.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Proveedor eliminado exitosamente")
        fetchSuppliers()
        setIsDeleteModalOpen(false)
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

  const renderStars = (rating: number) => {
    const overallRating = rating || 3.0
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
    {
      key: "name",
      label: "Proveedor",
      render: (value: any, item: Supplier) => (
        <div className="flex items-center gap-3 max-w-xs">
          <div className="flex-shrink-0">
            {(item as any).userImageUrl ? (
              <img
                src={(item as any).userImageUrl}
                alt={(item as any).userFullName || item.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{item.name}</p>
            <div className="flex items-center gap-1 flex-wrap">
              {item.penaltyData && (item.penaltyData.totalPoints || 0) > 0 && (
                <div className="flex items-center gap-1">
                  <StatusChip
                    status={(item.penaltyData.totalPoints || 0) > 50 ? 'danger' : (item.penaltyData.totalPoints || 0) > 30 ? 'warning' : 'default'}
                  />
                  <span className="text-xs text-gray-600">
                    {item.penaltyData.totalPoints || 0} pts
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {item.payment_credit_days} días de crédito
            </p>
          </div>
        </div>
      )
    },
    {
      key: "contact",
      label: "Contacto",
      render: (value: any, item: Supplier) => (
        <div className="text-sm max-w-[180px]">
          <p className="truncate">{item.contact_email || 'No disponible'}</p>
          <p className="text-gray-500 truncate">{item.contact_phone || 'No disponible'}</p>
        </div>
      )
    },
    {
      key: "rating",
      label: "Calificación",
      render: (value: any, item: Supplier) => renderStars(item.rating_overall)
    },
    {
      key: "orders",
      label: "Órdenes",
      render: (value: any, item: Supplier) => (
        <span className="font-medium">{(item as any).totalOrders || 0}</span>
      )
    },
    {
      key: "spent",
      label: "Total Gastado",
      render: (value: any, item: Supplier) => (
        <span className="font-medium">{formatCurrency((item as any).totalSpent || 0)}</span>
      )
    },
    {
      key: "lastOrder",
      label: "Última Orden",
      render: (value: any, item: Supplier) => (
        <span className="text-sm">
          {(item as any).lastOrderDate ? formatDate((item as any).lastOrderDate) : 'Sin órdenes'}
        </span>
      )
    },
    {
      key: "status",
      label: "Estado",
      render: (value: any, item: Supplier) => (
        <StatusChip status={item.is_active ? 'active' : 'inactive'} />
      )
    }
  ]

  const actions = [
    {
      label: "Ver detalles",
      icon: Eye,
      variant: 'secondary' as const,
      onClick: (item: Supplier) => handleViewSupplier(item)
    },
    ...(isAdmin || isGerente ? [
      {
        label: "Editar",
        icon: Edit3,
        variant: 'primary' as const,
        onClick: (item: Supplier) => handleEditSupplier(item)
      },
      {
        label: "Aplicar castigo",
        icon: AlertTriangle,
        variant: 'secondary' as const,
        onClick: (item: Supplier) => handleApplyPenalty(item)
      },
      {
        label: "Eliminar",
        icon: Trash2,
        variant: 'danger' as const,
        onClick: (item: Supplier) => handleDeleteSupplier(item)
      }
    ] : [])
  ]

  return (
    <div className="w-full space-y-6">
      {/* Header y controles */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Buscar proveedores por nombre..."
              value={searchTerm}
              onSearch={setSearchTerm}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            {(isAdmin || isGerente) && (
              <>
                <SecondaryButton
                  onClick={() => setIsSupplierLinkModalOpen(true)}
                  icon={User}
                  size="md"
                >
                  Configuración Surtinet
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleCreateSupplier}
                  icon={Plus}
                  size="md"
                >
                  Nuevo Proveedor
                </PrimaryButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        actions={actions}
        emptyMessage="No se encontraron proveedores"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal de proveedor */}
      {isSupplierModalOpen && (
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          supplier={selectedSupplier as any}
          mode={modalMode}
          onSuccess={fetchSuppliers}
        />
      )}

      {/* Modal de castigo */}
      <SupplierPenaltyModal
        isOpen={isPenaltyModalOpen}
        onClose={() => setIsPenaltyModalOpen(false)}
        supplier={selectedSupplier as any}
        onSuccess={() => {
          fetchSuppliers()
          toast.success('Castigo aplicado correctamente')
        }}
      />

      {/* Modal de confirmación de eliminación */}
      {isDeleteModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{
            background: 'rgba(248, 250, 252, 0.85)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)'
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Confirmar Eliminación</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-slate-800">
                  ¿Estás seguro de que deseas eliminar el proveedor{' '}
                  <strong className="text-red-600">{selectedSupplier?.name}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    ⚠️ Esta acción no se puede deshacer y eliminará todos los datos relacionados.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <SecondaryButton
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </SecondaryButton>
              <DangerButton
                onClick={confirmDelete}
                icon={Trash2}
              >
                Eliminar Proveedor
              </DangerButton>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Modal de vinculación de proveedores Surtinet */}
      <SupplierLinkModal
        isOpen={isSupplierLinkModalOpen}
        onClose={() => setIsSupplierLinkModalOpen(false)}
        onSuccess={() => {
          fetchSuppliers()
          toast.success('Configuración actualizada correctamente')
        }}
      />
    </div>
  )
}