import { Metadata } from 'next'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { ThematicsGallery } from '@/components/thematics/ThematicsGallery'

export const metadata: Metadata = {
  title: 'Temáticas - Tramboory',
  description: 'Descubre nuestras increíbles temáticas que harán de tu evento una experiencia única e inolvidable.',
  keywords: 'temáticas, fiestas temáticas, celebraciones, eventos, tramboory, zapopan, superhéroes, princesas',
  openGraph: {
    title: 'Temáticas - Tramboory',
    description: 'Explora nuestras temáticas especiales para hacer tu fiesta única',
    images: ['/img/logo2.webp'],
    type: 'website',
  },
}

export default function ThematicsPage() {
  return (
    <PublicLayout>
      <ThematicsGallery />
    </PublicLayout>
  )
}