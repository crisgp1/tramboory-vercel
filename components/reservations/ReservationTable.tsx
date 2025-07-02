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
  Tooltip,
  Card,
  CardBody
} from '@heroui/react';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  CakeIcon,
  Squares2X2Icon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reservation } from '@/types/reservation';

interface ReservationTableProps {
  reservations: Reservation[];
  loading: boolean;
  onView: (reservation: Reservation) => void;
  onEdit: (reservation: Reservation) => void;
  onDelete: (id: string) => void;
}

const statusColorMap = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'primary'
} as const;

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada'
};

export default function ReservationTable({
  reservations,
  loading,
  onView,
  onEdit,
  onDelete
}: ReservationTableProps) {
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateString;
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
      {reservations.length === 0 ? (
        <div className="text-center py-20">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">No hay reservas disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {reservations.map((reservation) => (
            <Card 
              key={reservation._id} 
              className="border border-gray-200 hover:border-gray-300 transition-colors duration-200 bg-white shadow-none hover:shadow-sm"
            >
              <CardBody className="p-4">
                {/* Header con estado */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full bg-gray-900 flex-shrink-0"></div>
                    <span className="font-medium text-gray-900 text-sm truncate">
                      {reservation.customer.name}
                    </span>
                  </div>
                  <Chip
                    color={statusColorMap[reservation.status]}
                    variant="flat"
                    size="sm"
                    className="text-xs"
                  >
                    {statusLabels[reservation.status]}
                  </Chip>
                </div>

                {/* Información principal */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-600">
                    {reservation.child.name} • {reservation.child.age} años
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {reservation.package.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatDate(reservation.eventDate)} • {reservation.eventTime}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 text-sm">
                    {formatCurrency(reservation.pricing.total)}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex-1"
                    onPress={() => onView(reservation)}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex-1"
                    onPress={() => onEdit(reservation)}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50 flex-1"
                    onPress={() => onDelete(reservation._id)}
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
      { key: 'customer', label: 'Cliente' },
      { key: 'child', label: 'Niño/a' },
      { key: 'package', label: 'Paquete' },
      { key: 'date', label: 'Fecha' },
      { key: 'time', label: 'Hora' },
      { key: 'total', label: 'Total' },
      { key: 'status', label: 'Estado' },
      { key: 'actions', label: '' }
    ];

    return (
      <div className="w-full overflow-hidden">
        <div className="overflow-x-auto">
          <Table 
            aria-label="Tabla de reservas"
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
              items={reservations}
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
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">No hay reservas disponibles</p>
                </div>
              }
            >
              {(reservation) => (
                <TableRow key={reservation._id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 text-sm">
                        {reservation.customer.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        {reservation.customer.email}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className="text-gray-900 text-sm">
                        {reservation.child.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        {reservation.child.age} años
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className="text-gray-900 text-sm">
                        {reservation.package.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        {reservation.package.maxGuests} invitados
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <span className="text-gray-900 text-sm">
                      {formatDate(reservation.eventDate)}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <span className="text-gray-900 text-sm">
                      {reservation.eventTime}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <span className="font-semibold text-gray-900 text-sm">
                      {formatCurrency(reservation.pricing.total)}
                    </span>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <Chip
                      color={statusColorMap[reservation.status]}
                      variant="flat"
                      size="sm"
                      className="text-xs"
                    >
                      {statusLabels[reservation.status]}
                    </Chip>
                  </TableCell>
                  
                  <TableCell className="px-4">
                    <div className="flex items-center gap-1">
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        onPress={() => onView(reservation)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        onPress={() => onEdit(reservation)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                        onPress={() => onDelete(reservation._id)}
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