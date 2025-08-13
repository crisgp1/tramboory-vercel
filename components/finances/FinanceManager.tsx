'use client';

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Button,
  Loader,
  Stack,
  Group,
  Text,
  Title,
  Grid,
  Card,
  ThemeIcon,
  Center
} from '@mantine/core';
import {
  IconPlus,
  IconCurrencyDollar,
  IconTrendingUp,
  IconTrendingDown,
  IconScale
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
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
  
  const [isOpen, { open: onOpen, close: onClose }] = useDisclosure();
  const [isNewModalOpen, { open: onNewModalOpen, close: onNewModalClose }] = useDisclosure();

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
    <Stack gap="lg">
      {/* Header */}
      <Paper p="lg" withBorder>
        <Group justify="space-between">
          <Stack gap="xs">
            <Title order={2}>Finanzas</Title>
            <Text c="dimmed" size="sm">
              {finances.length} transacciones en total
            </Text>
          </Stack>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateFinance}
          >
            Nueva Transacción
          </Button>
        </Group>
      </Paper>

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

      {/* Statistics */}
      {stats && (
        <Grid>
          <Grid.Col span={{ base: 6, lg: 3 }}>
            <Card withBorder p="md">
              <Group>
                <ThemeIcon size="lg" radius="md" color="green">
                  <IconTrendingUp size={24} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xl" fw={600}>
                    {formatCurrency(stats.totalIncome)}
                  </Text>
                  <Text size="xs" c="dimmed" tt="uppercase">
                    Ingresos ({stats.incomeCount})
                  </Text>
                </Stack>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 6, lg: 3 }}>
            <Card withBorder p="md">
              <Group>
                <ThemeIcon size="lg" radius="md" color="red">
                  <IconTrendingDown size={24} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xl" fw={600}>
                    {formatCurrency(stats.totalExpense)}
                  </Text>
                  <Text size="xs" c="dimmed" tt="uppercase">
                    Egresos ({stats.expenseCount})
                  </Text>
                </Stack>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 6, lg: 3 }}>
            <Card withBorder p="md">
              <Group>
                <ThemeIcon size="lg" radius="md" color={stats.balance >= 0 ? "blue" : "orange"}>
                  <IconScale size={24} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text 
                    size="xl" 
                    fw={600}
                    c={stats.balance >= 0 ? undefined : "orange"}
                  >
                    {formatCurrency(stats.balance)}
                  </Text>
                  <Text size="xs" c="dimmed" tt="uppercase">
                    Balance
                  </Text>
                </Stack>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 6, lg: 3 }}>
            <Card withBorder p="md">
              <Group>
                <ThemeIcon size="lg" radius="md" color="gray">
                  <IconCurrencyDollar size={24} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xl" fw={600}>
                    {stats.totalTransactions}
                  </Text>
                  <Text size="xs" c="dimmed" tt="uppercase">
                    Total
                  </Text>
                </Stack>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {/* Main Content */}
      <Paper withBorder>
        {loading ? (
          <Center p="xl" style={{ minHeight: 200 }}>
            <Stack align="center" gap="sm">
              <Loader size="lg" />
              <Text c="dimmed">Cargando finanzas...</Text>
            </Stack>
          </Center>
        ) : (
          <FinanceTable
            finances={filteredFinances}
            loading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Paper>

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
    </Stack>
  );
}