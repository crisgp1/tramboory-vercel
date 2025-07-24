import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SupabaseInventoryService } from '@/lib/supabase/inventory';
import { AlertType } from '@/types/inventory';
import { z } from 'zod';

// Función temporal para verificar permisos
async function hasInventoryPermission(userId: string, action: string): Promise<boolean> {
  return true;
}

// GET /api/inventory/alerts - Obtener alertas activas
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'read')) {
      return NextResponse.json({ error: 'Sin permisos para leer alertas' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    const productId = searchParams.get('productId') || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const type = searchParams.get('type') as AlertType || undefined;

    const alerts = await SupabaseInventoryService.getActiveAlerts();

    return NextResponse.json({ 
      success: true,
      alerts 
    });

  } catch (error) {
    console.error('Error getting alerts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/alerts - Resolver alerta
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!await hasInventoryPermission(userId, 'update')) {
      return NextResponse.json({ error: 'Sin permisos para resolver alertas' }, { status: 403 });
    }

    const body = await request.json();
    
    const schema = z.object({
      alertId: z.string().min(1, 'ID de alerta es requerido'),
      resolution: z.string().optional()
    });

    const validationResult = schema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { alertId, resolution } = validationResult.data;

    const success = await SupabaseInventoryService.resolveAlert(alertId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'No se pudo resolver la alerta' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Alerta resuelta exitosamente'
    });

  } catch (error) {
    console.error('Error resolving alert:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}