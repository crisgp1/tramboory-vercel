"use client"

import React, { useState, useEffect } from "react"
import {
  Paper,
  Button,
  TextInput,
  Textarea,
  Tabs,
  Select,
  Divider,
  Badge,
  Table,
  Switch,
  Loader,
  Group,
  Stack,
  Text,
  Title,
  Grid,
  ActionIcon,
  Center,
  NumberInput,
  Alert,
  Progress,
  Card
} from "@mantine/core"
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
      <Group gap="xs">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            style={{
              width: '1.25rem',
              height: '1.25rem',
              color: star <= Math.round(rating) ? '#fbbf24' : '#d1d5db',
              fill: star <= Math.round(rating) ? '#fbbf24' : 'transparent'
            }}
          />
        ))}
        <Text size="sm" fw={500}>{rating.toFixed(1)}</Text>
      </Group>
    );
  };

  if (loading) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Cargando perfil...</Text>
        </Stack>
      </Center>
    );
  }

  if (!supplier) {
    return (
      <Center>
        <Stack align="center" gap="md" p="xl">
          <Text c="dimmed">No se pudo cargar la información del proveedor</Text>
          <Button 
            variant="light"
            leftSection={<ArrowPathIcon className="w-4 h-4" />}
            onClick={fetchSupplierData}
          >
            Reintentar
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header con acciones */}
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Perfil de Proveedor</Title>
          <Text c="dimmed">Administra tu información y términos comerciales</Text>
        </div>
        <Group>
          {editMode ? (
            <>
              <Button
                variant="light"
                onClick={() => {
                  setEditMode(false);
                  setEditedSupplier(supplier);
                }}
              >
                Cancelar
              </Button>
              <Button
                loading={savingChanges}
                onClick={handleSaveChanges}
              >
                Guardar Cambios
              </Button>
            </>
          ) : (
            <Button
              leftSection={<PencilIcon className="w-4 h-4" />}
              onClick={() => setEditMode(true)}
            >
              Editar Perfil
            </Button>
          )}
        </Group>
      </Group>

      {/* Contenido principal */}
      <Tabs defaultValue="info">
        <Tabs.List>
          <Tabs.Tab 
            value="info" 
            leftSection={<BuildingOfficeIcon className="w-4 h-4" />}
          >
            Información Básica
          </Tabs.Tab>
          <Tabs.Tab 
            value="contact" 
            leftSection={<UserIcon className="w-4 h-4" />}
          >
            Información de Contacto
          </Tabs.Tab>
          <Tabs.Tab 
            value="business" 
            leftSection={<DocumentTextIcon className="w-4 h-4" />}
          >
            Términos Comerciales
          </Tabs.Tab>
          <Tabs.Tab 
            value="performance" 
            leftSection={<ChartBarIcon className="w-4 h-4" />}
          >
            Desempeño
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="info">
          <Paper withBorder p="xl" mt="md">
            {editMode ? (
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <TextInput
                      label="Nombre Comercial"
                      placeholder="Nombre comercial"
                      value={editedSupplier?.name || ""}
                      onChange={(e) => setEditedSupplier(prev => prev ? {...prev, name: e.currentTarget.value} : null)}
                    />
                    
                    <TextInput
                      label="Razón Social"
                      placeholder="Razón social completa"
                      value={editedSupplier?.businessName || ""}
                      onChange={(e) => setEditedSupplier(prev => prev ? {...prev, businessName: e.currentTarget.value} : null)}
                    />
                    
                    <TextInput
                      label="RFC / Identificación Fiscal"
                      placeholder="RFC o número de identificación fiscal"
                      value={editedSupplier?.taxId || ""}
                      onChange={(e) => setEditedSupplier(prev => prev ? {...prev, taxId: e.currentTarget.value} : null)}
                    />
                    
                    <Switch
                      checked={editedSupplier?.isActive}
                      onChange={(event) => setEditedSupplier(prev => prev ? {...prev, isActive: event.currentTarget.checked} : null)}
                      label="Estado Activo"
                    />
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <Textarea
                      label="Descripción"
                      placeholder="Descripción de la empresa o negocio"
                      value={editedSupplier?.description || ""}
                      onChange={(e) => setEditedSupplier(prev => prev ? {...prev, description: e.currentTarget.value} : null)}
                      minRows={5}
                    />
                    
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Código de Proveedor</Text>
                      <Text size="sm" fw={500}>{editedSupplier?.code}</Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Fecha de Registro</Text>
                      <Text size="sm" fw={500}>
                        {new Date(editedSupplier?.createdAt || "").toLocaleDateString()}
                      </Text>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            ) : (
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <div>
                      <Title order={3}>{supplier.name}</Title>
                      <Text size="sm" c="dimmed">Nombre Comercial</Text>
                    </div>
                    
                    <div>
                      <Text fw={500}>{supplier.businessName}</Text>
                      <Text size="sm" c="dimmed">Razón Social</Text>
                    </div>
                    
                    <div>
                      <Text fw={500}>{supplier.taxId}</Text>
                      <Text size="sm" c="dimmed">RFC / Identificación Fiscal</Text>
                    </div>
                    
                    <div>
                      <Badge 
                        color={supplier.isActive ? "green" : "red"}
                        variant="light"
                        leftSection={supplier.isActive ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                      >
                        {supplier.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <div>
                      <Text>{supplier.description}</Text>
                      <Text size="sm" c="dimmed" mt="xs">Descripción</Text>
                    </div>
                    
                    <Divider />
                    
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Código de Proveedor</Text>
                      <Text size="sm" fw={500}>{supplier.code}</Text>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Fecha de Registro</Text>
                      <Text size="sm" fw={500}>
                        {new Date(supplier.createdAt).toLocaleDateString()}
                      </Text>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            )}
          </Paper>
        </Tabs.Panel>
        
        <Tabs.Panel value="contact">
          <Paper withBorder p="xl" mt="md">
            <Grid>
              {/* Información principal de contacto */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Title order={4} mb="md">Contacto Principal</Title>
                
                {editMode ? (
                  <Stack gap="md">
                    <TextInput
                      label="Correo Electrónico"
                      placeholder="Correo electrónico de contacto"
                      value={editedSupplier?.contactInfo.email || ""}
                      onChange={(e) => setEditedSupplier(prev => 
                        prev ? {
                          ...prev, 
                          contactInfo: {
                            ...prev.contactInfo,
                            email: e.currentTarget.value
                          }
                        } : null
                      )}
                      leftSection={<AtSymbolIcon className="w-4 h-4" />}
                    />
                    
                    <TextInput
                      label="Teléfono"
                      placeholder="Teléfono de contacto"
                      value={editedSupplier?.contactInfo.phone || ""}
                      onChange={(e) => setEditedSupplier(prev => 
                        prev ? {
                          ...prev, 
                          contactInfo: {
                            ...prev.contactInfo,
                            phone: e.currentTarget.value
                          }
                        } : null
                      )}
                      leftSection={<PhoneIcon className="w-4 h-4" />}
                    />
                    
                    <TextInput
                      label="Sitio Web"
                      placeholder="Sitio web (opcional)"
                      value={editedSupplier?.contactInfo.website || ""}
                      onChange={(e) => setEditedSupplier(prev => 
                        prev ? {
                          ...prev, 
                          contactInfo: {
                            ...prev.contactInfo,
                            website: e.currentTarget.value
                          }
                        } : null
                      )}
                    />
                    
                    <Divider my="md" />
                    
                    <Text fw={500} mb="sm">Dirección</Text>
                    
                    <TextInput
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
                              street: e.currentTarget.value
                            }
                          }
                        } : null
                      )}
                    />
                    
                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
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
                                  city: e.currentTarget.value
                                }
                              }
                            } : null
                          )}
                        />
                      </Grid.Col>
                      
                      <Grid.Col span={6}>
                        <TextInput
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
                                  state: e.currentTarget.value
                                }
                              }
                            } : null
                          )}
                        />
                      </Grid.Col>
                    </Grid>
                    
                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
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
                                  postalCode: e.currentTarget.value
                                }
                              }
                            } : null
                          )}
                        />
                      </Grid.Col>
                      
                      <Grid.Col span={6}>
                        <TextInput
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
                                  country: e.currentTarget.value
                                }
                              }
                            } : null
                          )}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                ) : (
                  <Stack gap="md">
                    <Group>
                      <AtSymbolIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <Text fw={500}>{supplier.contactInfo.email}</Text>
                        <Text size="sm" c="dimmed">Correo Electrónico</Text>
                      </div>
                    </Group>
                    
                    <Group>
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <Text fw={500}>{supplier.contactInfo.phone}</Text>
                        <Text size="sm" c="dimmed">Teléfono</Text>
                      </div>
                    </Group>
                    
                    {supplier.contactInfo.website && (
                      <Group>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <div>
                          <Text fw={500}>{supplier.contactInfo.website}</Text>
                          <Text size="sm" c="dimmed">Sitio Web</Text>
                        </div>
                      </Group>
                    )}
                    
                    <Divider my="md" />
                    
                    <Group align="flex-start">
                      <MapPinIcon className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <Stack gap="xs">
                          <Text fw={500}>{supplier.contactInfo.address.street}</Text>
                          <Text fw={500}>{supplier.contactInfo.address.city}, {supplier.contactInfo.address.state}</Text>
                          <Text fw={500}>{supplier.contactInfo.address.postalCode}, {supplier.contactInfo.address.country}</Text>
                        </Stack>
                        <Text size="sm" c="dimmed" mt="xs">Dirección</Text>
                      </div>
                    </Group>
                  </Stack>
                )}
              </Grid.Col>
              
              {/* Lista de contactos adicionales */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Group justify="space-between" mb="md">
                  <Title order={4}>Contactos Adicionales</Title>
                  {editMode && (
                    <Button
                      size="sm"
                      variant="light"
                      leftSection={<UserIcon className="w-4 h-4" />}
                    >
                      Agregar Contacto
                    </Button>
                  )}
                </Group>
                
                {supplier.contacts.length === 0 ? (
                  <Paper bg="gray.0" p="md">
                    <Text c="dimmed" ta="center">No hay contactos adicionales registrados</Text>
                  </Paper>
                ) : (
                  <Stack gap="md">
                    {(editMode ? editedSupplier?.contacts || [] : supplier.contacts).map((contact, index) => (
                      <Paper key={index} withBorder p="sm">
                        <Group justify="space-between">
                          <div>
                            <Group gap="xs">
                              <Text fw={500}>{contact.name}</Text>
                              {contact.isPrimary && (
                                <Badge size="sm" variant="light">Principal</Badge>
                              )}
                            </Group>
                            <Text size="sm" c="dimmed">{contact.position}</Text>
                          </div>
                          
                          {editMode && (
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="red"
                              onClick={() => handleRemoveContact(index)}
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </ActionIcon>
                          )}
                        </Group>
                        
                        <Stack gap="xs" mt="sm">
                          <Group gap="xs">
                            <AtSymbolIcon className="w-4 h-4 text-gray-400" />
                            <Text size="sm">{contact.email}</Text>
                          </Group>
                          <Group gap="xs">
                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                            <Text size="sm">{contact.phone}</Text>
                          </Group>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
                
                {editMode && (
                  <Paper withBorder p="md" mt="md">
                    <Text fw={500} mb="md">Agregar Nuevo Contacto</Text>
                    <Stack gap="sm">
                      <TextInput
                        label="Nombre"
                        placeholder="Nombre completo"
                        value={newContact.name}
                        onChange={(e) => setNewContact({...newContact, name: e.currentTarget.value})}
                        size="sm"
                      />
                      
                      <TextInput
                        label="Cargo"
                        placeholder="Cargo o posición"
                        value={newContact.position}
                        onChange={(e) => setNewContact({...newContact, position: e.currentTarget.value})}
                        size="sm"
                      />
                      
                      <TextInput
                        label="Correo Electrónico"
                        placeholder="Correo electrónico"
                        value={newContact.email}
                        onChange={(e) => setNewContact({...newContact, email: e.currentTarget.value})}
                        size="sm"
                      />
                      
                      <TextInput
                        label="Teléfono"
                        placeholder="Teléfono"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({...newContact, phone: e.currentTarget.value})}
                        size="sm"
                      />
                      
                      <Switch
                        checked={newContact.isPrimary}
                        onChange={(event) => setNewContact({...newContact, isPrimary: event.currentTarget.checked})}
                        label="Definir como contacto principal"
                        size="sm"
                      />
                      
                      <Button
                        size="sm"
                        fullWidth
                        onClick={handleAddContact}
                        mt="sm"
                      >
                        Agregar Contacto
                      </Button>
                    </Stack>
                  </Paper>
                )}
              </Grid.Col>
            </Grid>
          </Paper>
        </Tabs.Panel>
        
        <Tabs.Panel value="business">
          <Paper withBorder p="xl" mt="md">
            <Grid>
              {/* Términos de pago */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Title order={4} mb="md">Términos de Pago</Title>
                
                {editMode ? (
                  <Stack gap="md">
                    <Select
                      label="Método de Pago Preferido"
                      placeholder="Seleccionar método"
                      value={editedSupplier?.businessTerms.paymentTerms.method || ""}
                      onChange={(value) => setEditedSupplier(prev => 
                        prev ? {
                          ...prev, 
                          businessTerms: {
                            ...prev.businessTerms,
                            paymentTerms: {
                              ...prev.businessTerms.paymentTerms,
                              method: value || ""
                            }
                          }
                        } : null
                      )}
                      data={[
                        { value: "transfer", label: "Transferencia Bancaria" },
                        { value: "check", label: "Cheque" },
                        { value: "cash", label: "Efectivo" },
                        { value: "credit", label: "Crédito" }
                      ]}
                    />
                    
                    <NumberInput
                      label="Días de Crédito"
                      placeholder="Número de días"
                      value={editedSupplier?.businessTerms.paymentTerms.creditDays || 0}
                      onChange={(value) => setEditedSupplier(prev => 
                        prev ? {
                          ...prev, 
                          businessTerms: {
                            ...prev.businessTerms,
                            paymentTerms: {
                              ...prev.businessTerms.paymentTerms,
                              creditDays: typeof value === 'number' ? value : 0
                            }
                          }
                        } : null
                      )}
                    />
                    
                    <TextInput
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
                              bankAccount: e.currentTarget.value
                            }
                          }
                        } : null
                      )}
                    />
                    
                    <Select
                      label="Moneda"
                      placeholder="Seleccionar moneda"
                      value={editedSupplier?.businessTerms.paymentTerms.currency || "MXN"}
                      onChange={(value) => setEditedSupplier(prev => 
                        prev ? {
                          ...prev, 
                          businessTerms: {
                            ...prev.businessTerms,
                            paymentTerms: {
                              ...prev.businessTerms.paymentTerms,
                              currency: value || "MXN"
                            }
                          }
                        } : null
                      )}
                      data={[
                        { value: "MXN", label: "Peso Mexicano (MXN)" },
                        { value: "USD", label: "Dólar Estadounidense (USD)" },
                        { value: "EUR", label: "Euro (EUR)" }
                      ]}
                    />
                  </Stack>
                ) : (
                  <Stack gap="md">
                    <Group>
                      <CreditCardIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <Text fw={500}>
                          {supplier.businessTerms.paymentTerms.method === "transfer" && "Transferencia Bancaria"}
                          {supplier.businessTerms.paymentTerms.method === "check" && "Cheque"}
                          {supplier.businessTerms.paymentTerms.method === "cash" && "Efectivo"}
                          {supplier.businessTerms.paymentTerms.method === "credit" && "Crédito"}
                        </Text>
                        <Text size="sm" c="dimmed">Método de Pago Preferido</Text>
                      </div>
                    </Group>
                    
                    <Group>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <Text fw={500}>{supplier.businessTerms.paymentTerms.creditDays} días</Text>
                        <Text size="sm" c="dimmed">Días de Crédito</Text>
                      </div>
                    </Group>
                    
                    {supplier.businessTerms.paymentTerms.bankAccount && (
                      <Group>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <div>
                          <Text fw={500}>{supplier.businessTerms.paymentTerms.bankAccount}</Text>
                          <Text size="sm" c="dimmed">Cuenta Bancaria</Text>
                        </div>
                      </Group>
                    )}
                    
                    <Group>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <Text fw={500}>{supplier.businessTerms.paymentTerms.currency}</Text>
                        <Text size="sm" c="dimmed">Moneda</Text>
                      </div>
                    </Group>
                  </Stack>
                )}
                
                <Divider my="xl" />
                
                <Title order={4} mb="md">Certificaciones</Title>
                
                <Stack gap="sm">
                  {(editMode ? editedSupplier?.businessTerms.certifications || [] : supplier.businessTerms.certifications).length === 0 ? (
                    <Paper bg="gray.0" p="md">
                      <Text c="dimmed" ta="center">No hay certificaciones registradas</Text>
                    </Paper>
                  ) : (
                    <Group gap="xs">
                      {(editMode ? editedSupplier?.businessTerms.certifications || [] : supplier.businessTerms.certifications).map((cert, index) => (
                        <Badge 
                          key={index}
                          variant="light"
                          style={{ cursor: editMode ? 'pointer' : 'default' }}
                          onClick={editMode ? () => handleRemoveCertification(index) : undefined}
                        >
                          {cert} {editMode && '×'}
                        </Badge>
                      ))}
                    </Group>
                  )}
                  
                  {editMode && (
                    <Group mt="sm">
                      <TextInput
                        placeholder="Agregar certificación"
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.currentTarget.value)}
                        style={{ flex: 1 }}
                      />
                      <Button onClick={handleAddCertification}>
                        Agregar
                      </Button>
                    </Group>
                  )}
                </Stack>
              </Grid.Col>
              
              {/* Información de entrega */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Title order={4} mb="md">Información de Entrega</Title>
                
                {editMode ? (
                  <Stack gap="md">
                    <NumberInput
                      label="Tiempo Promedio de Entrega (días)"
                      placeholder="Días"
                      value={editedSupplier?.businessTerms.deliveryInfo.averageLeadTimeDays || 0}
                      onChange={(value) => setEditedSupplier(prev => 
                        prev ? {
                          ...prev, 
                          businessTerms: {
                            ...prev.businessTerms,
                            deliveryInfo: {
                              ...prev.businessTerms.deliveryInfo,
                              averageLeadTimeDays: typeof value === 'number' ? value : 0
                            }
                          }
                        } : null
                      )}
                    />
                    
                    <NumberInput
                      label="Monto Mínimo de Pedido (opcional)"
                      placeholder="Monto"
                      leftSection="$"
                      decimalScale={2}
                      value={editedSupplier?.businessTerms.deliveryInfo.minimumOrderValue || 0}
                      onChange={(value) => setEditedSupplier(prev => 
                        prev ? {
                          ...prev, 
                          businessTerms: {
                            ...prev.businessTerms,
                            deliveryInfo: {
                              ...prev.businessTerms.deliveryInfo,
                              minimumOrderValue: typeof value === 'number' ? value : undefined
                            }
                          }
                        } : null
                      )}
                    />
                    
                    <Select
                      label="Términos de Envío"
                      placeholder="Seleccionar términos"
                      value={editedSupplier?.businessTerms.deliveryInfo.shippingTerms || ""}
                      onChange={(value) => setEditedSupplier(prev => 
                        prev ? {
                          ...prev, 
                          businessTerms: {
                            ...prev.businessTerms,
                            deliveryInfo: {
                              ...prev.businessTerms.deliveryInfo,
                              shippingTerms: value || ""
                            }
                          }
                        } : null
                      )}
                      data={[
                        { value: "FOB", label: "FOB - Free On Board" },
                        { value: "CIF", label: "CIF - Cost, Insurance, Freight" },
                        { value: "EXW", label: "EXW - Ex Works" },
                        { value: "DAP", label: "DAP - Delivered At Place" },
                        { value: "DDP", label: "DDP - Delivered Duty Paid" }
                      ]}
                    />
                    
                    <Switch
                      checked={editedSupplier?.businessTerms.deliveryInfo.internationalShipping}
                      onChange={(event) => setEditedSupplier(prev => 
                        prev ? {
                          ...prev, 
                          businessTerms: {
                            ...prev.businessTerms,
                            deliveryInfo: {
                              ...prev.businessTerms.deliveryInfo,
                              internationalShipping: event.currentTarget.checked
                            }
                          }
                        } : null
                      )}
                      label="Envíos Internacionales"
                    />
                  </Stack>
                ) : (
                  <Stack gap="md">
                    <Group>
                      <TruckIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <Text fw={500}>{supplier.businessTerms.deliveryInfo.averageLeadTimeDays} días</Text>
                        <Text size="sm" c="dimmed">Tiempo Promedio de Entrega</Text>
                      </div>
                    </Group>
                    
                    {supplier.businessTerms.deliveryInfo.minimumOrderValue && (
                      <Group>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div>
                          <Text fw={500}>
                            {formatCurrency(supplier.businessTerms.deliveryInfo.minimumOrderValue)}
                          </Text>
                          <Text size="sm" c="dimmed">Monto Mínimo de Pedido</Text>
                        </div>
                      </Group>
                    )}
                    
                    <Group>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <div>
                        <Text fw={500}>{supplier.businessTerms.deliveryInfo.shippingTerms}</Text>
                        <Text size="sm" c="dimmed">Términos de Envío</Text>
                      </div>
                    </Group>
                    
                    <Group>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <Badge 
                          color={supplier.businessTerms.deliveryInfo.internationalShipping ? "green" : "gray"}
                          variant="light"
                        >
                          {supplier.businessTerms.deliveryInfo.internationalShipping ? "Disponible" : "No Disponible"}
                        </Badge>
                        <Text size="sm" c="dimmed" mt="xs">Envíos Internacionales</Text>
                      </div>
                    </Group>
                  </Stack>
                )}
              </Grid.Col>
            </Grid>
          </Paper>
        </Tabs.Panel>
        
        <Tabs.Panel value="performance">
          <Paper withBorder p="xl" mt="md">
            <Grid>
              {/* Calificaciones */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Title order={4} mb="md">Calificaciones</Title>
                
                <Stack gap="lg">
                  <Group justify="space-between">
                    <Text fw={500}>Calificación General</Text>
                    {renderStarRating(supplier.performance.rating.overall)}
                  </Group>
                  
                  <Divider />
                  
                  <Group justify="space-between">
                    <Text>Calidad de Productos</Text>
                    {renderStarRating(supplier.performance.rating.quality)}
                  </Group>
                  
                  <Group justify="space-between">
                    <Text>Precio</Text>
                    {renderStarRating(supplier.performance.rating.price)}
                  </Group>
                  
                  <Group justify="space-between">
                    <Text>Entrega</Text>
                    {renderStarRating(supplier.performance.rating.delivery)}
                  </Group>
                  
                  <Group justify="space-between">
                    <Text>Servicio</Text>
                    {renderStarRating(supplier.performance.rating.service)}
                  </Group>
                  
                  <Text size="xs" c="dimmed" fs="italic">
                    Última actualización: {new Date(supplier.performance.rating.lastUpdated).toLocaleDateString()}
                  </Text>
                </Stack>
                
                <Divider my="xl" />
                
                <Title order={4} mb="md">Métricas de Desempeño</Title>
                
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text>Problemas de Calidad</Text>
                    <Text fw={500}>
                      {supplier.performance.metrics.qualityIssues} reportados
                    </Text>
                  </Group>
                  
                  <Group justify="space-between">
                    <Text>Tasa de Devolución</Text>
                    <Text fw={500}>
                      {supplier.performance.metrics.returnRate}%
                    </Text>
                  </Group>
                  
                  <Group justify="space-between">
                    <Text>Tiempo de Respuesta Promedio</Text>
                    <Text fw={500}>
                      {supplier.performance.metrics.responseTime} horas
                    </Text>
                  </Group>
                  
                  <Group justify="space-between">
                    <Text>Días Promedio de Procesamiento</Text>
                    <Text fw={500}>
                      {supplier.performance.metrics.avgProcessingDays} días
                    </Text>
                  </Group>
                </Stack>
              </Grid.Col>
              
              {/* Historial de órdenes */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Title order={4} mb="md">Historial de Órdenes</Title>
                
                <Stack gap="md">
                  <Grid>
                    <Grid.Col span={6}>
                      <Card withBorder>
                        <Text ta="center">
                          <Text size="xs" c="dimmed">Total de Órdenes</Text>
                          <Title order={2}>
                            {supplier.performance.orderHistory.totalOrders}
                          </Title>
                        </Text>
                      </Card>
                    </Grid.Col>
                    
                    <Grid.Col span={6}>
                      <Card withBorder>
                        <Text ta="center">
                          <Text size="xs" c="dimmed">Valor Promedio</Text>
                          <Title order={2}>
                            {formatCurrency(supplier.performance.orderHistory.averageOrderValue)}
                          </Title>
                        </Text>
                      </Card>
                    </Grid.Col>
                  </Grid>
                  
                  <Paper bg="gray.0" p="md">
                    <Text fw={500} mb="md">Cumplimiento de Entregas</Text>
                    
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Group gap="xs">
                          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                          <Text>A tiempo</Text>
                        </Group>
                        <Group gap="xs">
                          <Text fw={500}>{supplier.performance.orderHistory.completedOnTime}</Text>
                          <Text size="sm" c="dimmed">
                            ({Math.round((supplier.performance.orderHistory.completedOnTime / supplier.performance.orderHistory.totalOrders) * 100)}%)
                          </Text>
                        </Group>
                      </Group>
                      
                      <Group justify="space-between">
                        <Group gap="xs">
                          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#eab308' }}></div>
                          <Text>Con retraso</Text>
                        </Group>
                        <Group gap="xs">
                          <Text fw={500}>{supplier.performance.orderHistory.completedLate}</Text>
                          <Text size="sm" c="dimmed">
                            ({Math.round((supplier.performance.orderHistory.completedLate / supplier.performance.orderHistory.totalOrders) * 100)}%)
                          </Text>
                        </Group>
                      </Group>
                      
                      <Group justify="space-between">
                        <Group gap="xs">
                          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                          <Text>Canceladas</Text>
                        </Group>
                        <Group gap="xs">
                          <Text fw={500}>{supplier.performance.orderHistory.cancelled}</Text>
                          <Text size="sm" c="dimmed">
                            ({Math.round((supplier.performance.orderHistory.cancelled / supplier.performance.orderHistory.totalOrders) * 100)}%)
                          </Text>
                        </Group>
                      </Group>
                    </Stack>
                    
                    {/* Progress bar visual */}
                    <Progress.Root size="sm" mt="md">
                      <Progress.Section 
                        value={Math.round((supplier.performance.orderHistory.completedOnTime / supplier.performance.orderHistory.totalOrders) * 100)}
                        color="green"
                      />
                      <Progress.Section 
                        value={Math.round((supplier.performance.orderHistory.completedLate / supplier.performance.orderHistory.totalOrders) * 100)}
                        color="yellow"
                      />
                      <Progress.Section 
                        value={Math.round((supplier.performance.orderHistory.cancelled / supplier.performance.orderHistory.totalOrders) * 100)}
                        color="red"
                      />
                    </Progress.Root>
                  </Paper>
                  
                  <Button
                    variant="light"
                    fullWidth
                    leftSection={<ClipboardDocumentListIcon className="w-4 h-4" />}
                  >
                    Ver Historial Detallado
                  </Button>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}