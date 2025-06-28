'use client'

import { motion } from 'framer-motion'
import { FiHeart, FiUsers, FiGift, FiCamera } from 'react-icons/fi'

const features = [
  {
    icon: FiHeart,
    title: 'Experiencias Únicas',
    description: 'Cada fiesta es diseñada especialmente para hacer de este día algo inolvidable para tu pequeño.'
  },
  {
    icon: FiUsers,
    title: 'Espacios Seguros',
    description: 'Instalaciones completamente seguras y adaptadas para que los niños jueguen y se diviertan sin preocupaciones.'
  },
  {
    icon: FiGift,
    title: 'Paquetes Completos',
    description: 'Todo incluido: decoración, animación, comida y entretenimiento para que solo te preocupes por disfrutar.'
  },
  {
    icon: FiCamera,
    title: 'Momentos Memorables',
    description: 'Capturamos cada sonrisa y momento especial para que tengas recuerdos que durarán toda la vida.'
  }
]

export function ContentSection() {
  return (
    <section id="content" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ¿Por qué elegir{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-800">
              Tramboory
            </span>
            ?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Somos especialistas en crear momentos mágicos que harán que la celebración 
            de tu hijo sea perfecta en cada detalle.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-3xl p-8 md:p-12 text-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para la fiesta perfecta?
            </h3>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Contáctanos hoy mismo y comencemos a planear la celebración 
              que tu hijo siempre recordará.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="tel:+523312345678"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-8 py-4 bg-yellow-400 text-purple-900 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors duration-300"
              >
                Llámanos ahora
              </motion.a>
              <motion.a
                href="https://wa.me/523312345678"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-8 py-4 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300"
              >
                WhatsApp
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}