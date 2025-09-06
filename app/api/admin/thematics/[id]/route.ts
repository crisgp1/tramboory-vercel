import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import dbConnect from '@/lib/mongodb'
import Thematic from '@/models/Thematic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await dbConnect()
    
    const thematic = await Thematic.findById(params.id).lean()
    
    if (!thematic) {
      return NextResponse.json(
        { error: 'Temática no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(thematic)
  } catch (error) {
    console.error('Error fetching thematic:', error)
    return NextResponse.json(
      { error: 'Error al obtener la temática' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    
    await dbConnect()
    
    const thematic = await Thematic.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    
    if (!thematic) {
      return NextResponse.json(
        { error: 'Temática no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(thematic)
  } catch (error) {
    console.error('Error updating thematic:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la temática' },
      { status: 500 }
    )
  }
}

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
    
    const thematic = await Thematic.findByIdAndDelete(params.id)
    
    if (!thematic) {
      return NextResponse.json(
        { error: 'Temática no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Temática eliminada exitosamente' })
  } catch (error) {
    console.error('Error deleting thematic:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la temática' },
      { status: 500 }
    )
  }
}