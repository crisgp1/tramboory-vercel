'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FiPhone, FiMapPin, FiClock, FiMessageCircle, FiExternalLink } from 'react-icons/fi'
import { GiPartyPopper } from 'react-icons/gi'
import { FaWhatsapp } from 'react-icons/fa'
import { useContactSettings } from '@/hooks/useContactSettings'

export function ContactPage() {
  const { settings, loading, getWhatsAppUrl, getPrimaryPhone, getFormattedSchedules } = useContactSettings()

  const handleWhatsApp = () => {
    const url = getWhatsAppUrl()
    if (url) {
      window.open(url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de contacto...</p>
        </div>
      </div>
    )
  }

  const primaryPhone = getPrimaryPhone()
  const schedules = getFormattedSchedules()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent mb-4" style={{ fontFamily: 'Funhouse, sans-serif' }}>
              ¡Hablemos de tu Fiesta!
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Estamos aquí para hacer realidad la celebración de tus sueños. Contáctanos por WhatsApp o visítanos en nuestro salón.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* WhatsApp CTA */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white">
              <FaWhatsapp className="w-16 h-16 mb-4" />
              <h2 className="text-3xl font-bold mb-4">
                Contáctanos por WhatsApp
              </h2>
              <p className="text-green-50 mb-6">
                La forma más rápida y fácil de comunicarte con nosotros. Te responderemos de inmediato para planear tu evento perfecto.
              </p>
            </div>
            
            <div className="p-8">
              <button
                onClick={handleWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <FaWhatsapp className="w-6 h-6" />
                Iniciar Conversación en WhatsApp
              </button>
              
              {primaryPhone && (
                <div className="mt-6 text-center text-gray-600">
                  <p className="font-semibold mb-2">También puedes llamarnos:</p>
                  <a href={`tel:${primaryPhone.number.replace(/\s/g, '')}`} className="text-2xl font-bold text-purple-600 hover:text-purple-700 transition-colors">
                    {primaryPhone.number}
                  </a>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiClock className="w-5 h-5 text-purple-600" />
                  Horarios de Atención
                </h3>
                <div className="space-y-2 text-gray-600">
                  {schedules.map((schedule) => (
                    <p key={schedule.day}>
                      {schedule.dayLabel}: {schedule.timeRange}
                      {schedule.notes && ` - ${schedule.notes}`}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Location Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FiMapPin className="w-8 h-8 text-purple-600" />
                Visítanos
              </h2>
              
              <div className="space-y-4 mb-6">
                {settings?.address && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Dirección:</h3>
                    <p className="text-gray-600">
                      {settings.address.street}<br />
                      {settings.address.neighborhood}<br />
                      {settings.address.zipCode} {settings.address.city}, {settings.address.state}
                    </p>
                  </div>
                )}

                {settings?.address?.references && settings.address.references.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Referencias:</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {settings.address.references.map((reference, index) => (
                        <li key={index}>{reference}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {settings?.maps?.googleMaps && (
                <a
                  href={settings.maps.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 mb-4"
                >
                  <FiExternalLink className="w-5 h-5" />
                  Ver en Google Maps
                </a>
              )}

              {settings?.maps?.waze && (
                <a
                  href={settings.maps.waze}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
                >
                  <FiExternalLink className="w-5 h-5" />
                  Abrir en Waze
                </a>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 text-center">
              <GiPartyPopper className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Te Esperamos!
              </h3>
              <p className="text-gray-700">
                Ven a conocer nuestras instalaciones y descubre por qué somos el lugar favorito para las fiestas más divertidas de Zapopan.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Google Maps Embed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Nuestra Ubicación
            </h3>
            <div className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3732.5438!2d-103.4280!3d20.6883!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8428ae048b81377b%3A0x1ad7b0c4d8b786e7!2sP.%C2%BA%20Solares%201639%2C%20Solares%20Residencial%2C%2045019%20Zapopan%2C%20Jal.!5e0!3m2!1sen!2smx!4v1702434711981!5m2!1sen!2smx"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              />
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-purple-50 rounded-lg p-4">
                <FiMapPin className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-semibold text-gray-900">Fácil Acceso</p>
                <p className="text-xs text-gray-600">Ubicación céntrica</p>
              </div>
              
              <div className="bg-pink-50 rounded-lg p-4">
                <FiMessageCircle className="w-8 h-8 mx-auto mb-2 text-pink-600" />
                <p className="text-sm font-semibold text-gray-900">Respuesta Rápida</p>
                <p className="text-xs text-gray-600">Te contestamos al instante</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <GiPartyPopper className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-semibold text-gray-900">Visitas Guiadas</p>
                <p className="text-xs text-gray-600">Conoce nuestro salón</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}