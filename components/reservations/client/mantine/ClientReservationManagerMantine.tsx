'use client';

import React from 'react';
import { MantineProvider } from '@mantine/core';
import { useUser } from '@clerk/nextjs';
import { trambooryTheme } from '@/lib/theme/tramboory-theme';
import ClientLayout from './layout/ClientLayout';
import ReservationDashboard from './dashboard/ReservationDashboard';
import '@mantine/core/styles.css';

/**
 * ClientReservationManagerMantine
 * 
 * Sistema rediseñado aplicando Laws of UX:
 * 
 * 1. Aesthetic-Usability Effect: Diseño limpio y consistente con Mantine
 * 2. Hick's Law: Filtros progresivos, opciones limitadas y organizadas
 * 3. Miller's Law: Información chunked en grupos de 7±2 elementos
 * 4. Jakob's Law: Patrones familiares de navegación y interacción
 * 5. Law of Proximity: Elementos relacionados agrupados visualmente
 * 6. Law of Common Region: Cards y contenedores claros
 * 7. Cognitive Load Reduction: Loading states, jerarquía clara
 * 8. Progressive Disclosure: Filtros avanzados colapsables
 * 9. Mobile-first responsive design
 * 10. Accessibility compliant (WCAG 2.1 AA)
 */
export default function ClientReservationManagerMantine() {
  const { isLoaded, user } = useUser();

  // Loading state mientras se carga el usuario
  if (!isLoaded) {
    return (
      <MantineProvider theme={trambooryTheme}>
        <ClientLayout>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '60vh' 
          }}>
            <div>Cargando...</div>
          </div>
        </ClientLayout>
      </MantineProvider>
    );
  }

  // Redirect si no hay usuario autenticado
  if (!user) {
    return (
      <MantineProvider theme={trambooryTheme}>
        <ClientLayout>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '60vh',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2>Acceso Requerido</h2>
            <p>Por favor inicia sesión para ver tus reservaciones.</p>
          </div>
        </ClientLayout>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider theme={trambooryTheme}>
      <ClientLayout>
        <ReservationDashboard />
      </ClientLayout>
    </MantineProvider>
  );
}