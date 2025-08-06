'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  useDisclosure,
  Spinner
} from '@heroui/react';
import {
  PlusIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import FinanceTable from './FinanceTable';
import FinanceModal from './FinanceModal';
import NewFinanceModal from './NewFinanceModal';
import FinanceFilters from './FinanceFilters';
import { Finance, FinanceStats, CreateFinanceData } from '@/types/finance';

export default function FinanceManager() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [filteredFinances, setFilteredFinances] = useState<Finance[]>([]);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFinance, setSelectedFinance] = useState<Finance | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [reservations, setReservations] = useState<Array<{
    _id: string;
    customer: { name: string };
    child: { name: string };
    eventDate: string;
    pricing: { total: number };
    status: string;
  }>>([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [minAmount, setMinAmount] = useState<number | undefined>();
  const [maxAmount, setMaxAmount] = useState<number | undefined>();
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isNewModalOpen, onOpen: onNewModalOpen, onClose: onNewModalClose } = useDisclosure();

  useEffect(() => {
    fetchFinances();
    fetchTags();
    fetchReservations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    finances, 
    searchTerm, 
    selectedType, 
    selectedCategory, 
    selectedStatus, 
    selectedPaymentMethod,
    selectedTags,
    startDate, 
    endDate,
    minAmount,
    maxAmount
  ]);

  const fetchFinances = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/finances');
      const data = await response.json();
      
      if (data.success) {
        setFinances(data.data);
        setStats(data.stats);
      } else {
        console.error('Error al cargar las finanzas');
      }
    } catch (error) {
      console.error('Error fetching finances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/finances/tags');
      const data = await response.json();
      
      if (data.success) {
        setAvailableTags(data.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/reservations');
      const data = await response.json();
      
      if (data.success) {
        // Filtrar solo reservas confirmadas o pendientes
        const activeReservations = data.data.filter((reservation: any) =>
          reservation.status === 'confirmed' || reservation.status === 'pending'
        );
        setReservations(activeReservations);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...finances];

    // Filtro por texto de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(finance =>
        finance.description.toLowerCase().includes(searchLower) ||
        finance.reference?.toLowerCase().includes(searchLower) ||
        finance.notes?.toLowerCase().includes(searchLower) ||
        finance.reservation?.customerName.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por tipo
    if (selectedType) {
      filtered = filtered.filter(finance => finance.type === selectedType);
    }

    // Filtro por categoría
    if (selectedCategory) {
      filtered = filtered.filter(finance => finance.category === selectedCategory);
    }

    // Filtro por estado
    if (selectedStatus) {
      filtered = filtered.filter(finance => finance.status === selectedStatus);
    }

    // Filtro por método de pago
    if (selectedPaymentMethod) {
      filtered = filtered.filter(finance => finance.paymentMethod === selectedPaymentMethod);
    }

    // Filtro por etiquetas
    if (selectedTags.length > 0) {
      filtered = filtered.filter(finance =>
        selectedTags.some(tag => finance.tags.includes(tag))
      );
    }

    // Filtro por rango de fechas
    if (startDate) {
      filtered = filtered.filter(finance => {
        const financeDate = new Date(finance.date);
        return financeDate >= startDate;
      });
    }

    if (endDate) {
      filtered = filtered.filter(finance => {
        const financeDate = new Date(finance.date);
        return financeDate <= endDate;
      });
    }

    // Filtro por rango de montos
    if (minAmount !== undefined) {
      filtered = filtered.filter(finance => finance.amount >= minAmount);
    }

    if (maxAmount !== undefined) {
      filtered = filtered.filter(finance => finance.amount <= maxAmount);
    }

    setFilteredFinances(filtered);
  };

  const handleView = (finance: Finance) => {
    setSelectedFinance(finance);
    onOpen();
  };

  const handleEdit = (finance: Finance) => {
    setSelectedFinance(finance);
    onOpen();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      return;
    }

    try {
      const response = await fetch(`/api/finances/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        console.log('Transacción eliminada correctamente');
        fetchFinances();
      } else {
        console.error('Error al eliminar la transacción');
      }
    } catch (error) {
      console.error('Error deleting finance:', error);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedPaymentMethod('');
    setSelectedTags([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setMinAmount(undefined);
    setMaxAmount(undefined);
  };

  const handleCreateFinance = () => {
    onNewModalOpen();
  };

  const handleNewFinanceSubmit = async (data: CreateFinanceData) => {
    try {
      const response = await fetch('/api/finances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Transacción creada correctamente');
        fetchFinances();
        fetchTags();
        onNewModalClose();
      } else {
        console.error('Error al crear la transacción');
      }
    } catch (error) {
      console.error('Error creating finance:', error);
    }
  };

  const handleFinanceUpdate = async (id: string, data: Partial<Finance>) => {
    try {
      const response = await fetch(`/api/finances/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Transacción actualizada correctamente');
        fetchFinances();
        fetchTags();
      } else {
        console.error('Error al actualizar la transacción');
      }
    } catch (error) {
      console.error('Error updating finance:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-8)'}}>
      {/* Professional Header */}
      <div className="surface-card">
        <div className="flex items-center justify-between" style={{padding: 'var(--space-6)'}}>
          <div>
            <h1 style={{
              fontSize: 'var(--text-xl)',
              fontWeight: '600',
              marginBottom: 'var(--space-1)'
            }}>
              Finanzas
            </h1>
            <p className="text-neutral-600" style={{
              fontSize: 'var(--text-sm)'
            }}>
              {finances.length} transacciones en total
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={handleCreateFinance}
          >
            <PlusIcon className="icon-base" />
            Nueva Transacción
          </button>
        </div>
      </div>

      {/* Filtros */}
      <FinanceFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedPaymentMethod={selectedPaymentMethod}
        onPaymentMethodChange={setSelectedPaymentMethod}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        availableTags={availableTags}
        startDate={startDate}
        onStartDateChange={(date) => setStartDate(date || undefined)}
        endDate={endDate}
        onEndDateChange={(date) => setEndDate(date || undefined)}
        minAmount={minAmount}
        onMinAmountChange={setMinAmount}
        maxAmount={maxAmount}
        onMaxAmountChange={setMaxAmount}
        onClearFilters={handleClearFilters}
      />

      {/* Professional Statistics */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{gap: 'var(--space-4)'}}>
          <div className="metric-card status-success">
            <div className="flex items-center" style={{gap: 'var(--space-3)'}}>
              <div style={{
                width: 'var(--space-8)',
                height: 'var(--space-8)',
                backgroundColor: '#dcfce7',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowTrendingUpIcon className="icon-base text-green-600" />
              </div>
              <div>
                <div style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: '500',
                  marginBottom: 'var(--space-1)'
                }}>
                  {formatCurrency(stats.totalIncome)}
                </div>
                <div className="text-neutral-600" style={{
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Ingresos ({stats.incomeCount})
                </div>
              </div>
            </div>
          </div>
          
          <div className="metric-card status-error">
            <div className="flex items-center" style={{gap: 'var(--space-3)'}}>
              <div style={{
                width: 'var(--space-8)',
                height: 'var(--space-8)',
                backgroundColor: '#fee2e2',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowTrendingDownIcon className="icon-base text-red-600" />
              </div>
              <div>
                <div style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: '500',
                  marginBottom: 'var(--space-1)'
                }}>
                  {formatCurrency(stats.totalExpense)}
                </div>
                <div className="text-neutral-600" style={{
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Egresos ({stats.expenseCount})
                </div>
              </div>
            </div>
          </div>
          
          <div className={`metric-card ${
            stats.balance >= 0 ? 'status-info' : 'status-warning'
          }`}>
            <div className="flex items-center" style={{gap: 'var(--space-3)'}}>
              <div style={{
                width: 'var(--space-8)',
                height: 'var(--space-8)',
                backgroundColor: stats.balance >= 0 ? '#dbeafe' : '#fef3c7',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ScaleIcon className={`icon-base ${
                  stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
              </div>
              <div>
                <div style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: '500',
                  marginBottom: 'var(--space-1)',
                  color: stats.balance >= 0 ? 'var(--foreground)' : '#ea580c'
                }}>
                  {formatCurrency(stats.balance)}
                </div>
                <div className="text-neutral-600" style={{
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Balance</div>
              </div>
            </div>
          </div>
          
          <div className="metric-card status-neutral">
            <div className="flex items-center" style={{gap: 'var(--space-3)'}}>
              <div style={{
                width: 'var(--space-8)',
                height: 'var(--space-8)',
                backgroundColor: 'var(--surface-elevated)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CurrencyDollarIcon className="icon-base text-neutral-600" />
              </div>
              <div>
                <div style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: '500',
                  marginBottom: 'var(--space-1)'
                }}>
                  {stats.totalTransactions}
                </div>
                <div className="text-neutral-600" style={{
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Total</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Main Content */}
      <div className="surface-card">
        <div style={{padding: 'var(--space-6)'}}>
          {loading ? (
            <div className="flex flex-col justify-center items-center" style={{
              padding: 'var(--space-16) 0'
            }}>
              <div className="loading-spinner" style={{marginBottom: 'var(--space-4)'}}></div>
              <p className="text-neutral-600" style={{fontSize: 'var(--text-sm)'}}>Cargando finanzas...</p>
            </div>
          ) : (
            <FinanceTable
              finances={filteredFinances}
              loading={loading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {/* Modal de detalles/edición */}
      <FinanceModal
        isOpen={isOpen}
        onClose={onClose}
        finance={selectedFinance}
        onUpdate={handleFinanceUpdate}
        availableTags={availableTags}
        onRefresh={fetchFinances}
      />

      {/* Modal de nueva transacción */}
      <NewFinanceModal
        isOpen={isNewModalOpen}
        onClose={onNewModalClose}
        onSubmit={handleNewFinanceSubmit}
        availableTags={availableTags}
        reservations={reservations}
      />
    </div>
  );
}