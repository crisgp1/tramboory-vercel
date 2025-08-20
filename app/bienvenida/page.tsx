'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Button, Loader } from '@mantine/core';
import { SparklesIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function WelcomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/auth');
      return;
    }

    // Countdown para redirección automática
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/reservaciones/nueva');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user, isLoaded, router]);

  const handleCreateReservation = () => {
    router.push('/reservaciones/nueva');
  };

  const handleViewReservations = () => {
    router.push('/reservaciones');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
        <Card.Section className="p-8 text-center">
          {/* Icono de bienvenida */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <SparklesIcon className="w-10 h-10 text-white" />
          </div>

          {/* Mensaje de bienvenida */}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ¡Bienvenido/a, {user?.firstName}!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Tu cuenta ha sido creada exitosamente. ¡Ahora puedes crear tu primera reservación!
          </p>

          {/* Countdown */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">
              Serás redirigido automáticamente en {countdown} segundos...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Button
              leftSection={<CalendarDaysIcon className="w-5 h-5" />}
              onClick={handleCreateReservation}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              Crear Mi Primera Reservación
            </Button>
            
            <Button
              onClick={handleViewReservations}
              variant="bordered"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Ver Mis Reservaciones
            </Button>
          </div>
        </Card.Section>
      </Card>
    </div>
  );
}