import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Finance from '@/models/Finance';
import Reservation from '@/models/Reservation';
import mongoose from 'mongoose';

// GET - Obtener children de una finanza
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const params = await context.params;
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    // Verificar que la finanza padre existe
    const parentFinance = await Finance.findById(params.id);
    if (!parentFinance) {
      return NextResponse.json(
        { success: false, error: 'Finanza padre no encontrada' },
        { status: 404 }
      );
    }
    
    // Obtener children
    const children = await Finance.find({ parentId: params.id })
      .sort({ createdAt: -1 })
      .populate('reservation.reservationId');
    
    // Calcular totales
    const totalChildren = children.reduce((sum, child) => {
      return child.type === 'income' ? sum + child.amount : sum - child.amount;
    }, 0);
    
    const totalWithChildren = parentFinance.amount + totalChildren;
    
    return NextResponse.json({
      success: true,
      data: {
        parent: parentFinance,
        children,
        totals: {
          parentAmount: parentFinance.amount,
          childrenAmount: totalChildren,
          totalWithChildren
        }
      }
    });
  } catch (error) {
    console.error('Error fetching finance children:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los children de la finanza' },
      { status: 500 }
    );
  }
}

// POST - Crear un child para una finanza
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const params = await context.params;
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const {
      type,
      description,
      amount,
      date,
      category,
      subcategory,
      tags,
      paymentMethod,
      reference,
      notes,
      status,
      createdBy
    } = body;
    
    // Verificar que la finanza padre existe
    const parentFinance = await Finance.findById(params.id);
    if (!parentFinance) {
      return NextResponse.json(
        { success: false, error: 'Finanza padre no encontrada' },
        { status: 404 }
      );
    }
    
    // Validar datos requeridos
    if (!type || !description || !amount) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: type, description, amount' },
        { status: 400 }
      );
    }
    
    // Validar tipo
    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'El tipo debe ser "income" o "expense"' },
        { status: 400 }
      );
    }
    
    // Validar monto
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json(
        { success: false, error: 'El monto debe ser un número positivo' },
        { status: 400 }
      );
    }
    
    // Preparar datos del child
    const childData: any = {
      type,
      description: description.trim(),
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      category: category || parentFinance.category,
      tags: tags ? tags.map((tag: string) => tag.trim().toLowerCase()) : [],
      status: status || 'completed',
      parentId: params.id,
      isSystemGenerated: false,
      isEditable: true
    };
    
    // Heredar información de la reserva del padre si existe
    if (parentFinance.reservation) {
      childData.reservation = parentFinance.reservation;
    }
    
    // Campos opcionales
    if (subcategory) {
      childData.subcategory = subcategory.trim();
    }
    
    if (paymentMethod) {
      childData.paymentMethod = paymentMethod;
    }
    
    if (reference) {
      childData.reference = reference.trim();
    }
    
    if (notes) {
      childData.notes = notes.trim();
    }
    
    if (createdBy) {
      childData.createdBy = createdBy.trim();
    }
    
    // Agregar etiquetas relacionadas con la finanza padre
    if (parentFinance.reservation) {
      childData.tags.push('relacionado-reserva');
    }
    
    // Crear el child
    const newChild = new Finance(childData);
    await newChild.save();
    
    // Poblar la referencia de reserva si existe
    await newChild.populate('reservation.reservationId');
    
    return NextResponse.json(
      { success: true, data: newChild },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating finance child:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el child de la finanza' },
      { status: 500 }
    );
  }
}