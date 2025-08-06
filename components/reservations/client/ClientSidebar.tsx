'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Button,
  Avatar,
  Divider
} from '@heroui/react';
import {
  PlusIcon,
  EyeIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import LogoutButton from '@/components/auth/LogoutButton';

export default function ClientSidebar() {
  const { user } = useUser();
  const router = useRouter();

  return (
    <div className="surface-elevated" style={{
      width: '18rem',
      height: '100%',
      borderRight: `0.0625rem solid var(--border-default)`,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Professional User Profile Section */}
      <div className="surface-elevated" style={{
        padding: 'var(--space-6)',
        borderBottom: `0.0625rem solid var(--border-default)`
      }}>
        <div className="flex items-center" style={{
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)'
        }}>
          <Avatar
            src={user?.imageUrl}
            name={user?.fullName || user?.firstName || 'Usuario'}
            size="md"
            style={{
              border: `0.125rem solid var(--border-default)`
            }}
          />
          <div className="flex-1">
            <h2 style={{
              fontSize: 'var(--text-base)',
              fontWeight: '600',
              marginBottom: 'var(--space-1)'
            }}>
              {user?.firstName || 'Usuario'}
            </h2>
            <p className="text-neutral-500" style={{
              fontSize: 'var(--text-sm)'
            }}>
              Mis reservaciones
            </p>
          </div>
        </div>
      </div>

      {/* Professional Main Actions */}
      <div style={{
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)'
      }}>
        <button
          className="btn-primary"
          onClick={() => router.push('/reservaciones/nueva')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            justifyContent: 'center'
          }}
        >
          <PlusIcon className="icon-base" />
          Nueva Reserva
        </button>
        
        <button
          className="btn-secondary"
          onClick={() => router.push('/reservaciones')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            justifyContent: 'center'
          }}
        >
          <EyeIcon className="icon-base" />
          Consultar Reservas
        </button>
      </div>

      <div style={{
        height: '0.0625rem',
        backgroundColor: 'var(--border-default)',
        margin: '0 var(--space-6)'
      }} />

      {/* Professional Footer */}
      <div style={{
        marginTop: 'auto',
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}>
          <button
            className="btn-tertiary"
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              justifyContent: 'flex-start'
            }}
          >
            <HomeIcon className="icon-sm" />
            Inicio
          </button>
          <LogoutButton 
            variant="light" 
            color="danger" 
            size="sm"
            className="w-full justify-start"
          />
        </div>
        <p className="text-neutral-400 text-center" style={{
          fontSize: 'var(--text-xs)'
        }}>
          Tramboory © 2025
        </p>
      </div>
    </div>
  );
}