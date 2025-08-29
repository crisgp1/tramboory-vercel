import { Metadata } from 'next'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { ContactPage } from '@/components/contact/ContactPage'

export const metadata: Metadata = {
  title: 'Contacto - Tramboory',
  description: 'Contáctanos para organizar la fiesta perfecta para tus hijos. Información de contacto, ubicación y formulario para consultas.',
  keywords: 'contacto, tramboory, fiestas infantiles, ubicación, teléfono, email, zapopan, guadalajara',
  openGraph: {
    title: 'Contacto - Tramboory',
    description: 'Estamos aquí para hacer realidad la fiesta de sus sueños. Contáctanos hoy mismo.',
    images: ['/img/logo2.webp'],
    type: 'website',
  },
}

export default function ContactoPage() {
  return (
    <PublicLayout>
      <ContactPage />
    </PublicLayout>
  )
}