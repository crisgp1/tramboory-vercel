import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Thematic from '@/models/Thematic'

export async function GET() {
  try {
    await dbConnect()
    
    const thematics = await Thematic.findActive()
    
    return NextResponse.json(thematics)
  } catch (error) {
    console.error('Error fetching active thematics:', error)
    return NextResponse.json(
      { error: 'Error al obtener las temáticas' },
      { status: 500 }
    )
  }
}