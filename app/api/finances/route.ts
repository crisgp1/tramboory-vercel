import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Finance from '@/models/Finance';
import Reservation from '@/models/Reservation';

// GET - Obtener todas las transacciones financieras
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tags = searchParams.get('tags');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query: any = {};
    
    // Filtros
    if (type) {
      query.type = type;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }
    
    // Calcular skip para paginación
    const skip = (page - 1) * limit;
    
    // Solo obtener transacciones padre (no children) para la vista principal
    const parentQuery = { ...query, parentId: { $exists: false } };
    
    // Obtener transacciones con paginación
    const finances = await Finance.find(parentQuery)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reservation.reservationId');

    // Para cada finanza padre, obtener sus children y calcular el total
    const financesWithChildren = await Promise.all(
      finances.map(async (finance) => {
        const children = await Finance.find({ parentId: finance._id })
          .sort({ createdAt: -1 });
        
        const totalWithChildren = finance.amount + children.reduce((sum, child) => {
          return child.type === 'income' ? sum + child.amount : sum - child.amount;
        }, 0);

        return {
          ...finance.toObject(),
          children,
          totalWithChildren
        };
      })
    );
    
    // Obtener total de documentos para paginación (solo padres)
    const total = await Finance.countDocuments(parentQuery);
    
    // Calcular estadísticas básicas
    const stats = await Finance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalIncome = stats.find(s => s._id === 'income')?.total || 0;
    const totalExpense = stats.find(s => s._id === 'expense')?.total || 0;
    const balance = totalIncome - totalExpense;
    
    return NextResponse.json({
      success: true,
      data: financesWithChildren,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalIncome,
        totalExpense,
        balance,
        totalTransactions: total
      }
    });
  } catch (error) {
    console.error('Error fetching finances:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las transacciones financieras' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva transacción financiera
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const {
      type,
      description,
      amount,
      date,
      category,
      subcategory,
      reservationId,
      tags,
      paymentMethod,
      reference,
      notes,
      status,
      createdBy,
      parentId,
      isSystemGenerated,
      isEditable
    } = body;
    
    // Validar datos requeridos
    if (!type || !description || !amount || !category) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: type, description, amount, category' },
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
    
    // Validar categoría
    if (!['reservation', 'operational', 'salary', 'other'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Categoría inválida' },
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
    
    // Validar parentId si se proporciona
    if (parentId) {
      const parentFinance = await Finance.findById(parentId);
      if (!parentFinance) {
        return NextResponse.json(
          { success: false, error: 'La finanza padre no existe' },
          { status: 400 }
        );
      }
    }

    // Preparar datos de la transacción
    const financeData: any = {
      type,
      description: description.trim(),
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      category,
      tags: tags ? tags.map((tag: string) => tag.trim().toLowerCase()) : [],
      status: status || 'completed',
      isSystemGenerated: isSystemGenerated || false,
      isEditable: isEditable !== undefined ? isEditable : true
    };

    // Si es un child, agregar parentId
    if (parentId) {
      financeData.parentId = parentId;
    }
    
    // Campos opcionales
    if (subcategory) {
      financeData.subcategory = subcategory.trim();
    }
    
    if (paymentMethod) {
      financeData.paymentMethod = paymentMethod;
    }
    
    if (reference) {
      financeData.reference = reference.trim();
    }
    
    if (notes) {
      financeData.notes = notes.trim();
    }
    
    if (createdBy) {
      financeData.createdBy = createdBy.trim();
    }
    
    // Si está relacionado con una reserva, obtener información
    if (reservationId) {
      const reservation = await Reservation.findById(reservationId);
      if (reservation) {
        financeData.reservation = {
          reservationId: reservation._id,
          customerName: reservation.customer.name,
          eventDate: reservation.eventDate
        };
      }
    }
    
    // Crear la transacción
    const newFinance = new Finance(financeData);
    await newFinance.save();
    
    // Poblar la referencia de reserva si existe
    await newFinance.populate('reservation.reservationId');
    
    return NextResponse.json(
      { success: true, data: newFinance },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating finance:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la transacción financiera' },
      { status: 500 }
    );
  }
}