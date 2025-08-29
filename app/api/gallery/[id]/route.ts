import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import dbConnect from '@/lib/mongodb'
import GalleryItem from '@/models/GalleryItem'

// GET - Obtener item específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const item = await GalleryItem.findById(params.id).lean()
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching gallery item:', error)
    return NextResponse.json(
      { error: 'Error al obtener item' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await dbConnect()
    
    const body = await request.json()
    
    const updatedItem = await GalleryItem.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating gallery item:', error)
    return NextResponse.json(
      { error: 'Error al actualizar item' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar item (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await dbConnect()
    
    const deletedItem = await GalleryItem.findByIdAndUpdate(
      params.id,
      { active: false },
      { new: true }
    )

    if (!deletedItem) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Item eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting gallery item:', error)
    return NextResponse.json(
      { error: 'Error al eliminar item' },
      { status: 500 }
    )
  }
}