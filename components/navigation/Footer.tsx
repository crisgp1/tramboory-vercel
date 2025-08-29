'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FiPhone, FiMail, FiMapPin, FiInstagram, FiFacebook, FiMessageCircle } from 'react-icons/fi'
import { useContactSettings } from '@/hooks/useContactSettings'

export function Footer() {
  const { settings, getPrimaryPhone, getPrimaryEmail } = useContactSettings()
  
  const primaryPhone = getPrimaryPhone()
  const primaryEmail = getPrimaryEmail()
  
  return (
    <footer className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Image
                src="/assets/logo.webp"
                alt="Tramboory"
                width={180}
                height={60}
                className="h-14 w-auto"
              />
            </div>
            <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
              {settings?.tagline || 'El mejor salón de fiestas infantiles en Zapopan. Creamos experiencias mágicas que harán que la celebración de tu hijo sea perfecta en cada detalle.'}
            </p>
            <div className="flex space-x-4">
              {settings?.socialMedia?.instagram && (
                <a
                  href={settings.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors duration-300"
                >
                  <FiInstagram className="w-5 h-5" />
                </a>
              )}
              {settings?.socialMedia?.facebook && (
                <a
                  href={settings.socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors duration-300"
                >
                  <FiFacebook className="w-5 h-5" />
                </a>
              )}
              {settings?.whatsapp?.enabled && settings.whatsapp.number && (
                <a
                  href={`https://wa.me/${settings.whatsapp.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors duration-300"
                >
                  <FiMessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contacto</h3>
            <div className="space-y-3">
              {primaryPhone && (
                <div className="flex items-center space-x-3">
                  <FiPhone className="w-5 h-5 text-yellow-400" />
                  <a href={`tel:${primaryPhone.number.replace(/\s/g, '')}`} className="text-gray-300 hover:text-white transition-colors">
                    {primaryPhone.number}
                  </a>
                </div>
              )}
              {primaryEmail && (
                <div className="flex items-center space-x-3">
                  <FiMail className="w-5 h-5 text-yellow-400" />
                  <a href={`mailto:${primaryEmail.email}`} className="text-gray-300 hover:text-white transition-colors">
                    {primaryEmail.email}
                  </a>
                </div>
              )}
              {settings?.address && (
                <div className="flex items-start space-x-3">
                  <FiMapPin className="w-5 h-5 text-yellow-400 mt-1" />
                  <div className="text-gray-300">
                    <p>{settings.address.street}</p>
                    {settings.address.neighborhood && <p>{settings.address.neighborhood}</p>}
                    <p>{settings.address.city}, {settings.address.state}</p>
                    <p>C.P. {settings.address.zipCode}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Enlaces</h3>
            <div className="space-y-2">
              <Link href="/servicios" className="block text-gray-300 hover:text-white transition-colors">
                Servicios
              </Link>
              <Link href="/paquetes" className="block text-gray-300 hover:text-white transition-colors">
                Paquetes
              </Link>
              <Link href="/galeria" className="block text-gray-300 hover:text-white transition-colors">
                Galería
              </Link>
              <Link href="/contacto" className="block text-gray-300 hover:text-white transition-colors">
                Contacto
              </Link>
              <Link href="/reservas" className="block text-yellow-400 hover:text-yellow-300 transition-colors font-semibold">
                Reservar Ahora
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Tramboory. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacidad" className="text-gray-400 hover:text-white text-sm transition-colors">
              Política de Privacidad
            </Link>
            <Link href="/terminos" className="text-gray-400 hover:text-white text-sm transition-colors">
              Términos y Condiciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}