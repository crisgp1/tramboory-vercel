import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import dbConnect from '@/lib/mongodb'
import Thematic from '@/models/Thematic'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await dbConnect()
    
    const thematics = await Thematic.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean()
    
    return NextResponse.json(thematics)
  } catch (error) {
    console.error('Error fetching thematics:', error)
    return NextResponse.json(
      { error: 'Error al obtener las temáticas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    
    await dbConnect()
    
    // Crear slug si no viene
    if (!body.slug && body.title) {
      body.slug = body.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }
    
    // Verificar que el slug no exista
    const existingThematic = await Thematic.findOne({ slug: body.slug })
    if (existingThematic) {
      body.slug = `${body.slug}-${Date.now()}`
    }
    
    const thematic = new Thematic({
      ...body,
      createdBy: userId
    })
    
    await thematic.save()
    
    return NextResponse.json(thematic, { status: 201 })
  } catch (error) {
    console.error('Error creating thematic:', error)
    return NextResponse.json(
      { error: 'Error al crear la temática' },
      { status: 500 }
    )
  }
}