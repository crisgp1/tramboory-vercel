"use client";

import { ReactNode, useEffect, useState } from "react";
import { Divider, Group, Button, Center, Loader, Text, Card, Stack, Alert } from "@mantine/core";
import { ExclamationCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { UnifiedSupplier } from "@/lib/types/supplier.types";
import SupplierHeader from "./SupplierHeader";
import SupplierNavigation from "./SupplierNavigation";
import SupplierInfo from "./SupplierInfo";

interface SupplierLayoutWrapperProps {
  children: ReactNode;
  userId?: string;
  userRole?: string;
  initialSupplierData?: UnifiedSupplier | null;
}

interface LayoutState {
  supplier: UnifiedSupplier | null;
  loading: boolean;
  error: string | null;
}

// Single Responsibility - Main layout orchestrator
export default function SupplierLayoutWrapper({
  children,
  userId,
  userRole,
  initialSupplierData
}: SupplierLayoutWrapperProps) {
  const [layoutState, setLayoutState] = useState<LayoutState>({
    supplier: initialSupplierData || null,
    loading: !initialSupplierData,
    error: null
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!initialSupplierData && userId) {
      loadSupplierData();
    } else {
      setLayoutState(prev => ({ ...prev, loading: false }));
    }
  }, [userId, initialSupplierData]);

  const loadSupplierData = async () => {
    try {
      setLayoutState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/supplier/profile');
      if (!response.ok) {
        if (response.status === 403) {
          setLayoutState(prev => ({ ...prev, error: 'Sin acceso de proveedor', loading: false }));
        } else {
          setLayoutState(prev => ({ ...prev, error: 'Error al cargar datos del proveedor', loading: false }));
        }
        return;
      }

      const supplierData: UnifiedSupplier = await response.json();
      setLayoutState(prev => ({ ...prev, supplier: supplierData, loading: false }));
      
    } catch (err) {
      console.error('Error loading supplier data:', err);
      setLayoutState(prev => ({ ...prev, error: 'Error inesperado al cargar datos', loading: false }));
    }
  };

  // Dependency Inversion - Error handling abstracted
  if (layoutState.loading) {
    return <LoadingState />;
  }

  if (layoutState.error) {
    return <ErrorState error={layoutState.error} onRetry={loadSupplierData} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--mantine-color-gray-0)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Fixed Header */}
      <SupplierHeader
        showMobileMenu={true}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      
      {/* Body with Sidebar and Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Desktop Sidebar */}
        <DesktopSidebar supplier={layoutState.supplier} />
        
        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '1.5rem' }}>
          {/* Mobile Navigation (when open) */}
          {mobileMenuOpen && (
            <MobileNavigation onItemClick={() => setMobileMenuOpen(false)} />
          )}
          
          {/* Page Content */}
          <div style={{ marginTop: mobileMenuOpen ? '1rem' : '0' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Single Responsibility Components

function LoadingState() {
  return (
    <Center style={{ minHeight: '100vh' }}>
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text c="dimmed">Cargando portal de proveedor...</Text>
      </Stack>
    </Center>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <Card withBorder p="xl" style={{ maxWidth: '500px', width: '100%' }}>
        <Stack align="center" gap="md">
          <ExclamationCircleIcon style={{ width: '3rem', height: '3rem', color: 'var(--mantine-color-orange-6)' }} />
          <Text size="xl" fw={500}>Acceso no disponible</Text>
          
          {error === 'Sin acceso de proveedor' ? (
            <Stack gap="sm">
              <Text ta="center" c="dimmed">
                Tu cuenta no tiene un perfil de proveedor asociado.
              </Text>
              <Alert icon={<InformationCircleIcon style={{ width: '1rem', height: '1rem' }} />} color="blue">
                Si deberías tener acceso como proveedor, contacta al administrador del sistema.
              </Alert>
            </Stack>
          ) : (
            <Text ta="center" c="dimmed">
              {error}
            </Text>
          )}
          
          <Group>
            <Button variant="light" onClick={onRetry}>
              Reintentar
            </Button>
            <Button variant="light" component="a" href="/dashboard">
              Volver al Dashboard
            </Button>
          </Group>
        </Stack>
      </Card>
    </div>
  );
}

interface DesktopSidebarProps {
  supplier: UnifiedSupplier | null;
}

function DesktopSidebar({ supplier }: DesktopSidebarProps) {
  return (
    <nav style={{
      width: '16rem',
      borderRight: '1px solid var(--mantine-color-gray-3)',
      backgroundColor: 'white',
      height: 'calc(100vh - 4rem)', // Subtract header height
      position: 'sticky',
      top: 0,
      overflow: 'auto'
    }} className="hidden lg:block">
      <div style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <SupplierNavigation />
        </div>
        
        <Divider />
        <SupplierInfo supplier={supplier} />
      </div>
    </nav>
  );
}

interface MobileNavigationProps {
  onItemClick: () => void;
}

function MobileNavigation({ onItemClick }: MobileNavigationProps) {
  return (
    <div className="lg:hidden" style={{ marginBottom: '1rem' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: 'var(--mantine-radius-md)', 
        border: '1px solid var(--mantine-color-gray-3)',
        padding: '1rem'
      }}>
        <div onClick={onItemClick}>
          <SupplierNavigation />
        </div>
      </div>
    </div>
  );
}