import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó imagen' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF)' },
        { status: 400 }
      );
    }

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `food-options/${uuidv4()}.${fileExtension}`;
    
    // Subir archivo a Vercel Blob
    const blob = await put(uniqueFileName, file, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    // Retornar URL pública del blob
    return NextResponse.json({
      success: true,
      url: blob.url
    });
  } catch (error) {
    console.error('Error uploading image to blob storage:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir la imagen al almacenamiento' },
      { status: 500 }
    );
  }
}