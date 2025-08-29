import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FoodOption from '@/models/FoodOption';

export async function GET() {
  try {
    await dbConnect();
    const foodOptions = await FoodOption.find({}).sort({ createdAt: -1 });
    
    // Transform data to match frontend expectations
    const transformedFoodOptions = foodOptions.map(food => ({
      _id: food._id,
      name: food.name,
      description: food.description,
      basePrice: food.basePrice,
      category: food.category,
      mainImage: food.mainImage,
      dishes: {
        adult: food.adultDishes || [],
        kids: food.kidsDishes || []
      },
      adultDishImages: food.adultDishImages || [],
      kidsDishImages: food.kidsDishImages || [],
      upgrades: {
        adult: (food.upgrades || []).filter(u => u.category === 'adult').map(u => ({
          fromDish: u.fromDish,
          toDish: u.toDish,
          additionalPrice: u.additionalPrice,
          image: u.image
        })),
        kids: (food.upgrades || []).filter(u => u.category === 'kids').map(u => ({
          fromDish: u.fromDish,
          toDish: u.toDish,
          additionalPrice: u.additionalPrice,
          image: u.image
        }))
      },
      isActive: food.isActive,
      createdAt: food.createdAt,
      updatedAt: food.updatedAt
    }));
    
    return NextResponse.json({
      success: true,
      data: transformedFoodOptions
    });
  } catch (error) {
    console.error('Error fetching food options:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener las opciones de comida' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const foodOption = new FoodOption(body);
    await foodOption.save();
    
    return NextResponse.json({
      success: true,
      data: foodOption
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating food option:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la opción de comida' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    const foodOption = await FoodOption.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!foodOption) {
      return NextResponse.json(
        { success: false, error: 'Opción de comida no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: foodOption
    });
  } catch (error) {
    console.error('Error updating food option:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar la opción de comida' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de la opción de comida requerido' },
        { status: 400 }
      );
    }
    
    const foodOption = await FoodOption.findByIdAndDelete(id);
    
    if (!foodOption) {
      return NextResponse.json(
        { success: false, error: 'Opción de comida no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Opción de comida eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting food option:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar la opción de comida' },
      { status: 500 }
    );
  }
}