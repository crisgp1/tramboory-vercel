'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignUpRedirectHandler() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (isLoaded && user && !hasRedirected) {
      // No redirigir si el usuario ya está en una página específica
      if (pathname !== '/' && pathname !== '/bienvenida') {
        return;
      }

      // Obtener el rol del usuario
      const userRole = user.publicMetadata?.role as string;
      
      // Solo redirigir a usuarios customer o sin rol definido
      if (userRole && userRole !== 'customer') {
        console.log(`🚫 No redirecting user with role: ${userRole}`);
        return;
      }

      // Verificar si es un usuario nuevo (creado en los últimos 5 minutos)
      const userCreatedAt = new Date(user.createdAt!);
      const now = new Date();
      const timeDiff = now.getTime() - userCreatedAt.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      console.log(`🔄 SignUpRedirectHandler: User role: ${userRole}, Minutes since creation: ${minutesDiff}`);

      if (minutesDiff <= 5) {
        // Es un usuario nuevo customer, redirigir a crear reservación
        setHasRedirected(true);
        console.log('🔄 Redirecting new customer to /reservaciones/nueva');
        router.push('/reservaciones/nueva');
      } else if (userRole === 'customer' || !userRole) {
        // Usuario customer existente, redirigir a ver reservaciones
        setHasRedirected(true);
        console.log('🔄 Redirecting existing customer to /reservaciones');
        router.push('/reservaciones');
      }
    }
  }, [isLoaded, user, router, hasRedirected, pathname]);

  return null; // Este componente no renderiza nada
}