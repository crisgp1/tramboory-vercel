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
  Badge,
  Card,
  CardBody,
  CardHeader,
  Divider
} from '@heroui/react';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  EnvelopeIcon,
  CakeIcon
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
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  // Vista móvil con cards
  const MobileView = () => (
    <div className="space-y-4">
      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay reservas disponibles</p>
        </div>
      ) : (
        reservations.map((reservation) => (
          <Card key={reservation._id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{reservation.customer.name}</h3>
                    <p className="text-sm text-gray-500">{reservation.customer.email}</p>
                  </div>
                </div>
                <Chip
                  color={statusColorMap[reservation.status]}
                  variant="flat"
                  size="sm"
                >
                  {statusLabels[reservation.status]}
                </Chip>
              </div>
            </CardHeader>
            
            <Divider />
            
            <CardBody className="pt-4">
              <div className="space-y-3">
                {/* Información del niño */}
                <div className="flex items-center gap-2">
                  <CakeIcon className="w-4 h-4 text-pink-500" />
                  <span className="text-sm">
                    <span className="font-medium">{reservation.child.name}</span>
                    <Badge content={`${reservation.child.age} años`} size="sm" color="primary" className="ml-2">
                      <span></span>
                    </Badge>
                  </span>
                </div>

                {/* Paquete */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-sm">
                    <span className="font-medium">{reservation.package.name}</span>
                    <span className="text-gray-500 ml-1">
                      (hasta {reservation.package.maxGuests} invitados)
                    </span>
                  </span>
                </div>

                {/* Fecha y hora */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{formatDate(reservation.eventDate)}</span>
                    {reservation.isRestDay && (
                      <Badge content="Día de descanso" size="sm" color="warning">
                        <span></span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{reservation.eventTime}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="w-4 h-4 text-green-500" />
                    <span className="font-bold text-green-600">
                      {formatCurrency(reservation.pricing.total)}
                    </span>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center gap-1">
                    <Tooltip content="Ver detalles">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => onView(reservation)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                    
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="warning"
                        onPress={() => onEdit(reservation)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                    
                    <Tooltip content="Eliminar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => onDelete(reservation._id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );

  // Vista de escritorio con tabla
  const DesktopView = () => {
    const columns = [
      { key: 'customer', label: 'Cliente' },
      { key: 'child', label: 'Niño/a' },
      { key: 'package', label: 'Paquete' },
      { key: 'eventDate', label: 'Fecha del Evento' },
      { key: 'eventTime', label: 'Hora' },
      { key: 'total', label: 'Total' },
      { key: 'status', label: 'Estado' },
      { key: 'actions', label: 'Acciones' }
    ];

    return (
      <Table 
        aria-label="Tabla de reservas"
        classNames={{
          wrapper: "min-h-[400px] shadow-none",
          th: "bg-gray-50 text-gray-700 font-semibold",
          td: "py-4"
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key} className="text-center">
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody 
          items={reservations}
          isLoading={loading}
          loadingContent={<div className="flex justify-center p-4">Cargando reservas...</div>}
          emptyContent={
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay reservas disponibles</p>
            </div>
          }
        >
          {(reservation) => (
            <TableRow key={reservation._id} className="hover:bg-gray-50 transition-colors">
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{reservation.customer.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{reservation.customer.email}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{reservation.child.name}</span>
                  <Badge content={`${reservation.child.age} años`} size="sm" color="primary">
                    <span></span>
                  </Badge>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{reservation.package.name}</span>
                  <span className="text-sm text-gray-500">
                    Hasta {reservation.package.maxGuests} invitados
                  </span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span>{formatDate(reservation.eventDate)}</span>
                  {reservation.isRestDay && (
                    <Badge content="Día de descanso" size="sm" color="warning">
                      <span></span>
                    </Badge>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <span>{reservation.eventTime}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="w-4 h-4 text-green-500" />
                  <span className="font-bold text-green-600">
                    {formatCurrency(reservation.pricing.total)}
                  </span>
                </div>
              </TableCell>
              
              <TableCell>
                <Chip
                  color={statusColorMap[reservation.status]}
                  variant="flat"
                  size="sm"
                >
                  {statusLabels[reservation.status]}
                </Chip>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tooltip content="Ver detalles">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() => onView(reservation)}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  
                  <Tooltip content="Editar">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="warning"
                      onPress={() => onEdit(reservation)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  
                  <Tooltip content="Eliminar">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => onDelete(reservation._id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="w-full">
      {/* Vista móvil (< 768px) */}
      <div className="block md:hidden">
        <MobileView />
      </div>
      
      {/* Vista de escritorio (>= 768px) */}
      <div className="hidden md:block">
        <DesktopView />
      </div>
    </div>
  );
}