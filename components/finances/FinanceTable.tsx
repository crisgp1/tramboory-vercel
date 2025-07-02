'use client';

import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Card,
  CardBody
} from '@heroui/react';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  Squares2X2Icon,
  TableCellsIcon,
  TagIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline';
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
  income: 'success',
  expense: 'danger'
} as const;

const statusColorMap = {
  pending: 'warning',
  completed: 'success',
  cancelled: 'danger'
} as const;

const categoryColorMap = {
  reservation: 'primary',
  operational: 'secondary',
  salary: 'warning',
  other: 'default'
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
        <div className="text-center py-20">
          <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">No hay transacciones disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {finances.map((finance) => (
            <Card 
              key={finance._id} 
              className="border border-gray-200 hover:border-gray-300 transition-colors duration-200 bg-white shadow-none hover:shadow-sm"
            >
              <CardBody className="p-4">
                {/* Header con tipo */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      finance.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900 text-sm truncate">
                      {finance.description}
                    </span>
                  </div>
                  <Chip
                    color={typeColorMap[finance.type]}
                    variant="flat"
                    size="sm"
                    className="text-xs"
                    startContent={finance.type === 'income' ? 
                      <ArrowTrendingUpIcon className="w-3 h-3" /> : 
                      <ArrowTrendingDownIcon className="w-3 h-3" />
                    }
                  >
                    {FINANCE_TYPE_LABELS[finance.type]}
                  </Chip>
                </div>

                {/* Información principal */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-600">
                    {formatDate(finance.date)}
                  </div>
                  <div className="text-xs text-gray-600">
                    <Chip
                      color={categoryColorMap[finance.category]}
                      variant="flat"
                      size="sm"
                      className="text-xs"
                    >
                      {FINANCE_CATEGORY_LABELS[finance.category]}
                    </Chip>
                  </div>
                  {finance.reservation && (
                    <div className="text-xs text-gray-600 truncate">
                      Cliente: {finance.reservation.customerName}
                    </div>
                  )}
                  {finance.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {finance.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          <TagIcon className="w-2 h-2" />
                          {tag}
                        </span>
                      ))}
                      {finance.tags.length > 2 && (
                        <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{finance.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Monto y estado */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col">
                    <span className={`font-semibold text-sm ${
                      finance.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.amount)}
                    </span>
                    {finance.totalWithChildren && finance.totalWithChildren !== finance.amount && (
                      <div className="flex items-center gap-1 mt-1">
                        <UserGroupIcon className="w-3 h-3 text-gray-400" />
                        <span className={`text-xs ${
                          finance.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          Total: {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.totalWithChildren)}
                        </span>
                      </div>
                    )}
                    {finance.children && finance.children.length > 0 && (
                      <span className="text-xs text-gray-500 mt-1">
                        {finance.children.length} relacionado{finance.children.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <Chip
                    color={statusColorMap[finance.status]}
                    variant="flat"
                    size="sm"
                    className="text-xs"
                  >
                    {FINANCE_STATUS_LABELS[finance.status]}
                  </Chip>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex-1"
                    onPress={() => onView(finance)}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    className={`flex-1 ${
                      finance.isSystemGenerated
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onPress={() => !finance.isSystemGenerated && onEdit(finance)}
                    isDisabled={finance.isSystemGenerated}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    className={`flex-1 ${
                      finance.isSystemGenerated
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                    onPress={() => !finance.isSystemGenerated && onDelete(finance._id)}
                    isDisabled={finance.isSystemGenerated}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Vista de tabla minimalista
  const TableView = () => {
    const columns = [
      { key: 'date', label: 'Fecha' },
      { key: 'type', label: 'Tipo' },
      { key: 'description', label: 'Descripción' },
      { key: 'category', label: 'Categoría' },
      { key: 'amount', label: 'Monto' },
      { key: 'status', label: 'Estado' },
      { key: 'actions', label: '' }
    ];

    return (
      <div className="w-full overflow-hidden">
        <div className="overflow-x-auto">
          <Table 
            aria-label="Tabla de finanzas"
            classNames={{
              wrapper: "shadow-none border border-gray-200 rounded-lg",
              th: "bg-gray-50 text-gray-700 font-medium text-xs uppercase tracking-wide",
              td: "py-3 border-b border-gray-100 last:border-b-0 text-sm"
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.key} className="text-left px-4">
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody 
              items={finances}
              isLoading={loading}
              loadingContent={
                <div className="flex justify-center items-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Cargando...</p>
                  </div>
                </div>
              }
              emptyContent={
                <div className="text-center py-12">
                  <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">No hay transacciones disponibles</p>
                </div>
              }
            >
              {(finance) => (
                <TableRow key={finance._id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="px-4">
                    <span className="text-gray-900 text-sm">
                      {formatDate(finance.date)}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <Chip
                      color={typeColorMap[finance.type]}
                      variant="flat"
                      size="sm"
                      className="text-xs"
                      startContent={finance.type === 'income' ? 
                        <ArrowTrendingUpIcon className="w-3 h-3" /> : 
                        <ArrowTrendingDownIcon className="w-3 h-3" />
                      }
                    >
                      {FINANCE_TYPE_LABELS[finance.type]}
                    </Chip>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {finance.description}
                        </span>
                        {finance.isSystemGenerated && (
                          <CogIcon className="w-3 h-3 text-blue-500" title="Generado automáticamente" />
                        )}
                      </div>
                      {finance.reservation && (
                        <span className="text-xs text-gray-600">
                          Cliente: {finance.reservation.customerName}
                        </span>
                      )}
                      {finance.children && finance.children.length > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <UserGroupIcon className="w-3 h-3" />
                          {finance.children.length} relacionado{finance.children.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {finance.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {finance.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              <TagIcon className="w-2 h-2" />
                              {tag}
                            </span>
                          ))}
                          {finance.tags.length > 3 && (
                            <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              +{finance.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <Chip
                        color={categoryColorMap[finance.category]}
                        variant="flat"
                        size="sm"
                        className="text-xs"
                      >
                        {FINANCE_CATEGORY_LABELS[finance.category]}
                      </Chip>
                      {finance.subcategory && (
                        <span className="text-xs text-gray-500 mt-1">
                          {finance.subcategory}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className={`font-semibold text-sm ${
                        finance.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.amount)}
                      </span>
                      {finance.totalWithChildren && finance.totalWithChildren !== finance.amount && (
                        <div className="flex items-center gap-1 mt-1">
                          <UserGroupIcon className="w-3 h-3 text-gray-400" />
                          <span className={`text-xs ${
                            finance.type === 'income' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            Total: {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.totalWithChildren)}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <Chip
                      color={statusColorMap[finance.status]}
                      variant="flat"
                      size="sm"
                      className="text-xs"
                    >
                      {FINANCE_STATUS_LABELS[finance.status]}
                    </Chip>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <div className="flex items-center gap-1">
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        onPress={() => onView(finance)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className={finance.isSystemGenerated
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }
                        onPress={() => !finance.isSystemGenerated && onEdit(finance)}
                        isDisabled={finance.isSystemGenerated}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className={finance.isSystemGenerated
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                        }
                        onPress={() => !finance.isSystemGenerated && onDelete(finance._id)}
                        isDisabled={finance.isSystemGenerated}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Toggle de vista minimalista */}
      <div className="hidden lg:flex justify-end mb-4">
        <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-white">
          <Button
            size="sm"
            variant="light"
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              viewMode === 'grid' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            onPress={() => setViewMode('grid')}
            startContent={<Squares2X2Icon className="w-3 h-3" />}
          >
            Grid
          </Button>
          <Button
            size="sm"
            variant="light"
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              viewMode === 'table' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            onPress={() => setViewMode('table')}
            startContent={<TableCellsIcon className="w-3 h-3" />}
          >
            Tabla
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="w-full">
        {viewMode === 'grid' ? <GridView /> : <TableView />}
      </div>
    </div>
  );
}