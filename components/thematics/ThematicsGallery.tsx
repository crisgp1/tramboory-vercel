'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { FiX, FiChevronLeft, FiChevronRight, FiEye, FiImage } from 'react-icons/fi'
import { GiPartyPopper, GiBalloons, GiCakeSlice, GiSparkles } from 'react-icons/gi'
import type { Thematic } from '@/types/thematic'

export function ThematicsGallery() {
  const [thematics, setThematics] = useState<Thematic[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedThematic, setSelectedThematic] = useState<Thematic | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    const fetchThematics = async () => {
      try {
        const response = await fetch('/api/thematics')
        if (response.ok) {
          const data = await response.json()
          setThematics(data)
        }
      } catch (error) {
        console.error('Error fetching thematics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchThematics()
  }, [])

  const handlePrevious = () => {
    if (!selectedThematic) return
    const totalImages = [selectedThematic.coverImage, ...(selectedThematic.images || [])].length
    setSelectedImageIndex(prev => prev > 0 ? prev - 1 : totalImages - 1)
  }

  const handleNext = () => {
    if (!selectedThematic) return
    const totalImages = [selectedThematic.coverImage, ...(selectedThematic.images || [])].length
    setSelectedImageIndex(prev => prev < totalImages - 1 ? prev + 1 : 0)
  }

  const getCurrentImage = () => {
    if (!selectedThematic) return null
    const allImages = [selectedThematic.coverImage, ...(selectedThematic.images || [])]
    return allImages[selectedImageIndex]
  }

  const openLightbox = (thematic: Thematic, imageIndex: number = 0) => {
    setSelectedThematic(thematic)
    setSelectedImageIndex(imageIndex)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setSelectedThematic(null)
    setSelectedImageIndex(0)
    document.body.style.overflow = 'unset'
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-white/30 border-t-white"
            />
            <p className="text-xl text-white/90 font-medium">Cargando temáticas mágicas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (thematics.length === 0) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center"
            >
              <GiSparkles className="w-12 h-12 text-white/70" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-4">¡Próximamente!</h3>
            <p className="text-lg text-white/80 leading-relaxed">
              Estamos preparando increíbles temáticas para hacer de tu fiesta un momento único e inolvidable.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", duration: 0.6 }}
              className="inline-flex items-center gap-3 px-6 py-3 mb-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
            >
              <GiPartyPopper className="w-6 h-6 text-yellow-300" />
              <span className="text-white font-semibold text-lg">Temáticas Especiales</span>
              <GiSparkles className="w-6 h-6 text-pink-300" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Temáticas que
              <span className="block bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Despiertan Sueños
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto">
              Cada temática es un mundo de posibilidades donde los sueños cobran vida y las sonrisas nunca terminan
            </p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex items-center justify-center gap-6 text-white/80"
            >
              <div className="flex items-center gap-2">
                <GiBalloons className="w-6 h-6 text-pink-300" />
                <span className="font-medium">Personalizadas</span>
              </div>
              <div className="w-1 h-1 bg-white/50 rounded-full" />
              <div className="flex items-center gap-2">
                <GiCakeSlice className="w-6 h-6 text-yellow-300" />
                <span className="font-medium">Únicas</span>
              </div>
              <div className="w-1 h-1 bg-white/50 rounded-full" />
              <div className="flex items-center gap-2">
                <GiSparkles className="w-6 h-6 text-blue-300" />
                <span className="font-medium">Inolvidables</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Thematics Grid */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr"
          >
            {thematics.map((thematic, index) => (
              <motion.div
                key={thematic._id || index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
                onClick={() => openLightbox(thematic)}
              >
                <div className="relative rounded-3xl overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-500 h-full">
                  {/* Image Container */}
                  <div className="relative h-64 md:h-72 overflow-hidden">
                    <Image
                      src={thematic.coverImage.url}
                      alt={thematic.coverImage.alt || thematic.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                    
                    {/* Photo count badge */}
                    {thematic.images && thematic.images.length > 0 && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-semibold">
                        <FiImage className="w-4 h-4" />
                        <span>{thematic.images.length + 1}</span>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-md text-white font-semibold">
                        <FiEye className="w-5 h-5" />
                        <span>Ver Galería</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors duration-300">
                      {thematic.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed line-clamp-3">
                      {thematic.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500 font-medium">
                        {thematic.images?.length ? `${thematic.images.length + 1} fotos` : '1 foto'}
                      </div>
                      <div className="flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all duration-300">
                        <span>Explorar</span>
                        <FiChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedThematic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>

            {/* Navigation */}
            {(() => {
              const totalImages = [selectedThematic.coverImage, ...(selectedThematic.images || [])].length
              return totalImages > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                  >
                    <FiChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                  >
                    <FiChevronRight className="w-6 h-6" />
                  </button>
                </>
              )
            })()}

            {/* Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl max-h-[90vh] w-full h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="relative flex-1 rounded-lg overflow-hidden mb-6">
                {(() => {
                  const currentImage = getCurrentImage()
                  return currentImage && (
                    <Image
                      src={currentImage.url}
                      alt={currentImage.alt || selectedThematic.title}
                      fill
                      className="object-contain"
                    />
                  )
                })()}
              </div>

              {/* Info */}
              <div className="text-center text-white">
                <h3 className="text-2xl font-bold mb-2">{selectedThematic.title}</h3>
                <p className="text-white/80 max-w-2xl mx-auto">{selectedThematic.description}</p>
                {(() => {
                  const totalImages = [selectedThematic.coverImage, ...(selectedThematic.images || [])].length
                  return totalImages > 1 && (
                    <p className="text-sm text-white/60 mt-4">
                      {selectedImageIndex + 1} de {totalImages}
                    </p>
                  )
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}