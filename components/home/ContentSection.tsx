'use client'

import { motion } from 'framer-motion'
import { InfiniteCarousel } from './InfiniteCarousel'

export function ContentSection() {
  return (
    <section id="content" className="py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50">
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
            <span className="font-funhouse bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-800">
              Tramboory
            </span>
            ?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Somos los expertos en fiestas infantiles más divertidos de Zapopan. 
            ¡Tu peque y sus amigos van a alucinar! 🚀
          </p>
        </motion.div>

        {/* Carousel infinito con videos y fotos */}
        <InfiniteCarousel />

      </div>
    </section>
  )
}