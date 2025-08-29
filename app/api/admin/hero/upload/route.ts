import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('media') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo (imágenes y videos)
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
    const allValidTypes = [...validImageTypes, ...validVideoTypes];
    
    if (!allValidTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF) y videos (MP4, WebM, MOV, AVI)' 
        },
        { status: 400 }
      );
    }

    // Validar tamaño del archivo
    const maxImageSize = 10 * 1024 * 1024; // 10MB para imágenes
    const maxVideoSize = 100 * 1024 * 1024; // 100MB para videos
    const maxSize = validVideoTypes.includes(file.type) ? maxVideoSize : maxImageSize;
    
    if (file.size > maxSize) {
      const maxSizeText = validVideoTypes.includes(file.type) ? '100MB' : '10MB';
      return NextResponse.json(
        { success: false, error: `El archivo es demasiado grande. Máximo ${maxSizeText}` },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split('.').pop();
    const mediaType = validVideoTypes.includes(file.type) ? 'video' : 'image';
    const uniqueFileName = `hero/${mediaType}s/${uuidv4()}.${fileExtension}`;
    
    // Subir archivo a Vercel Blob
    const blob = await put(uniqueFileName, file, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    // Retornar información del blob
    return NextResponse.json({
      success: true,
      url: blob.url,
      type: mediaType,
      filename: uniqueFileName,
      size: file.size,
      mimeType: file.type
    });
  } catch (error) {
    console.error('Error uploading hero media to blob storage:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir el archivo al almacenamiento' },
      { status: 500 }
    );
  }
}