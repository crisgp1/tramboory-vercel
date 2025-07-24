"use client"

import React, { useState, useEffect } from "react"
import {
  LinkIcon,
  UserIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline"
import { Switch } from "@heroui/react"
import { Modal, ModalFooter, ModalActions, ModalButton } from '@/components/shared/modals'
import toast from "react-hot-toast"

interface Supplier {
  id: string
  supplierId?: string     // MongoDB field
  supplier_id?: string    // Supabase field
  name: string
  code: string
  email?: string
}

interface User {
  id: string
  email: string
  name: string
}

interface LinkedSupplier {
  supplierId?: string     // MongoDB field
  supplier_id?: string    // Supabase field
  name: string
  userId?: string         // MongoDB field
  user_id?: string        // Supabase field
  email?: string
}

interface SupplierLinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function SupplierLinkModal({ isOpen, onClose, onSuccess }: SupplierLinkModalProps) {
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState<string | null>(null)
  const [unlinking, setUnlinking] = useState<string | null>(null)
  const [unlinkedSuppliers, setUnlinkedSuppliers] = useState<Supplier[]>([])
  const [providerUsers, setProviderUsers] = useState<User[]>([])
  const [linkedSuppliers, setLinkedSuppliers] = useState<LinkedSupplier[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [useSupabase, setUseSupabase] = useState(true) // Default to Supabase
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    action: () => void
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      // In development mode, check if we should use mock data immediately
      if (process.env.NODE_ENV === 'development' && 
          !process.env.NEXT_PUBLIC_SUPABASE_URL && 
          !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('No Supabase configuration detected, using mock data')
        loadMockData()
        setUseSupabase(false)
        toast.info('Modo desarrollo: usando datos de prueba')
      } else {
        fetchData()
      }
    } else {
      // Reset state when modal closes
      setSearchTerm("")
      setSelectedUsers({})
      setConfirmAction(null)
    }
  }, [isOpen, useSupabase])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Choose API endpoint based on database selection
      const endpoint = useSupabase ? "/api/inventory/suppliers/link" : "/api/debug/link-supplier"
      console.log(`Fetching data from: ${endpoint}`)
      
      const response = await fetch(endpoint)
      console.log(`Response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error: ${response.status} - ${errorText}`)
        
        // If Supabase fails, automatically use mock data in development
        if (useSupabase && response.status === 500 && process.env.NODE_ENV === 'development') {
          console.log('Supabase failed, loading mock data for development')
          setUseSupabase(false)
          loadMockData()
          toast.info('Usando datos de prueba - Configure las variables de Supabase')
          return
        }
        
        // For any API failure in development, use mock data
        if (process.env.NODE_ENV === 'development') {
          console.log('API failed, using mock data in development mode')
          loadMockData()
          toast.info('Usando datos de prueba - Error en API')
          return
        }
        
        throw new Error(`Error ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('API Response:', data)
      
      setUnlinkedSuppliers(data.unlinkedSuppliers || [])
      setProviderUsers(data.providerUsers || [])
      setLinkedSuppliers(data.linkedSuppliers || [])
    } catch (error) {
      console.error('Fetch error:', error)
      
      // Show mock data in development if all endpoints fail
      if (process.env.NODE_ENV === 'development') {
        console.log('Loading mock data for development')
        loadMockData()
        toast.info('Usando datos de prueba - Configure las variables de Supabase')
      } else {
        toast.error(`Error al cargar los datos (${useSupabase ? 'Supabase' : 'MongoDB'}): ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMockData = () => {
    // Mock data for development
    setUnlinkedSuppliers([
      {
        id: "1",
        supplier_id: "SUPP-001",
        supplierId: "SUPP-001",
        name: "Proveedor Demo 1",
        code: "DEMO1",
        email: "demo1@ejemplo.com"
      },
      {
        id: "2", 
        supplier_id: "SUPP-002",
        supplierId: "SUPP-002",
        name: "Proveedor Demo 2",
        code: "DEMO2",
        email: "demo2@ejemplo.com"
      }
    ])
    
    setProviderUsers([
      {
        id: "user_1",
        email: "proveedor1@test.com",
        name: "Usuario Proveedor 1"
      },
      {
        id: "user_2", 
        email: "proveedor2@test.com",
        name: "Usuario Proveedor 2"
      }
    ])
    
    setLinkedSuppliers([
      {
        supplier_id: "SUPP-003",
        supplierId: "SUPP-003",
        name: "Proveedor Vinculado Demo",
        user_id: "user_3",
        userId: "user_3",
        email: "vinculado@ejemplo.com"
      }
    ])
  }

  const handleLink = async (supplierId: string) => {
    const userId = selectedUsers[supplierId]
    if (!userId) {
      toast.error("Por favor selecciona un usuario antes de vincular.")
      return
    }

    setLinking(supplierId)
    
    try {
      // Check if we're in development mode with mock data
      if (process.env.NODE_ENV === 'development' && unlinkedSuppliers.length <= 2) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Move supplier from unlinked to linked
        const supplier = unlinkedSuppliers.find(s => getSupplierId(s) === supplierId)
        const user = providerUsers.find(u => u.id === userId)
        
        if (supplier && user) {
          setUnlinkedSuppliers(prev => prev.filter(s => getSupplierId(s) !== supplierId))
          setLinkedSuppliers(prev => [...prev, {
            ...supplier,
            user_id: userId,
            userId: userId
          }])
          setSelectedUsers(prev => {
            const updated = { ...prev }
            delete updated[supplierId]
            return updated
          })
          toast.success(`Proveedor vinculado correctamente (DEMO)`)
        }
        return
      }

      // Choose API endpoint and payload based on database selection
      const endpoint = useSupabase ? "/api/inventory/suppliers/link" : "/api/debug/link-supplier"
      const payload = useSupabase 
        ? { supplier_id: supplierId, user_id: userId }
        : { supplierId, userId }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Error al vincular")
      }

      toast.success(`Proveedor vinculado correctamente (${useSupabase ? 'Supabase' : 'MongoDB'})`)
      await fetchData()
      setSelectedUsers(prev => {
        const updated = { ...prev }
        delete updated[supplierId]
        return updated
      })
    } catch (error: any) {
      toast.error(error.message || "No se pudo vincular el proveedor")
    } finally {
      setLinking(null)
    }
  }

  const handleUnlink = (supplierId: string, supplierName: string) => {
    setConfirmAction({
      title: "Confirmar Desvinculación",
      message: `¿Está seguro que desea desvincular el proveedor "${supplierName}"?`,
      action: () => performUnlink(supplierId)
    })
  }

  const performUnlink = async (supplierId: string) => {
    setUnlinking(supplierId)
    
    try {
      // Check if we're in development mode with mock data
      if (process.env.NODE_ENV === 'development' && linkedSuppliers.length <= 1) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Move supplier from linked to unlinked
        const supplier = linkedSuppliers.find(s => getSupplierId(s) === supplierId)
        
        if (supplier) {
          setLinkedSuppliers(prev => prev.filter(s => getSupplierId(s) !== supplierId))
          setUnlinkedSuppliers(prev => [...prev, {
            ...supplier,
            user_id: undefined,
            userId: undefined
          }])
          toast.success("Proveedor desvinculado correctamente (DEMO)")
        }
        return
      }

      // Choose API endpoint and payload based on database selection
      const endpoint = useSupabase ? "/api/inventory/suppliers/link" : "/api/debug/link-supplier"
      const payload = useSupabase 
        ? { supplier_id: supplierId }
        : { supplierId }

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Error al desvincular")
      }

      toast.success("Proveedor desvinculado correctamente")
      await fetchData()
    } catch (error: any) {
      toast.error(error.message || "No se pudo desvincular el proveedor")
    } finally {
      setUnlinking(null)
    }
  }

  const filteredUnlinkedSuppliers = unlinkedSuppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredLinkedSuppliers = linkedSuppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.supplierId || supplier.supplier_id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Helper function to get the correct supplier ID field
  const getSupplierId = (supplier: Supplier | LinkedSupplier) => {
    return useSupabase ? supplier.supplier_id : supplier.supplierId
  }

  // Helper function to get the correct user ID field
  const getUserId = (supplier: LinkedSupplier) => {
    return useSupabase ? supplier.user_id : supplier.userId
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gestión de Proveedores Surtinet"
        subtitle="Vincular usuarios a proveedores"
        icon={LinkIcon}
        size="lg"
        footer={
          <ModalFooter>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>MongoDB</span>
                <Switch 
                  size="sm" 
                  isSelected={useSupabase}
                  onValueChange={setUseSupabase}
                  color="primary"
                />
                <span>Supabase</span>
                <span className={`font-medium ${useSupabase ? 'text-green-600' : 'text-orange-600'}`}>
                  ({useSupabase ? 'Supabase' : 'MongoDB'})
                </span>
              </div>
            </div>
            
            <ModalActions>
              <ModalButton
                onClick={onClose}
                variant="secondary"
              >
                Cerrar
              </ModalButton>
            </ModalActions>
          </ModalFooter>
        }
      >
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-6"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search */}
            <div className="glass-card p-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input w-full pl-11 pr-4 py-3 text-slate-800 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Unlinked Suppliers Section */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Proveedores Sin Vincular ({filteredUnlinkedSuppliers.length})
                  </h3>
                </div>
              </div>
              
              <div className="p-6">
                {filteredUnlinkedSuppliers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <UserIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Todos los proveedores están vinculados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUnlinkedSuppliers.map((supplier) => (
                      <div key={supplier.id} className="glass-card p-4 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{supplier.name}</p>
                            <p className="text-sm text-slate-500">Código: {supplier.code}</p>
                            <p className="text-sm text-slate-500">Email: {supplier.email || "-"}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-500 uppercase tracking-wide mb-2">
                              Usuario
                            </label>
                            <select
                              value={selectedUsers[getSupplierId(supplier) || ''] || ""}
                              onChange={(e) => {
                                setSelectedUsers(prev => ({
                                  ...prev,
                                  [getSupplierId(supplier) || '']: e.target.value
                                }))
                              }}
                              className="glass-input w-full px-3 py-2 text-sm"
                            >
                              <option value="">Seleccionar usuario</option>
                              {providerUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name || user.email}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="flex items-end">
                            <button
                              onClick={() => handleLink(getSupplierId(supplier) || '')}
                              disabled={!selectedUsers[getSupplierId(supplier) || ''] || linking === getSupplierId(supplier)}
                              className={`glass-button w-full px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium ${
                                !selectedUsers[getSupplierId(supplier) || ''] ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {linking === getSupplierId(supplier) ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Vinculando...
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="w-4 h-4" />
                                  Vincular
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Linked Suppliers Section */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <BuildingOffice2Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Proveedores Vinculados ({filteredLinkedSuppliers.length})
                  </h3>
                </div>
              </div>
              
              <div className="p-6">
                {filteredLinkedSuppliers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <BuildingOffice2Icon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No hay proveedores vinculados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLinkedSuppliers.map((supplier) => (
                      <div key={getSupplierId(supplier) || supplier.name} className="glass-card p-4 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{supplier.name}</p>
                            <p className="text-sm text-slate-500">Código: {getSupplierId(supplier)}</p>
                            <p className="text-sm text-slate-500">Email: {supplier.email || "-"}</p>
                            <p className="text-xs text-slate-400 font-mono">ID Usuario: {getUserId(supplier)}</p>
                          </div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100/80 text-green-800">
                            <CheckIcon className="w-3 h-3 mr-1" />
                            Vinculado
                          </span>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleUnlink(getSupplierId(supplier) || '', supplier.name)}
                            disabled={unlinking === getSupplierId(supplier)}
                            className="glass-button-secondary px-4 py-2 flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            {unlinking === getSupplierId(supplier) ? (
                              <>
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                Desvinculando...
                              </>
                            ) : (
                              <>
                                <XMarkIcon className="w-4 h-4" />
                                Desvincular
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      {confirmAction && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          title={confirmAction.title}
          icon={ExclamationTriangleIcon}
          size="md"
          footer={
            <ModalFooter>
              <div></div>
              <ModalActions>
                <ModalButton
                  onClick={() => setConfirmAction(null)}
                  variant="secondary"
                >
                  Cancelar
                </ModalButton>
                <ModalButton
                  onClick={() => {
                    confirmAction.action()
                    setConfirmAction(null)
                  }}
                  variant="primary"
                >
                  Confirmar
                </ModalButton>
              </ModalActions>
            </ModalFooter>
          }
        >
          <div className="glass-card bg-orange-50/80 border border-orange-200/50 p-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <p className="text-orange-700">{confirmAction.message}</p>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}