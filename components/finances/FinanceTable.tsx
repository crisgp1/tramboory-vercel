'use client';

import React, { useState } from 'react';
import {
  Table,
  ScrollArea,
  Button,
  Badge,
  Card,
  ActionIcon,
  Group,
  Stack,
  Text,
  Tooltip
} from '@mantine/core';
import {
  IconEye,
  IconEdit,
  IconTrash,
  IconCurrencyDollar,
  IconTrendingUp,
  IconTrendingDown,
  IconGrid3x3,
  IconTable,
  IconTag,
  IconUsers,
  IconSettings
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Finance, FINANCE_TYPE_LABELS, FINANCE_CATEGORY_LABELS, FINANCE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/types/finance';

interface FinanceTableProps {
  finances: Finance[];
  loading: boolean;
  onView: (finance: Finance) => void;
  onEdit: (finance: Finance) => void;
  onDelete: (id: string) => void;
}

const typeColorMap = {
  income: 'green',
  expense: 'red'
} as const;

const statusColorMap = {
  pending: 'orange',
  completed: 'green',
  cancelled: 'red'
} as const;

const categoryColorMap = {
  reservation: 'blue',
  operational: 'gray',
  salary: 'orange',
  other: 'gray'
} as const;

export default function FinanceTable({
  finances,
  loading,
  onView,
  onEdit,
  onDelete
}: FinanceTableProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  React.useEffect(() => {
    const checkViewMode = () => {
      if (window.innerWidth < 1024) {
        setViewMode('grid');
      }
    };
    
    checkViewMode();
    window.addEventListener('resize', checkViewMode);
    return () => window.removeEventListener('resize', checkViewMode);
  }, []);

  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd/MM/yyyy', { locale: es });
    } catch {
      return typeof date === 'string' ? date : date.toLocaleDateString();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Vista en grid minimalista
  const GridView = () => (
    <div className="w-full">
      {finances.length === 0 ? (
        <Stack align="center" py="xl" gap="md">
          <IconCurrencyDollar size={48} color="gray" />
          <Text c="dimmed" size="sm">No hay transacciones disponibles</Text>
        </Stack>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {finances.map((finance) => (
            <Card 
              key={finance._id} 
              withBorder
              p="md"
              style={{ cursor: 'pointer' }}
              className="hover:shadow-sm transition-shadow"
            >
                {/* Header con tipo */}
                <Group justify="space-between" mb="sm">
                  <Group gap="xs" style={{ minWidth: 0, flex: 1 }}>
                    <div 
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: finance.type === 'income' ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-red-5)',
                        flexShrink: 0
                      }}
                    />
                    <Text size="sm" fw={500} truncate style={{ flex: 1 }}>
                      {finance.description}
                    </Text>
                  </Group>
                  <Badge
                    color={typeColorMap[finance.type]}
                    variant="light"
                    size="sm"
                    leftSection={finance.type === 'income' ? 
                      <IconTrendingUp size={12} /> : 
                      <IconTrendingDown size={12} />
                    }
                  >
                    {FINANCE_TYPE_LABELS[finance.type]}
                  </Badge>
                </Group>

                {/* Información principal */}
                <Stack gap="xs" mb="md">
                  <Text size="xs" c="dimmed">
                    {formatDate(finance.date)}
                  </Text>
                  <Badge
                    color={categoryColorMap[finance.category]}
                    variant="light"
                    size="sm"
                  >
                    {FINANCE_CATEGORY_LABELS[finance.category]}
                  </Badge>
                  {finance.reservation && (
                    <Text size="xs" c="dimmed" truncate>
                      Cliente: {finance.reservation.customerName}
                    </Text>
                  )}
                  {finance.tags.length > 0 && (
                    <Group gap="xs">
                      {finance.tags.slice(0, 2).map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          size="xs"
                          leftSection={<IconTag size={10} />}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {finance.tags.length > 2 && (
                        <Badge variant="outline" size="xs">
                          +{finance.tags.length - 2}
                        </Badge>
                      )}
                    </Group>
                  )}
                </Stack>

                {/* Monto y estado */}
                <Group justify="space-between" mb="sm">
                  <Stack gap="xs">
                    <Text 
                      size="sm" 
                      fw={600}
                      c={finance.type === 'income' ? 'green' : 'red'}
                    >
                      {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.amount)}
                    </Text>
                    {finance.totalWithChildren && finance.totalWithChildren !== finance.amount && (
                      <Group gap="xs">
                        <IconUsers size={12} color="gray" />
                        <Text 
                          size="xs"
                          c={finance.type === 'income' ? 'green' : 'red'}
                        >
                          Total: {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.totalWithChildren)}
                        </Text>
                      </Group>
                    )}
                    {finance.children && finance.children.length > 0 && (
                      <Text size="xs" c="dimmed">
                        {finance.children.length} relacionado{finance.children.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </Stack>
                  <Badge
                    color={statusColorMap[finance.status]}
                    variant="light"
                    size="sm"
                  >
                    {FINANCE_STATUS_LABELS[finance.status]}
                  </Badge>
                </Group>

                {/* Acciones */}
                <Group gap="xs">
                  <Tooltip label="Ver detalles">
                    <ActionIcon
                      variant="light"
                      size="sm"
                      color="gray"
                      onClick={() => onView(finance)}
                      style={{ flex: 1 }}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Editar">
                    <ActionIcon
                      variant="light"
                      size="sm"
                      color="gray"
                      onClick={() => onEdit(finance)}
                      style={{ flex: 1 }}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Eliminar">
                    <ActionIcon
                      variant="light"
                      size="sm"
                      color="red"
                      onClick={() => onDelete(finance._id)}
                      style={{ flex: 1 }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Vista de tabla minimalista  
  const TableView = () => {
    if (finances.length === 0) {
      return (
        <Stack align="center" py="xl" gap="md">
          <IconCurrencyDollar size={48} color="gray" />
          <Text c="dimmed" size="sm">No hay transacciones disponibles</Text>
        </Stack>
      );
    }

    return (
      <ScrollArea>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Descripción</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th>Monto</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {finances.map((finance) => (
              <Table.Tr key={finance._id}>
                <Table.Td>
                  <Text size="sm">
                    {formatDate(finance.date)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={typeColorMap[finance.type]}
                    variant="light"
                    size="sm"
                    leftSection={finance.type === 'income' ? 
                      <IconTrendingUp size={12} /> : 
                      <IconTrendingDown size={12} />
                    }
                  >
                    {FINANCE_TYPE_LABELS[finance.type]}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" truncate>
                    {finance.description}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={categoryColorMap[finance.category]}
                    variant="light"
                    size="sm"
                  >
                    {FINANCE_CATEGORY_LABELS[finance.category]}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text 
                    size="sm" 
                    fw={600}
                    c={finance.type === 'income' ? 'green' : 'red'}
                  >
                    {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.amount)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={statusColorMap[finance.status]}
                    variant="light"
                    size="sm"
                  >
                    {FINANCE_STATUS_LABELS[finance.status]}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Ver">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="gray"
                        onClick={() => onView(finance)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Editar">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="gray"
                        onClick={() => onEdit(finance)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Eliminar">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        color="red"
                        onClick={() => onDelete(finance._id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <Stack gap="md">
      {/* Toggle de vista */}
      <Group justify="flex-end" className="hidden lg:flex">
        <Button.Group>
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'filled' : 'light'}
            leftSection={<IconGrid3x3 size={16} />}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'table' ? 'filled' : 'light'}
            leftSection={<IconTable size={16} />}
            onClick={() => setViewMode('table')}
          >
            Tabla
          </Button>
        </Button.Group>
      </Group>

      {/* Vista actual */}
      {viewMode === 'grid' ? <GridView /> : <TableView />}
    </Stack>
  );
}