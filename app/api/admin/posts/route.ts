import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import PostSchedule from '@/models/PostSchedule';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();
    
    const posts = await PostSchedule.find({})
      .sort({ scheduledDate: -1 })
      .lean();

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json({ 
      error: 'Error al cargar las publicaciones programadas' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();
    
    const data = await request.json();
    
    // Validar que la fecha sea futura
    const scheduledDate = new Date(data.scheduledDate);
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ 
        error: 'La fecha de programación debe ser futura' 
      }, { status: 400 });
    }

    const postData = {
      ...data,
      author: userId,
      scheduledDate,
      status: 'scheduled',
      publishAttempts: 0
    };

    const newPost = new PostSchedule(postData);
    await newPost.save();

    return NextResponse.json({ 
      success: true, 
      data: newPost,
      message: 'Publicación programada correctamente' 
    });
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    return NextResponse.json({ 
      error: 'Error al crear la publicación programada' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const data = await request.json();
    
    // Si se actualiza la fecha, validar que sea futura
    if (data.scheduledDate) {
      const scheduledDate = new Date(data.scheduledDate);
      if (scheduledDate <= new Date()) {
        return NextResponse.json({ 
          error: 'La fecha de programación debe ser futura' 
        }, { status: 400 });
      }
      data.scheduledDate = scheduledDate;
    }

    const updatedPost = await PostSchedule.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedPost) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedPost,
      message: 'Publicación actualizada correctamente' 
    });
  } catch (error) {
    console.error('Error updating scheduled post:', error);
    return NextResponse.json({ 
      error: 'Error al actualizar la publicación' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const deletedPost = await PostSchedule.findByIdAndDelete(id);

    if (!deletedPost) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Publicación eliminada correctamente' 
    });
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return NextResponse.json({ 
      error: 'Error al eliminar la publicación' 
    }, { status: 500 });
  }
}