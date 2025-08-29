import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import dbConnect from '@/lib/mongodb'
import GalleryItem from '@/models/GalleryItem'

// GET - Obtener todos los items de galería activos
export async function GET() {
  try {
    await dbConnect()
    
    const items = await GalleryItem.find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .lean()
    
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching gallery items:', error)
    return NextResponse.json(
      { error: 'Error al obtener items de galería' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo item de galería
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await dbConnect()
    
    const body = await request.json()
    const { title, description, type, src, alt, category, aspectRatio, featured } = body

    // Validaciones
    if (!title || !description || !type || !src || !alt || !category) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Obtener el siguiente número de orden
    const lastItem = await GalleryItem.findOne().sort({ order: -1 })
    const nextOrder = lastItem ? lastItem.order + 1 : 1

    const newItem = new GalleryItem({
      title,
      description,
      type,
      src,
      alt,
      category,
      aspectRatio: aspectRatio || 'landscape',
      featured: featured || false,
      order: nextOrder,
    })

    await newItem.save()
    
    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error('Error creating gallery item:', error)
    return NextResponse.json(
      { error: 'Error al crear item de galería' },
      { status: 500 }
    )
  }
}