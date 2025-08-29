import { Metadata } from 'next'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { GaleriaCollage } from '@/components/galeria/GaleriaCollage'

export const metadata: Metadata = {
  title: 'Galería - Tramboory',
  description: 'Explora momentos mágicos y fiestas épicas en nuestra galería de fotos y videos de Tramboory.',
  keywords: 'galería, fotos, videos, fiestas infantiles, celebraciones, momentos especiales, tramboory, zapopan',
  openGraph: {
    title: 'Galería - Tramboory',
    description: 'Descubre la magia de nuestras celebraciones a través de fotos y videos increíbles',
    images: ['/img/logo2.webp'],
    type: 'website',
  },
}

export default function GaleriaPage() {
  return (
    <PublicLayout>
      <GaleriaCollage />
    </PublicLayout>
  )
}