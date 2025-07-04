"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Tabs,
  Tab,
  Select,
  SelectItem,
  Divider,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Switch,
  Spinner
} from "@heroui/react"
import {
  BuildingOfficeIcon,
  UserIcon,
  PhoneIcon,
  AtSymbolIcon,
  MapPinIcon,
  CreditCardIcon,
  TruckIcon,
  DocumentTextIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon
} from "@heroicons/react/24/outline"
import toast from "react-hot-toast"

// Interfaces for supplier data
interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface SupplierContact {
  name: string;
  position: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

interface PaymentTerms {
  method: string;
  creditDays: number;
  bankAccount?: string;
  currency: string;
}

interface DeliveryInfo {
  averageLeadTimeDays: number;
  minimumOrderValue?: number;
  shippingTerms: string;
  internationalShipping: boolean;
}

interface SupplierRating {
  overall: number;
  quality: number;
  price: number;
  delivery: number;
  service: number;
  lastUpdated: string;
}

interface OrderSummary {
  totalOrders: number;
  completedOnTime: number;
  completedLate: number;
  cancelled: number;
  averageOrderValue: number;
}

interface PerformanceMetrics {
  qualityIssues: number;
  returnRate: number;
  responseTime: number;
  avgProcessingDays: number;
}

interface SupplierData {
  _id: string;
  code: string;
  name: string;
  businessName: string;
  taxId: string;
  description: string;
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
    address: Address;
  };
  contacts: SupplierContact[];
  businessTerms: {
    paymentTerms: PaymentTerms;
    deliveryInfo: DeliveryInfo;
    certifications: string[];
  };
  performance: {
    rating: SupplierRating;
    orderHistory: OrderSummary;
    metrics: PerformanceMetrics;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SupplierProfile() {
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedSupplier, setEditedSupplier] = useState<SupplierData | null>(null);
  const [newContact, setNewContact] = useState<SupplierContact>({
    name: "",
    position: "",
    email: "",
    phone: "",
    isPrimary: false
  });
  const [newCertification, setNewCertification] = useState("");
  const [savingChanges, setSavingChanges] = useState(false);

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const fetchSupplierData = async () => {
    setLoading(true);
    try {
      // Call to supplier API - this will filter to the current supplier automatically based on auth
      const response = await fetch("/api/supplier/profile");
      if (response.ok) {
        const data = await response.json();
        setSupplier(data);
        setEditedSupplier(data);
      } else {
        toast.error("Error al cargar los datos del proveedor");
      }
    } catch (error) {
      console.error("Error fetching supplier data:", error);
      toast.error("Error al cargar los datos del proveedor");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!editedSupplier) return;

    setSavingChanges(true);
    try {
      const response = await fetch("/api/supplier/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editedSupplier)
      });

      if (response.ok) {
        setSupplier(editedSupplier);
        setEditMode(false);
        toast.success("Perfil actualizado correctamente");
      } else {
        toast.error("Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error updating supplier profile:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setSavingChanges(false);
    }
  };

  const handleAddContact = () => {
    if (!editedSupplier) return;

    if (!newContact.name || !newContact.email || !newContact.phone) {
      toast.error("Por favor completa todos los campos del contacto");
      return;
    }

    const updatedContacts = [...editedSupplier.contacts, newContact];
    
    // If this is marked as primary, update other contacts
    if (newContact.isPrimary) {
      updatedContacts.forEach((contact, index) => {
        if (contact !== newContact && contact.isPrimary) {
          updatedContacts[index] = { ...contact, isPrimary: false };
        }
      });
    }

    setEditedSupplier({
      ...editedSupplier,
      contacts: updatedContacts
    });

    setNewContact({
      name: "",
      position: "",
      email: "",
      phone: "",
      isPrimary: false
    });

    toast.success("Contacto agregado");
  };

  const handleRemoveContact = (index: number) => {
    if (!editedSupplier) return;

    const updatedContacts = [...editedSupplier.contacts];
    updatedContacts.splice(index, 1);

    setEditedSupplier({
      ...editedSupplier,
      contacts: updatedContacts
    });

    toast.success("Contacto eliminado");
  };

  const handleAddCertification = () => {
    if (!editedSupplier || !newCertification.trim()) return;

    setEditedSupplier({
      ...editedSupplier,
      businessTerms: {
        ...editedSupplier.businessTerms,
        certifications: [...editedSupplier.businessTerms.certifications, newCertification.trim()]
      }
    });

    setNewCertification("");
    toast.success("Certificación agregada");
  };

  const handleRemoveCertification = (index: number) => {
    if (!editedSupplier) return;

    const updatedCertifications = [...editedSupplier.businessTerms.certifications];
    updatedCertifications.splice(index, 1);

    setEditedSupplier({
      ...editedSupplier,
      businessTerms: {
        ...editedSupplier.businessTerms,
        certifications: updatedCertifications
      }
    });

    toast.success("Certificación eliminada");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="primary" label="Cargando perfil..." />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No se pudo cargar la información del proveedor</p>
        <Button 
          color="primary" 
          variant="light"
          startContent={<ArrowPathIcon className="w-4 h-4" />}
          onPress={fetchSupplierData}
          className="mt-4"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil de Proveedor</h1>
          <p className="text-gray-600">Administra tu información y términos comerciales</p>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button
                color="default"
                variant="light"
                onPress={() => {
                  setEditMode(false);
                  setEditedSupplier(supplier);
                }}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                isLoading={savingChanges}
                onPress={handleSaveChanges}
              >
                Guardar Cambios
              </Button>
            </>
          ) : (
            <Button
              color="primary"
              startContent={<PencilIcon className="w-4 h-4" />}
              onPress={() => setEditMode(true)}
            >
              Editar Perfil
            </Button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <Tabs aria-label="Secciones del perfil" variant="underlined">
        <Tab key="info" title={
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="w-4 h-4" />
            <span>Información Básica</span>
          </div>
        }>
          <Card className="mt-4">
            <CardBody className="p-6">
              {editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input
                      label="Nombre Comercial"
                      placeholder="Nombre comercial"
                      value={editedSupplier?.name || ""}
                      onChange={(e) => setEditedSupplier(prev => prev ? {...prev, name: e.target.value} : null)}
                    />
                    
                    <Input
                      label="Razón Social"
                      placeholder="Razón social completa"
                      value={editedSupplier?.businessName || ""}
                      onChange={(e) => setEditedSupplier(prev => prev ? {...prev, businessName: e.target.value} : null)}
                    />
                    
                    <Input
                      label="RFC / Identificación Fiscal"
                      placeholder="RFC o número de identificación fiscal"
                      value={editedSupplier?.taxId || ""}
                      onChange={(e) => setEditedSupplier(prev => prev ? {...prev, taxId: e.target.value} : null)}
                    />
                    
                    <Switch
                      isSelected={editedSupplier?.isActive}
                      onValueChange={(value) => setEditedSupplier(prev => prev ? {...prev, isActive: value} : null)}
                    >
                      Estado Activo
                    </Switch>
                  </div>
                  
                  <div className="space-y-4">
                    <Textarea
                      label="Descripción"
                      placeholder="Descripción de la empresa o negocio"
                      value={editedSupplier?.description || ""}
                      onChange={(e) => setEditedSupplier(prev => prev ? {...prev, description: e.target.value} : null)}
                      minRows={5}
                    />
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Código de Proveedor</p>
                      <p className="text-sm font-medium">{editedSupplier?.code}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Fecha de Registro</p>
                      <p className="text-sm font-medium">
                        {new Date(editedSupplier?.createdAt || "").toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                      <p className="text-sm text-gray-500">Nombre Comercial</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">{supplier.businessName}</h4>
                      <p className="text-sm text-gray-500">Razón Social</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">{supplier.taxId}</h4>
                      <p className="text-sm text-gray-500">RFC / Identificación Fiscal</p>
                    </div>
                    
                    <div>
                      <Chip 
                        color={supplier.isActive ? "success" : "danger"}
                        variant="flat"
                        startContent={supplier.isActive ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                      >
                        {supplier.isActive ? "Activo" : "Inactivo"}
                      </Chip>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-700">{supplier.description}</p>
                      <p className="text-sm text-gray-500 mt-1">Descripción</p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-500">Código de Proveedor</p>
                        <p className="text-sm font-medium">{supplier.code}</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Fecha de Registro</p>
                        <p className="text-sm font-medium">
                          {new Date(supplier.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>
        
        <Tab key="contact" title={
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            <span>Información de Contacto</span>
          </div>
        }>
          <Card className="mt-4">
            <CardBody className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información principal de contacto */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto Principal</h3>
                  
                  {editMode ? (
                    <div className="space-y-4">
                      <Input
                        label="Correo Electrónico"
                        placeholder="Correo electrónico de contacto"
                        value={editedSupplier?.contactInfo.email || ""}
                        onChange={(e) => setEditedSupplier(prev => 
                          prev ? {
                            ...prev, 
                            contactInfo: {
                              ...prev.contactInfo,
                              email: e.target.value
                            }
                          } : null
                        )}
                        startContent={<AtSymbolIcon className="w-4 h-4 text-gray-400" />}
                      />
                      
                      <Input
                        label="Teléfono"
                        placeholder="Teléfono de contacto"
                        value={editedSupplier?.contactInfo.phone || ""}
                        onChange={(e) => setEditedSupplier(prev => 
                          prev ? {
                            ...prev, 
                            contactInfo: {
                              ...prev.contactInfo,
                              phone: e.target.value
                            }
                          } : null
                        )}
                        startContent={<PhoneIcon className="w-4 h-4 text-gray-400" />}
                      />
                      
                      <Input
                        label="Sitio Web"
                        placeholder="Sitio web (opcional)"
                        value={editedSupplier?.contactInfo.website || ""}
                        onChange={(e) => setEditedSupplier(prev => 
                          prev ? {
                            ...prev, 
                            contactInfo: {
                              ...prev.contactInfo,
                              website: e.target.value
                            }
                          } : null
                        )}
                      />
                      
                      <Divider className="my-4" />
                      
                      <h4 className="font-medium text-gray-900 mb-2">Dirección</h4>
                      
                      <Input
                        label="Calle y Número"
                        placeholder="Calle y número"
                        value={editedSupplier?.contactInfo.address.street || ""}
                        onChange={(e) => setEditedSupplier(prev => 
                          prev ? {
                            ...prev, 
                            contactInfo: {
                              ...prev.contactInfo,
                              address: {
                                ...prev.contactInfo.address,
                                street: e.target.value
                              }
                            }
                          } : null
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Ciudad"
                          placeholder="Ciudad"
                          value={editedSupplier?.contactInfo.address.city || ""}
                          onChange={(e) => setEditedSupplier(prev => 
                            prev ? {
                              ...prev, 
                              contactInfo: {
                                ...prev.contactInfo,
                                address: {
                                  ...prev.contactInfo.address,
                                  city: e.target.value
                                }
                              }
                            } : null
                          )}
                        />
                        
                        <Input
                          label="Estado"
                          placeholder="Estado/Provincia"
                          value={editedSupplier?.contactInfo.address.state || ""}
                          onChange={(e) => setEditedSupplier(prev => 
                            prev ? {
                              ...prev, 
                              contactInfo: {
                                ...prev.contactInfo,
                                address: {
                                  ...prev.contactInfo.address,
                                  state: e.target.value
                                }
                              }
                            } : null
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Código Postal"
                          placeholder="Código Postal"
                          value={editedSupplier?.contactInfo.address.postalCode || ""}
                          onChange={(e) => setEditedSupplier(prev => 
                            prev ? {
                              ...prev, 
                              contactInfo: {
                                ...prev.contactInfo,
                                address: {
                                  ...prev.contactInfo.address,
                                  postalCode: e.target.value
                                }
                              }
                            } : null
                          )}
                        />
                        
                        <Input
                          label="País"
                          placeholder="País"
                          value={editedSupplier?.contactInfo.address.country || ""}
                          onChange={(e) => setEditedSupplier(prev => 
                            prev ? {
                              ...prev, 
                              contactInfo: {
                                ...prev.contactInfo,
                                address: {
                                  ...prev.contactInfo.address,
                                  country: e.target.value
                                }
                              }
                            } : null
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <AtSymbolIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{supplier.contactInfo.email}</p>
                          <p className="text-sm text-gray-500">Correo Electrónico</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{supplier.contactInfo.phone}</p>
                          <p className="text-sm text-gray-500">Teléfono</p>
                        </div>
                      </div>
                      
                      {supplier.contactInfo.website && (
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-900">{supplier.contactInfo.website}</p>
                            <p className="text-sm text-gray-500">Sitio Web</p>
                          </div>
                        </div>
                      )}
                      
                      <Divider className="my-4" />
                      
                      <div className="flex items-start gap-3">
                        <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-medium text-gray-900">
                            <p>{supplier.contactInfo.address.street}</p>
                            <p>{supplier.contactInfo.address.city}, {supplier.contactInfo.address.state}</p>
                            <p>{supplier.contactInfo.address.postalCode}, {supplier.contactInfo.address.country}</p>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Dirección</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Lista de contactos adicionales */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Contactos Adicionales</h3>
                    {editMode && (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<UserIcon className="w-4 h-4" />}
                      >
                        Agregar Contacto
                      </Button>
                    )}
                  </div>
                  
                  {supplier.contacts.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-gray-500">No hay contactos adicionales registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(editMode ? editedSupplier?.contacts || [] : supplier.contacts).map((contact, index) => (
                        <Card key={index} className="border border-gray-200">
                          <CardBody className="p-3">
                            <div className="flex justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{contact.name}</p>
                                  {contact.isPrimary && (
                                    <Chip size="sm" color="primary" variant="flat">Principal</Chip>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{contact.position}</p>
                              </div>
                              
                              {editMode && (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  onPress={() => handleRemoveContact(index)}
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="mt-2 text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <AtSymbolIcon className="w-4 h-4 text-gray-400" />
                                <span>{contact.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <PhoneIcon className="w-4 h-4 text-gray-400" />
                                <span>{contact.phone}</span>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {editMode && (
                    <div className="mt-4 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Agregar Nuevo Contacto</h4>
                      <div className="space-y-3">
                        <Input
                          label="Nombre"
                          placeholder="Nombre completo"
                          value={newContact.name}
                          onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                          size="sm"
                        />
                        
                        <Input
                          label="Cargo"
                          placeholder="Cargo o posición"
                          value={newContact.position}
                          onChange={(e) => setNewContact({...newContact, position: e.target.value})}
                          size="sm"
                        />
                        
                        <Input
                          label="Correo Electrónico"
                          placeholder="Correo electrónico"
                          value={newContact.email}
                          onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                          size="sm"
                        />
                        
                        <Input
                          label="Teléfono"
                          placeholder="Teléfono"
                          value={newContact.phone}
                          onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                          size="sm"
                        />
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            isSelected={newContact.isPrimary}
                            onValueChange={(value) => setNewContact({...newContact, isPrimary: value})}
                            size="sm"
                          />
                          <span className="text-sm">Definir como contacto principal</span>
                        </div>
                        
                        <Button
                          color="primary"
                          size="sm"
                          className="w-full mt-2"
                          onPress={handleAddContact}
                        >
                          Agregar Contacto
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
        
        <Tab key="business" title={
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-4 h-4" />
            <span>Términos Comerciales</span>
          </div>
        }>
          <Card className="mt-4">
            <CardBody className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Términos de pago */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Términos de Pago</h3>
                  
                  {editMode ? (
                    <div className="space-y-4">
                      <Select
                        label="Método de Pago Preferido"
                        placeholder="Seleccionar método"
                        selectedKeys={[editedSupplier?.businessTerms.paymentTerms.method || ""]}
                        onChange={(keys: any) => {
                          const selectedKey = keys.target?.value || Array.from(keys || [])[0] || '';
                          setEditedSupplier(prev => 
                            prev ? {
                              ...prev, 
                              businessTerms: {
                                ...prev.businessTerms,
                                paymentTerms: {
                                  ...prev.businessTerms.paymentTerms,
                                  method: selectedKey.toString()
                                }
                              }
                            } : null
                          );
                        }}
                      >
                        <SelectItem key="transfer">Transferencia Bancaria</SelectItem>
                        <SelectItem key="check">Cheque</SelectItem>
                        <SelectItem key="cash">Efectivo</SelectItem>
                        <SelectItem key="credit">Crédito</SelectItem>
                      </Select>
                      
                      <Input
                        type="number"
                        label="Días de Crédito"
                        placeholder="Número de días"
                        value={editedSupplier?.businessTerms.paymentTerms.creditDays.toString() || "0"}
                        onChange={(e) => setEditedSupplier(prev => 
                          prev ? {
                            ...prev, 
                            businessTerms: {
                              ...prev.businessTerms,
                              paymentTerms: {
                                ...prev.businessTerms.paymentTerms,
                                creditDays: parseInt(e.target.value) || 0
                              }
                            }
                          } : null
                        )}
                      />
                      
                      <Input
                        label="Cuenta Bancaria"
                        placeholder="Número de cuenta (opcional)"
                        value={editedSupplier?.businessTerms.paymentTerms.bankAccount || ""}
                        onChange={(e) => setEditedSupplier(prev => 
                          prev ? {
                            ...prev, 
                            businessTerms: {
                              ...prev.businessTerms,
                              paymentTerms: {
                                ...prev.businessTerms.paymentTerms,
                                bankAccount: e.target.value
                              }
                            }
                          } : null
                        )}
                      />
                      
                      <Select
                        label="Moneda"
                        placeholder="Seleccionar moneda"
                        selectedKeys={[editedSupplier?.businessTerms.paymentTerms.currency || "MXN"]}
                        onChange={(keys: any) => {
                          const selectedKey = keys.target?.value || Array.from(keys || [])[0] || 'MXN';
                          setEditedSupplier(prev => 
                            prev ? {
                              ...prev, 
                              businessTerms: {
                                ...prev.businessTerms,
                                paymentTerms: {
                                  ...prev.businessTerms.paymentTerms,
                                  currency: selectedKey.toString()
                                }
                              }
                            } : null
                          );
                        }}
                      >
                        <SelectItem key="MXN">Peso Mexicano (MXN)</SelectItem>
                        <SelectItem key="USD">Dólar Estadounidense (USD)</SelectItem>
                        <SelectItem key="EUR">Euro (EUR)</SelectItem>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CreditCardIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {supplier.businessTerms.paymentTerms.method === "transfer" && "Transferencia Bancaria"}
                            {supplier.businessTerms.paymentTerms.method === "check" && "Cheque"}
                            {supplier.businessTerms.paymentTerms.method === "cash" && "Efectivo"}
                            {supplier.businessTerms.paymentTerms.method === "credit" && "Crédito"}
                          </p>
                          <p className="text-sm text-gray-500">Método de Pago Preferido</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">{supplier.businessTerms.paymentTerms.creditDays} días</p>
                          <p className="text-sm text-gray-500">Días de Crédito</p>
                        </div>
                      </div>
                      
                      {supplier.businessTerms.paymentTerms.bankAccount && (
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-900">{supplier.businessTerms.paymentTerms.bankAccount}</p>
                            <p className="text-sm text-gray-500">Cuenta Bancaria</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">{supplier.businessTerms.paymentTerms.currency}</p>
                          <p className="text-sm text-gray-500">Moneda</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Divider className="my-6" />
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificaciones</h3>
                  
                  <div className="space-y-3">
                    {(editMode ? editedSupplier?.businessTerms.certifications || [] : supplier.businessTerms.certifications).length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-gray-500">No hay certificaciones registradas</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(editMode ? editedSupplier?.businessTerms.certifications || [] : supplier.businessTerms.certifications).map((cert, index) => (
                          <Chip 
                            key={index}
                            variant="flat"
                            color="primary"
                            onClose={editMode ? () => handleRemoveCertification(index) : undefined}
                          >
                            {cert}
                          </Chip>
                        ))}
                      </div>
                    )}
                    
                    {editMode && (
                      <div className="flex gap-2 mt-3">
                        <Input
                          placeholder="Agregar certificación"
                          value={newCertification}
                          onChange={(e) => setNewCertification(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          color="primary"
                          onPress={handleAddCertification}
                        >
                          Agregar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Información de entrega */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Entrega</h3>
                  
                  {editMode ? (
                    <div className="space-y-4">
                      <Input
                        type="number"
                        label="Tiempo Promedio de Entrega (días)"
                        placeholder="Días"
                        value={editedSupplier?.businessTerms.deliveryInfo.averageLeadTimeDays.toString() || ""}
                        onChange={(e) => setEditedSupplier(prev => 
                          prev ? {
                            ...prev, 
                            businessTerms: {
                              ...prev.businessTerms,
                              deliveryInfo: {
                                ...prev.businessTerms.deliveryInfo,
                                averageLeadTimeDays: parseInt(e.target.value) || 0
                              }
                            }
                          } : null
                        )}
                      />
                      
                      <Input
                        type="number"
                        label="Monto Mínimo de Pedido (opcional)"
                        placeholder="Monto"
                        value={editedSupplier?.businessTerms.deliveryInfo.minimumOrderValue?.toString() || ""}
                        onChange={(e) => setEditedSupplier(prev => 
                          prev ? {
                            ...prev, 
                            businessTerms: {
                              ...prev.businessTerms,
                              deliveryInfo: {
                                ...prev.businessTerms.deliveryInfo,
                                minimumOrderValue: e.target.value ? parseFloat(e.target.value) : undefined
                              }
                            }
                          } : null
                        )}
                        startContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">$</span>
                          </div>
                        }
                      />
                      
                      <Select
                        label="Términos de Envío"
                        placeholder="Seleccionar términos"
                        selectedKeys={[editedSupplier?.businessTerms.deliveryInfo.shippingTerms || ""]}
                        onChange={(keys: any) => {
                          const selectedKey = keys.target?.value || Array.from(keys || [])[0] || '';
                          setEditedSupplier(prev => 
                            prev ? {
                              ...prev, 
                              businessTerms: {
                                ...prev.businessTerms,
                                deliveryInfo: {
                                  ...prev.businessTerms.deliveryInfo,
                                  shippingTerms: selectedKey.toString()
                                }
                              }
                            } : null
                          );
                        }}
                      >
                        <SelectItem key="FOB">FOB - Free On Board</SelectItem>
                        <SelectItem key="CIF">CIF - Cost, Insurance, Freight</SelectItem>
                        <SelectItem key="EXW">EXW - Ex Works</SelectItem>
                        <SelectItem key="DAP">DAP - Delivered At Place</SelectItem>
                        <SelectItem key="DDP">DDP - Delivered Duty Paid</SelectItem>
                      </Select>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          isSelected={editedSupplier?.businessTerms.deliveryInfo.internationalShipping}
                          onValueChange={(value) => setEditedSupplier(prev => 
                            prev ? {
                              ...prev, 
                              businessTerms: {
                                ...prev.businessTerms,
                                deliveryInfo: {
                                  ...prev.businessTerms.deliveryInfo,
                                  internationalShipping: value
                                }
                              }
                            } : null
                          )}
                        />
                        <span>Envíos Internacionales</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <TruckIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{supplier.businessTerms.deliveryInfo.averageLeadTimeDays} días</p>
                          <p className="text-sm text-gray-500">Tiempo Promedio de Entrega</p>
                        </div>
                      </div>
                      
                      {supplier.businessTerms.deliveryInfo.minimumOrderValue && (
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(supplier.businessTerms.deliveryInfo.minimumOrderValue)}
                            </p>
                            <p className="text-sm text-gray-500">Monto Mínimo de Pedido</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">{supplier.businessTerms.deliveryInfo.shippingTerms}</p>
                          <p className="text-sm text-gray-500">Términos de Envío</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <Chip 
                            color={supplier.businessTerms.deliveryInfo.internationalShipping ? "success" : "default"}
                            variant="flat"
                          >
                            {supplier.businessTerms.deliveryInfo.internationalShipping ? "Disponible" : "No Disponible"}
                          </Chip>
                          <p className="text-sm text-gray-500 mt-1">Envíos Internacionales</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
        
        <Tab key="performance" title={
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4" />
            <span>Desempeño</span>
          </div>
        }>
          <Card className="mt-4">
            <CardBody className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calificaciones */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Calificaciones</h3>
                  
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Calificación General</p>
                      {renderStarRating(supplier.performance.rating.overall)}
                    </div>
                    
                    <Divider />
                    
                    <div className="flex justify-between items-center">
                      <p>Calidad de Productos</p>
                      {renderStarRating(supplier.performance.rating.quality)}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p>Precio</p>
                      {renderStarRating(supplier.performance.rating.price)}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p>Entrega</p>
                      {renderStarRating(supplier.performance.rating.delivery)}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p>Servicio</p>
                      {renderStarRating(supplier.performance.rating.service)}
                    </div>
                    
                    <div className="text-xs text-gray-500 italic">
                      Última actualización: {new Date(supplier.performance.rating.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <Divider className="my-6" />
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Desempeño</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <p>Problemas de Calidad</p>
                      <p className="font-medium">
                        {supplier.performance.metrics.qualityIssues} reportados
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <p>Tasa de Devolución</p>
                      <p className="font-medium">
                        {supplier.performance.metrics.returnRate}%
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <p>Tiempo de Respuesta Promedio</p>
                      <p className="font-medium">
                        {supplier.performance.metrics.responseTime} horas
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <p>Días Promedio de Procesamiento</p>
                      <p className="font-medium">
                        {supplier.performance.metrics.avgProcessingDays} días
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Historial de órdenes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Órdenes</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border border-gray-200">
                        <CardBody className="p-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Total de Órdenes</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {supplier.performance.orderHistory.totalOrders}
                            </p>
                          </div>
                        </CardBody>
                      </Card>
                      
                      <Card className="border border-gray-200">
                        <CardBody className="p-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Valor Promedio</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(supplier.performance.orderHistory.averageOrderValue)}
                            </p>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Cumplimiento de Entregas</h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>A tiempo</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{supplier.performance.orderHistory.completedOnTime}</span>
                            <span className="text-sm text-gray-500">
                              ({Math.round((supplier.performance.orderHistory.completedOnTime / supplier.performance.orderHistory.totalOrders) * 100)}%)
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span>Con retraso</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{supplier.performance.orderHistory.completedLate}</span>
                            <span className="text-sm text-gray-500">
                              ({Math.round((supplier.performance.orderHistory.completedLate / supplier.performance.orderHistory.totalOrders) * 100)}%)
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>Canceladas</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{supplier.performance.orderHistory.cancelled}</span>
                            <span className="text-sm text-gray-500">
                              ({Math.round((supplier.performance.orderHistory.cancelled / supplier.performance.orderHistory.totalOrders) * 100)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Barra de progreso visual */}
                      <div className="mt-4 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div 
                            className="bg-green-500 h-full" 
                            style={{ 
                              width: `${Math.round((supplier.performance.orderHistory.completedOnTime / supplier.performance.orderHistory.totalOrders) * 100)}%` 
                            }}
                          ></div>
                          <div 
                            className="bg-yellow-500 h-full" 
                            style={{ 
                              width: `${Math.round((supplier.performance.orderHistory.completedLate / supplier.performance.orderHistory.totalOrders) * 100)}%` 
                            }}
                          ></div>
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ 
                              width: `${Math.round((supplier.performance.orderHistory.cancelled / supplier.performance.orderHistory.totalOrders) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button
                        variant="flat"
                        color="primary"
                        className="w-full"
                        startContent={<ClipboardDocumentListIcon className="w-4 h-4" />}
                      >
                        Ver Historial Detallado
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}