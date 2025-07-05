"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import toast from "react-hot-toast";

interface Supplier {
  id: string;
  supplierId: string;
  name: string;
  code: string;
  email?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface LinkedSupplier {
  supplierId: string;
  name: string;
  userId: string;
  email?: string;
}

export default function LinkSuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [unlinkedSuppliers, setUnlinkedSuppliers] = useState<Supplier[]>([]);
  const [providerUsers, setProviderUsers] = useState<User[]>([]);
  const [linkedSuppliers, setLinkedSuppliers] = useState<LinkedSupplier[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'confirm' | 'loading'>('loading');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 600);
      setIsTablet(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/debug/link-supplier");
      if (!response.ok) throw new Error("Error al cargar datos");
      
      const data = await response.json();
      setUnlinkedSuppliers(data.unlinkedSuppliers || []);
      setProviderUsers(data.providerUsers || []);
      setLinkedSuppliers(data.linkedSuppliers || []);
    } catch (error) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showLoadingModal = (title: string, message: string) => {
    setModalType('loading');
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  const showSuccessModal = (title: string, message: string) => {
    setModalType('success');
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
    setTimeout(() => setShowModal(false), 2000);
  };

  const showErrorModal = (title: string, message: string) => {
    setModalType('error');
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  const showConfirmModal = (title: string, message: string, action: () => void) => {
    setModalType('confirm');
    setModalTitle(title);
    setModalMessage(message);
    setPendingAction(() => action);
    setShowModal(true);
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowModal(false);
  };

  const handleLink = async (supplierId: string) => {
    const userId = selectedUsers[supplierId];
    if (!userId) {
      showErrorModal("Error", "Por favor selecciona un usuario antes de vincular.");
      return;
    }

    setLinking(supplierId);
    showLoadingModal("Vinculando Proveedor", "Procesando la vinculación, por favor espere...");
    
    try {
      const response = await fetch("/api/debug/link-supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, userId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Error al vincular");
      }

      setShowModal(false);
      showSuccessModal("Éxito", "El proveedor ha sido vinculado correctamente al usuario.");
      await fetchData();
      setSelectedUsers(prev => {
        const updated = { ...prev };
        delete updated[supplierId];
        return updated;
      });
    } catch (error: any) {
      setShowModal(false);
      showErrorModal("Error al Vincular", error.message || "No se pudo vincular el proveedor. Intente nuevamente.");
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (supplierId: string, supplierName: string) => {
    showConfirmModal(
      "Confirmar Desvinculación", 
      `¿Está seguro que desea desvincular el proveedor "${supplierName}"? Esta acción eliminará la asociación con el usuario.`,
      () => performUnlink(supplierId)
    );
  };

  const performUnlink = async (supplierId: string) => {
    setUnlinking(supplierId);
    showLoadingModal("Desvinculando Proveedor", "Procesando la desvinculación, por favor espere...");
    
    try {
      const response = await fetch("/api/debug/link-supplier", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Error al desvincular");
      }

      setShowModal(false);
      showSuccessModal("Éxito", "El proveedor ha sido desvinculado correctamente.");
      await fetchData();
    } catch (error: any) {
      setShowModal(false);
      showErrorModal("Error al Desvincular", error.message || "No se pudo desvincular el proveedor. Intente nuevamente.");
    } finally {
      setUnlinking(null);
    }
  };

  const filteredUnlinkedSuppliers = unlinkedSuppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLinkedSuppliers = linkedSuppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplierId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#ebf3fd',
        fontFamily: 'Tahoma, Arial, sans-serif'
      }}>
        <div style={{
          padding: '30px',
          background: 'white',
          border: '1px solid #c5d9f1',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Cargando...
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ebf3fd',
        fontFamily: 'Tahoma, Arial, sans-serif',
        fontSize: '11px',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: 'white',
          border: '1px solid #c5d9f1',
          borderRadius: '4px',
          padding: '20px',
          textAlign: 'center'
        }}>
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <>
    <div style={{
      minHeight: '100vh',
      background: '#ebf3fd',
      fontFamily: 'Tahoma, Arial, sans-serif',
      fontSize: '11px',
      padding: isTablet ? '8px' : '20px'
    }}>
      {/* Central Container */}
      <div style={{
        maxWidth: isTablet ? '100%' : '900px',
        margin: '0 auto',
        background: 'white',
        border: '1px solid #c5d9f1',
        borderRadius: '4px'
      }}>
        
        {/* Title Bar */}
        <div style={{
          background: 'linear-gradient(to bottom, #cde6f7 0%, #a6d1f0 100%)',
          padding: isTablet ? '6px 8px' : '8px 12px',
          borderBottom: '1px solid #c5d9f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? '8px' : '0'
        }}>
          <div style={{
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: 'bold',
            color: '#1f4e79',
            order: isMobile ? 2 : 1,
            width: isMobile ? '100%' : 'auto',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            {isMobile ? 'Vincular Usuarios Surtinet' : 'Gestor de Proveedores - Vincular Usuarios Surtinet'}
          </div>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              background: '#d4e7f7',
              border: '1px solid #9cbfdd',
              borderRadius: '2px',
              padding: '2px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              color: '#1f4e79',
              order: isMobile ? 1 : 2,
              alignSelf: isMobile ? 'flex-start' : 'center'
            }}
          >
            ← Volver
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          padding: isTablet ? '8px' : '16px'
        }}>
          
          {/* Search */}
          <div style={{ marginBottom: '16px' }}>
            <input 
              type="text"
              placeholder={isMobile ? "Buscar..." : "Buscar por nombre, código o email..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 6px',
                border: '1px solid #c5d9f1',
                fontSize: '11px',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

        {/* Unlinked Suppliers Section */}
        <div style={{
          border: '1px solid #c5d9f1',
          marginBottom: '12px'
        }}>
          <div style={{
            background: '#f1f5f9',
            padding: '6px 8px',
            borderBottom: '1px solid #c5d9f1',
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#1f4e79'
          }}>
            Proveedores Sin Vincular ({filteredUnlinkedSuppliers.length})
          </div>
          
          <div style={{ padding: '8px' }}>
            {filteredUnlinkedSuppliers.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#666',
                fontSize: '11px'
              }}>
                Todos los proveedores están vinculados
              </div>
            ) : (
              isMobile ? (
                // Mobile Card View
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredUnlinkedSuppliers.map((supplier, index) => (
                    <div key={supplier.id} style={{
                      background: index % 2 === 0 ? 'white' : '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '2px',
                      padding: '8px'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '11px',
                        marginBottom: '4px',
                        color: '#1f4e79'
                      }}>
                        {supplier.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>
                        <div>Código: {supplier.code}</div>
                        <div>Email: {supplier.email || "-"}</div>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <select
                          value={selectedUsers[supplier.supplierId] || ""}
                          onChange={(e) => {
                            setSelectedUsers(prev => ({
                              ...prev,
                              [supplier.supplierId]: e.target.value
                            }));
                          }}
                          style={{
                            padding: '2px 4px',
                            border: '1px solid #c5d9f1',
                            fontSize: '11px',
                            fontFamily: 'inherit',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">Seleccionar usuario</option>
                          {providerUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name || user.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleLink(supplier.supplierId)}
                        disabled={!selectedUsers[supplier.supplierId] || linking === supplier.supplierId}
                        style={{
                          padding: '4px 8px',
                          background: selectedUsers[supplier.supplierId] ? '#d4e7f7' : '#e6e6e6',
                          border: '1px solid #9cbfdd',
                          borderRadius: '2px',
                          fontSize: '11px',
                          cursor: selectedUsers[supplier.supplierId] ? 'pointer' : 'not-allowed',
                          color: selectedUsers[supplier.supplierId] ? '#1f4e79' : '#999',
                          width: '100%'
                        }}
                      >
                        {linking === supplier.supplierId ? 'Vinculando...' : 'Vincular'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                // Desktop Table View
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '11px',
                    minWidth: '600px'
                  }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ 
                          padding: '4px 6px', 
                          textAlign: 'left', 
                          border: '1px solid #ddd',
                          fontSize: '11px'
                        }}>Código</th>
                        <th style={{ 
                          padding: '4px 6px', 
                          textAlign: 'left', 
                          border: '1px solid #ddd',
                          fontSize: '11px'
                        }}>Nombre</th>
                        <th style={{ 
                          padding: '4px 6px', 
                          textAlign: 'left', 
                          border: '1px solid #ddd',
                          fontSize: '11px',
                          display: isTablet ? 'none' : 'table-cell'
                        }}>Email</th>
                        <th style={{ 
                          padding: '4px 6px', 
                          textAlign: 'left', 
                          border: '1px solid #ddd',
                          fontSize: '11px'
                        }}>Usuario</th>
                        <th style={{ 
                          padding: '4px 6px', 
                          textAlign: 'left', 
                          border: '1px solid #ddd',
                          fontSize: '11px'
                        }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUnlinkedSuppliers.map((supplier, index) => (
                        <tr key={supplier.id} style={{ 
                          background: index % 2 === 0 ? 'white' : '#f8f9fa' 
                        }}>
                          <td style={{ 
                            padding: '4px 6px', 
                            border: '1px solid #ddd',
                            fontSize: '11px'
                          }}>
                            {supplier.code}
                          </td>
                          <td style={{ 
                            padding: '4px 6px', 
                            border: '1px solid #ddd',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>{supplier.name}</td>
                          <td style={{ 
                            padding: '4px 6px', 
                            border: '1px solid #ddd',
                            fontSize: '11px',
                            display: isTablet ? 'none' : 'table-cell'
                          }}>{supplier.email || "-"}</td>
                          <td style={{ 
                            padding: '4px 6px', 
                            border: '1px solid #ddd',
                            fontSize: '11px'
                          }}>
                            <select
                              value={selectedUsers[supplier.supplierId] || ""}
                              onChange={(e) => {
                                setSelectedUsers(prev => ({
                                  ...prev,
                                  [supplier.supplierId]: e.target.value
                                }));
                              }}
                              style={{
                                padding: '2px 4px',
                                border: '1px solid #c5d9f1',
                                fontSize: '11px',
                                fontFamily: 'inherit',
                                width: isTablet ? '100px' : '140px'
                              }}
                            >
                              <option value="">Seleccionar usuario</option>
                              {providerUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name || user.email}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ 
                            padding: '4px 6px', 
                            border: '1px solid #ddd',
                            fontSize: '11px'
                          }}>
                            <button
                              onClick={() => handleLink(supplier.supplierId)}
                              disabled={!selectedUsers[supplier.supplierId] || linking === supplier.supplierId}
                              style={{
                                padding: '2px 8px',
                                background: selectedUsers[supplier.supplierId] ? '#d4e7f7' : '#e6e6e6',
                                border: '1px solid #9cbfdd',
                                borderRadius: '2px',
                                fontSize: '11px',
                                cursor: selectedUsers[supplier.supplierId] ? 'pointer' : 'not-allowed',
                                color: selectedUsers[supplier.supplierId] ? '#1f4e79' : '#999'
                              }}
                            >
                              {linking === supplier.supplierId ? 'Vinculando...' : 'Vincular'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
            
          </div>
        </div>

        {/* Linked Suppliers Section */}
        <div style={{
          border: '1px solid #c5d9f1'
        }}>
          <div style={{
            background: '#f1f5f9',
            padding: '6px 8px',
            borderBottom: '1px solid #c5d9f1',
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#1f4e79'
          }}>
            Proveedores Vinculados ({filteredLinkedSuppliers.length})
          </div>
          
          <div style={{ padding: '8px' }}>
            {filteredLinkedSuppliers.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#666',
                fontSize: '11px'
              }}>
                No hay proveedores vinculados
              </div>
            ) : (
              isMobile ? (
                // Mobile Card View
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredLinkedSuppliers.map((supplier, index) => (
                    <div key={supplier.supplierId} style={{
                      background: index % 2 === 0 ? 'white' : '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '2px',
                      padding: '8px'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '11px',
                        marginBottom: '4px',
                        color: '#1f4e79'
                      }}>
                        {supplier.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>
                        <div>Código: {supplier.supplierId}</div>
                        <div>Email: {supplier.email || "-"}</div>
                        <div style={{ 
                          fontFamily: 'monospace',
                          background: '#f0f0f0',
                          padding: '2px 4px',
                          marginTop: '2px',
                          borderRadius: '2px'
                        }}>
                          ID: {supplier.userId}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{
                          background: '#d4e7f7',
                          color: '#1f4e79',
                          padding: '2px 6px',
                          fontSize: '10px',
                          border: '1px solid #9cbfdd',
                          borderRadius: '2px'
                        }}>
                          Vinculado
                        </span>
                        <button
                          onClick={() => handleUnlink(supplier.supplierId, supplier.name)}
                          disabled={unlinking === supplier.supplierId}
                          style={{
                            padding: '2px 8px',
                            background: '#ffeaa7',
                            border: '1px solid #fdcb6e',
                            borderRadius: '2px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            color: '#e17055',
                            flex: 1
                          }}
                        >
                          {unlinking === supplier.supplierId ? 'Desvinculando...' : 'Desvincular'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Desktop Table View
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '11px',
                    minWidth: '600px'
                  }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ 
                          padding: '4px 6px', 
                          textAlign: 'left', 
                          border: '1px solid #ddd',
                          fontSize: '11px'
                        }}>Código</th>
                        <th style={{ 
                          padding: '4px 6px', 
                          textAlign: 'left', 
                          border: '1px solid #ddd',
                          fontSize: '11px'
                        }}>Nombre</th>
                        <th style={{ 
                          padding: '4px 6px', 
                          textAlign: 'left', 
                          border: '1px solid #ddd',
                          fontSize: '11px',
                          display: isTablet ? 'none' : 'table-cell'
                        }}>Email</th>
                        <th style={{ 
                          padding: '4px 6px', 
                          textAlign: 'left', 
                          border: '1px solid #ddd',
                          fontSize: '11px',
                          display: window.innerWidth <= 900 ? 'none' : 'table-cell'
                        }}>ID Usuario</th>
                        <th style={{ 
                          padding: '4px 6px', 
                          textAlign: 'left', 
                          border: '1px solid #ddd',
                          fontSize: '11px'
                        }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLinkedSuppliers.map((supplier, index) => (
                        <tr key={supplier.supplierId} style={{ 
                          background: index % 2 === 0 ? 'white' : '#f8f9fa' 
                        }}>
                          <td style={{ 
                            padding: '4px 6px', 
                            border: '1px solid #ddd',
                            fontSize: '11px'
                          }}>
                            {supplier.supplierId}
                          </td>
                          <td style={{ 
                            padding: '4px 6px', 
                            border: '1px solid #ddd',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>{supplier.name}</td>
                          <td style={{ 
                            padding: '4px 6px', 
                            border: '1px solid #ddd',
                            fontSize: '11px',
                            display: isTablet ? 'none' : 'table-cell'
                          }}>{supplier.email || "-"}</td>
                          <td style={{ 
                            padding: '4px 6px', 
                            border: '1px solid #ddd',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            display: window.innerWidth <= 900 ? 'none' : 'table-cell'
                          }}>
                            {supplier.userId}
                          </td>
                          <td style={{ 
                            padding: '4px 6px', 
                            border: '1px solid #ddd',
                            fontSize: '11px'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              gap: isTablet ? '2px' : '4px', 
                              alignItems: 'center',
                              flexWrap: isTablet ? 'wrap' : 'nowrap'
                            }}>
                              <span style={{
                                background: '#d4e7f7',
                                color: '#1f4e79',
                                padding: '1px 4px',
                                fontSize: '10px',
                                border: '1px solid #9cbfdd',
                                borderRadius: '2px'
                              }}>
                                Vinculado
                              </span>
                              <button
                                onClick={() => handleUnlink(supplier.supplierId, supplier.name)}
                                disabled={unlinking === supplier.supplierId}
                                style={{
                                  padding: '1px 6px',
                                  background: '#ffeaa7',
                                  border: '1px solid #fdcb6e',
                                  borderRadius: '2px',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                  color: '#e17055'
                                }}
                              >
                                {unlinking === supplier.supplierId ? 'Desvinculando...' : 'Desvincular'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
        
        </div>
      </div>

      {/* Modal 2008 Style */}
      <Modal 
        isOpen={showModal} 
        onClose={() => {
          if (modalType !== 'loading') {
            setShowModal(false);
            setPendingAction(null);
          }
        }}
        classNames={{
          base: "bg-transparent",
          backdrop: "bg-black/20",
          wrapper: "items-center justify-center",
          body: "p-0",
          header: "p-0 m-0",
          footer: "p-0 m-0",
          closeButton: "hidden"
        }}
        hideCloseButton
        isDismissable={modalType !== 'loading'}
        size="sm"
      >
        <ModalContent className="m-0 p-0 w-auto max-w-none">
          <div style={{
            background: 'white',
            border: '1px solid #c5d9f1',
            borderRadius: '4px',
            fontFamily: 'Tahoma, Arial, sans-serif',
            fontSize: '11px',
            width: isMobile ? '280px' : '320px',
            maxWidth: isMobile ? '280px' : '320px',
            margin: isMobile ? '8px' : '0'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(to bottom, #cde6f7 0%, #a6d1f0 100%)',
              padding: '6px 8px',
              borderBottom: '1px solid #c5d9f1',
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#1f4e79',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {modalType === 'loading' && <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid #1f4e79',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>}
              {modalType === 'success' && <span style={{ color: '#2d7d32', fontSize: '12px' }}>✓</span>}
              {modalType === 'error' && <span style={{ color: '#d32f2f', fontSize: '12px' }}>✗</span>}
              {modalType === 'confirm' && <span style={{ color: '#f57c00', fontSize: '12px' }}>⚠</span>}
              {modalTitle}
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '16px 12px',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: modalType === 'loading' ? 'center' : 'flex-start'
            }}>
              {modalType === 'loading' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid #e3f2fd',
                    borderTop: '3px solid #1976d2',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 8px'
                  }}></div>
                  <div style={{ color: '#666', fontSize: '11px' }}>{modalMessage}</div>
                </div>
              )}
              
              {modalType !== 'loading' && (
                <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.4' }}>
                  {modalMessage}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {modalType !== 'loading' && modalType !== 'success' && (
              <div style={{
                padding: '8px 12px',
                borderTop: '1px solid #e0e0e0',
                background: '#f8f9fa',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '6px'
              }}>
                {modalType === 'confirm' && (
                  <>
                    <button
                      onClick={() => setShowModal(false)}
                      style={{
                        padding: '4px 12px',
                        background: '#e6e6e6',
                        border: '1px solid #bbb',
                        borderRadius: '2px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: '#333'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmAction}
                      style={{
                        padding: '4px 12px',
                        background: '#d4e7f7',
                        border: '1px solid #9cbfdd',
                        borderRadius: '2px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: '#1f4e79'
                      }}
                    >
                      Confirmar
                    </button>
                  </>
                )}
                
                {modalType === 'error' && (
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '4px 12px',
                      background: '#d4e7f7',
                      border: '1px solid #9cbfdd',
                      borderRadius: '2px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: '#1f4e79'
                    }}
                  >
                    Aceptar
                  </button>
                )}
              </div>
            )}
          </div>
        </ModalContent>
      </Modal>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}