import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Finance from '@/models/Finance';

// GET - Obtener todas las etiquetas disponibles
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Agregación para obtener todas las etiquetas únicas con estadísticas
    const pipeline: any[] = [
      // Desenrollar las etiquetas
      { $unwind: '$tags' },
      
      // Filtrar por búsqueda si se proporciona
      ...(search ? [
        { $match: { tags: { $regex: search, $options: 'i' } } }
      ] : []),
      
      // Agrupar por etiqueta y calcular estadísticas
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          incomeAmount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          expenseAmount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          },
          lastUsed: { $max: '$createdAt' }
        }
      },
      
      // Ordenar por uso (más usadas primero)
      { $sort: { count: -1, _id: 1 } },
      
      // Limitar resultados
      { $limit: limit },
      
      // Formatear salida
      {
        $project: {
          _id: 0,
          tag: '$_id',
          count: 1,
          totalAmount: { $round: ['$totalAmount', 2] },
          incomeAmount: { $round: ['$incomeAmount', 2] },
          expenseAmount: { $round: ['$expenseAmount', 2] },
          lastUsed: 1
        }
      }
    ];
    
    const tags = await Finance.aggregate(pipeline);
    
    // Obtener estadísticas generales de etiquetas
    const totalTagsStats = await Finance.aggregate([
      { $match: { tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: null,
          uniqueTags: { $addToSet: '$tags' },
          totalTaggedTransactions: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          uniqueTagsCount: { $size: '$uniqueTags' },
          totalTaggedTransactions: 1
        }
      }
    ]);
    
    const stats = totalTagsStats[0] || { uniqueTagsCount: 0, totalTaggedTransactions: 0 };
    
    return NextResponse.json({
      success: true,
      data: tags,
      stats: {
        totalUniqueTags: stats.uniqueTagsCount,
        totalTaggedTransactions: stats.totalTaggedTransactions,
        returnedTags: tags.length
      }
    });
  } catch (error) {
    console.error('Error fetching finance tags:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las etiquetas' },
      { status: 500 }
    );
  }
}

// POST - Crear o actualizar etiquetas masivamente
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const { action, oldTag, newTag, transactionIds } = body;
    
    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Acción requerida' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'rename':
        // Renombrar una etiqueta en todas las transacciones
        if (!oldTag || !newTag) {
          return NextResponse.json(
            { success: false, error: 'oldTag y newTag son requeridos para renombrar' },
            { status: 400 }
          );
        }
        
        result = await Finance.updateMany(
          { tags: oldTag.toLowerCase() },
          { 
            $set: { 
              'tags.$': newTag.toLowerCase().trim() 
            } 
          }
        );
        
        return NextResponse.json({
          success: true,
          message: `Etiqueta "${oldTag}" renombrada a "${newTag}" en ${result.modifiedCount} transacciones`,
          modifiedCount: result.modifiedCount
        });
        
      case 'delete':
        // Eliminar una etiqueta de todas las transacciones
        if (!oldTag) {
          return NextResponse.json(
            { success: false, error: 'oldTag es requerido para eliminar' },
            { status: 400 }
          );
        }
        
        result = await Finance.updateMany(
          { tags: oldTag.toLowerCase() },
          { $pull: { tags: oldTag.toLowerCase() } }
        );
        
        return NextResponse.json({
          success: true,
          message: `Etiqueta "${oldTag}" eliminada de ${result.modifiedCount} transacciones`,
          modifiedCount: result.modifiedCount
        });
        
      case 'add':
        // Agregar etiqueta a transacciones específicas
        if (!newTag || !transactionIds || !Array.isArray(transactionIds)) {
          return NextResponse.json(
            { success: false, error: 'newTag y transactionIds (array) son requeridos para agregar' },
            { status: 400 }
          );
        }
        
        result = await Finance.updateMany(
          { _id: { $in: transactionIds } },
          { $addToSet: { tags: newTag.toLowerCase().trim() } }
        );
        
        return NextResponse.json({
          success: true,
          message: `Etiqueta "${newTag}" agregada a ${result.modifiedCount} transacciones`,
          modifiedCount: result.modifiedCount
        });
        
      case 'remove':
        // Remover etiqueta de transacciones específicas
        if (!oldTag || !transactionIds || !Array.isArray(transactionIds)) {
          return NextResponse.json(
            { success: false, error: 'oldTag y transactionIds (array) son requeridos para remover' },
            { status: 400 }
          );
        }
        
        result = await Finance.updateMany(
          { _id: { $in: transactionIds } },
          { $pull: { tags: oldTag.toLowerCase() } }
        );
        
        return NextResponse.json({
          success: true,
          message: `Etiqueta "${oldTag}" removida de ${result.modifiedCount} transacciones`,
          modifiedCount: result.modifiedCount
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Acción no válida. Use: rename, delete, add, remove' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing finance tags:', error);
    return NextResponse.json(
      { success: false, error: 'Error al gestionar las etiquetas' },
      { status: 500 }
    );
  }
}