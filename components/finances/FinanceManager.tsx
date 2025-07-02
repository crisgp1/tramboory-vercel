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
    <div className="space-y-8">
      {/* Header minimalista */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">
            Finanzas
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {finances.length} transacciones en total
          </p>
        </div>
        <Button
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={handleCreateFinance}
          className="bg-gray-900 text-white hover:bg-gray-800 text-sm"
          size="md"
        >
          Nueva Transacción
        </Button>
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

      {/* Estadísticas minimalistas */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-gray-200 shadow-none">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.totalIncome)}
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">
                    Ingresos ({stats.incomeCount})
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="border border-gray-200 shadow-none">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.totalExpense)}
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">
                    Egresos ({stats.expenseCount})
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="border border-gray-200 shadow-none">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  stats.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                }`}>
                  <ScaleIcon className={`w-4 h-4 ${
                    stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`} />
                </div>
                <div>
                  <div className={`text-lg font-medium ${
                    stats.balance >= 0 ? 'text-gray-900' : 'text-orange-900'
                  }`}>
                    {formatCurrency(stats.balance)}
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Balance</div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="border border-gray-200 shadow-none">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    {stats.totalTransactions}
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Total</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Contenido principal */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600 text-sm">Cargando finanzas...</p>
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