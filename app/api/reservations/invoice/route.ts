import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Reservation from '@/models/Reservation';

export async function POST(request: NextRequest) {
  try {
    const { reservationId } = await request.json();
    
    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Fetch reservation details with populated fields
    const reservation = await Reservation.findById(reservationId)
      .populate('package')
      .populate('foodOption')
      .populate('eventTheme')
      .populate('extraServices')
      .lean();

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Cast reservation to any to avoid TypeScript issues with MongoDB lean() result
    const reservationData = reservation as any;

    // Generate HTML invoice
    const invoiceHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura - Reserva #${(reservation as any)._id}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .invoice-section {
            flex: 1;
        }
        .invoice-section h3 {
            color: #2563eb;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .invoice-section p {
            margin-bottom: 5px;
            color: #666;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .details-table th {
            background: #f5f5f5;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #e0e0e0;
            color: #333;
        }
        .details-table td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        .total-section {
            text-align: right;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
        }
        .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
        }
        .total-label {
            margin-right: 20px;
            font-weight: 600;
            min-width: 120px;
            text-align: right;
        }
        .total-value {
            min-width: 100px;
            text-align: right;
        }
        .grand-total {
            font-size: 20px;
            color: #2563eb;
            font-weight: bold;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #2563eb;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #999;
            font-size: 14px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            background: #10b981;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">TRAMBOORY</div>
            <p>Factura de Reserva</p>
        </div>
        
        <div class="invoice-info">
            <div class="invoice-section">
                <h3>Detalles de la Factura</h3>
                <p><strong>Factura #:</strong> INV-${(reservation as any)._id}</p>
                <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                <p><strong>Estado:</strong> <span class="status-badge">${reservationData.status === 'confirmed' ? 'Confirmada' : reservationData.status === 'pending' ? 'Pendiente' : 'Cancelada'}</span></p>
            </div>
            
            <div class="invoice-section">
                <h3>Información del Cliente</h3>
                <p><strong>${reservationData.customer?.name || 'Cliente'}</strong></p>
                <p>${reservationData.customer?.email || ''}</p>
                <p>${reservationData.customer?.phone || ''}</p>
            </div>
        </div>
        
        <div class="invoice-section" style="margin-bottom: 30px;">
            <h3>Detalles del Evento</h3>
            <p><strong>Fecha del Evento:</strong> ${new Date(reservationData.eventDate).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
            <p><strong>Horario:</strong> ${reservationData.eventTime || 'Por confirmar'}</p>
            <p><strong>Número de Invitados:</strong> ${reservationData.guests || 'N/A'}</p>
            <p><strong>Nombre del Festejado:</strong> ${reservationData.child?.name || 'N/A'}</p>
            <p><strong>Edad:</strong> ${reservationData.child?.age || 'N/A'} años</p>
        </div>
        
        <table class="details-table">
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">Precio Unitario</th>
                    <th style="text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${reservationData.package ? `
                <tr>
                    <td><strong>Paquete: ${reservationData.package.name}</strong></td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right;">$${(reservationData.pricing?.packagePrice || 0).toFixed(2)}</td>
                    <td style="text-align: right;">$${(reservationData.pricing?.packagePrice || 0).toFixed(2)}</td>
                </tr>
                ` : ''}
                
                ${reservationData.foodOption ? `
                <tr>
                    <td>Opción de Comida: ${reservationData.foodOption.name}</td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right;">$${(reservationData.pricing?.foodPrice || 0).toFixed(2)}</td>
                    <td style="text-align: right;">$${(reservationData.pricing?.foodPrice || 0).toFixed(2)}</td>
                </tr>
                ` : ''}
                
                ${reservationData.eventTheme ? `
                <tr>
                    <td>Tema: ${reservationData.eventTheme.name} ${reservationData.eventTheme.selectedPackage ? `- ${reservationData.eventTheme.selectedPackage.name}` : ''}</td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right;">$${(reservationData.pricing?.themePrice || 0).toFixed(2)}</td>
                    <td style="text-align: right;">$${(reservationData.pricing?.themePrice || 0).toFixed(2)}</td>
                </tr>
                ` : ''}
                
                ${reservationData.extraServices && reservationData.extraServices.length > 0 ? reservationData.extraServices.map((extra: any) => `
                <tr>
                    <td>Extra: ${extra.name}</td>
                    <td style="text-align: center;">${extra.quantity || 1}</td>
                    <td style="text-align: right;">$${(extra.price || 0).toFixed(2)}</td>
                    <td style="text-align: right;">$${((extra.price || 0) * (extra.quantity || 1)).toFixed(2)}</td>
                </tr>
                `).join('') : ''}
            </tbody>
        </table>
        
        <div class="total-section">
            <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span class="total-value">$${(reservationData.pricing?.total || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
                <span class="total-label">IVA (16%):</span>
                <span class="total-value">$${((reservationData.pricing?.total || 0) * 0.16).toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
                <span class="total-label">Total a Pagar:</span>
                <span class="total-value">$${((reservationData.pricing?.total || 0) * 1.16).toFixed(2)}</span>
            </div>
        </div>
        
        <div class="footer">
            <p>Gracias por confiar en Tramboory para su evento especial</p>
            <p>Esta es una factura electrónica generada automáticamente</p>
            <p>Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>
        </div>
    </div>
</body>
</html>
    `;

    // Dynamic import for Puppeteer
    let browser;
    try {
      const isVercel = !!process.env.VERCEL_ENV;
      let puppeteer: any;
      let launchOptions: any = {
        headless: true,
      };

      if (isVercel) {
        const chromium = (await import('@sparticuz/chromium')).default;
        puppeteer = await import('puppeteer-core');
        launchOptions = {
          ...launchOptions,
          args: chromium.args,
          executablePath: await chromium.executablePath(),
        };
      } else {
        puppeteer = await import('puppeteer');
      }

      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      
      // Set viewport for better PDF rendering
      await page.setViewport({ width: 1200, height: 1600 });
      
      // Set content and wait for styles to load
      await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      // Return PDF as response
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="factura-reserva-${(reservation as any)._id}.pdf"`,
        },
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      return NextResponse.json({ error: 'Error generating invoice PDF' }, { status: 500 });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    console.error('Error in invoice generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}