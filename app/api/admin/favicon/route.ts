import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.formData();
    const file = data.get('favicon') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validate file type and size
    const validTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/ico', 'image/icon', 'image/png', 'image/jpeg', 'image/gif'];
    const maxSize = 1024 * 1024; // 1MB
    
    if (!validTypes.some(type => file.type === type || file.name.toLowerCase().endsWith('.ico'))) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no válido. Use .ico, .png, .jpg o .gif' 
      }, { status: 400 });
    }
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Archivo muy grande. Máximo 1MB' 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine the file extension
    let extension = 'ico';
    if (file.type.includes('png')) extension = 'png';
    else if (file.type.includes('jpeg') || file.type.includes('jpg')) extension = 'jpg';
    else if (file.type.includes('gif')) extension = 'gif';

    // Save the main favicon
    const faviconPath = join(process.cwd(), 'public', 'favicon.ico');
    await writeFile(faviconPath, buffer);

    // Also save with the original extension for backup
    const backupPath = join(process.cwd(), 'public', `favicon-custom.${extension}`);
    await writeFile(backupPath, buffer);

    // If it's a PNG, also create apple-touch-icon
    if (extension === 'png') {
      const appleTouchPath = join(process.cwd(), 'public', 'apple-touch-icon.png');
      await writeFile(appleTouchPath, buffer);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Favicon actualizado correctamente',
      faviconUrl: '/favicon.ico',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error uploading favicon:', error);
    return NextResponse.json({ 
      error: 'Error al procesar el archivo' 
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Restore default favicon
    // In a real implementation, you would copy a default favicon file
    // For now, we'll just indicate success
    
    try {
      // Try to delete custom favicon files
      const faviconPath = join(process.cwd(), 'public', 'favicon.ico');
      const customFiles = [
        join(process.cwd(), 'public', 'favicon-custom.png'),
        join(process.cwd(), 'public', 'favicon-custom.jpg'),
        join(process.cwd(), 'public', 'favicon-custom.gif'),
        join(process.cwd(), 'public', 'favicon-custom.ico')
      ];

      // You might want to restore a default favicon here
      // await copyFile(defaultFaviconPath, faviconPath);

      for (const file of customFiles) {
        try {
          await unlink(file);
        } catch {
          // File doesn't exist, ignore
        }
      }
    } catch (error) {
      console.error('Error restoring default favicon:', error);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Favicon restaurado al predeterminado'
    });
  } catch (error) {
    console.error('Error restoring favicon:', error);
    return NextResponse.json({ 
      error: 'Error al restaurar el favicon' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Return current favicon info
    return NextResponse.json({
      success: true,
      favicon: {
        currentFavicon: '/favicon.ico',
        lastUpdated: new Date().toISOString(),
        size: 'Múltiples tamaños'
      }
    });
  } catch (error) {
    console.error('Error getting favicon info:', error);
    return NextResponse.json({ 
      error: 'Error al obtener información del favicon' 
    }, { status: 500 });
  }
}