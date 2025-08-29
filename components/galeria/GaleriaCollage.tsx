'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { FiX, FiChevronLeft, FiChevronRight, FiPlay, FiPause, FiMaximize } from 'react-icons/fi'
import { GiPartyPopper, GiBalloons, GiCakeSlice } from 'react-icons/gi'

interface GalleryItem {
  _id: string
  title: string
  description: string
  type: 'image' | 'video'
  src: string
  alt: string
  category: 'superheroes' | 'princesas' | 'tematica' | 'deportes' | 'cumpleanos' | 'otros'
  aspectRatio: 'portrait' | 'landscape' | 'square'
  featured: boolean
  active: boolean
  order: number
}

const categoryLabels = {
  superheroes: 'Superhéroes',
  princesas: 'Princesas',
  tematica: 'Temática',
  deportes: 'Deportes',
  cumpleanos: 'Cumpleaños',
  otros: 'Otros'
}

const categories = [
  { id: 'todas', name: 'Todas', icon: GiPartyPopper, color: 'from-purple-500 to-purple-700' },
  { id: 'superheroes', name: 'Superhéroes', icon: GiPartyPopper, color: 'from-blue-500 to-blue-700' },
  { id: 'princesas', name: 'Princesas', icon: GiBalloons, color: 'from-pink-500 to-pink-700' },
  { id: 'tematica', name: 'Temática', icon: GiCakeSlice, color: 'from-pink-500 to-pink-700' },
  { id: 'deportes', name: 'Deportes', icon: GiPartyPopper, color: 'from-yellow-500 to-yellow-700' },
  { id: 'cumpleanos', name: 'Cumpleaños', icon: GiBalloons, color: 'from-red-500 to-red-700' },
  { id: 'otros', name: 'Otros', icon: GiCakeSlice, color: 'from-green-500 to-green-700' }
]

export function GaleriaCollage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('todas')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Cargar items de la API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/gallery')
        if (response.ok) {
          const data = await response.json()
          setItems(data)
        }
      } catch (error) {
        console.error('Error fetching gallery items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  // Filtrar items por categoría
  const filteredItems = selectedCategory === 'todas' 
    ? items 
    : items.filter(item => item.category === selectedCategory)

  // Navegación en el lightbox
  const handlePrevious = () => {
    if (!selectedItem) return
    const currentIndex = filteredItems.findIndex(item => item._id === selectedItem)
    const newIndex = currentIndex > 0 ? currentIndex - 1 : filteredItems.length - 1
    setSelectedItem(filteredItems[newIndex]._id)
    setIsPlaying(false)
  }

  const handleNext = () => {
    if (!selectedItem) return
    const currentIndex = filteredItems.findIndex(item => item._id === selectedItem)
    const newIndex = currentIndex < filteredItems.length - 1 ? currentIndex + 1 : 0
    setSelectedItem(filteredItems[newIndex]._id)
    setIsPlaying(false)
  }

  const currentItem = selectedItem ? filteredItems.find(item => item._id === selectedItem) : null

  const getGridItemClass = (index: number, aspectRatio: string) => {
    // Crear un patrón aesthetic irregular para el collage
    if (index % 7 === 0) return 'md:col-span-2 md:row-span-2' // Cada 7mo item es grande
    if (index % 5 === 0) return 'md:col-span-1 md:row-span-2' // Cada 5to es vertical
    if (index % 3 === 0) return 'md:col-span-2 md:row-span-1' // Cada 3ro es horizontal
    if (aspectRatio === 'portrait') return 'md:col-span-1 md:row-span-2'
    if (aspectRatio === 'landscape') return 'md:col-span-2 md:row-span-1'
    return 'md:col-span-1 md:row-span-1'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando galería...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent mb-4">
              Galería Mágica
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explora momentos mágicos y fiestas épicas capturadas en nuestra colección de fotos y videos
            </p>
          </motion.div>

          {/* Filtros de categorías */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg transform scale-105`
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              )
            })}
          </motion.div>
        </div>
      </div>

      {/* Grid de galería */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <GiPartyPopper className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                No hay contenido en esta categoría
              </h3>
              <p className="text-gray-500">
                Pronto agregaremos más fotos y videos increíbles
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]"
            >
              <AnimatePresence>
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`relative group cursor-pointer rounded-xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-300 ${getGridItemClass(index, item.aspectRatio)}`}
                    onClick={() => setSelectedItem(item._id)}
                  >
                    <div className="absolute inset-0">
                      {item.type === 'video' ? (
                        <video
                          src={item.src}
                          className="w-full h-full object-cover"
                          muted
                          loop
                        />
                      ) : (
                        <Image
                          src={item.src}
                          alt={item.alt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      )}
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm leading-tight">{item.title}</h3>
                        {item.type === 'video' && (
                          <FiPlay className="w-5 h-5 opacity-80" />
                        )}
                      </div>
                      <p className="text-xs text-gray-200 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {item.featured && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
                          ⭐ Destacado
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {currentItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-6xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute -top-12 right-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
              >
                <FiX className="w-6 h-6" />
              </button>

              <div className="relative bg-black rounded-lg overflow-hidden max-h-[80vh] max-w-full">
                {currentItem.type === 'video' ? (
                  <video
                    src={currentItem.src}
                    className="max-w-full max-h-full"
                    controls
                    autoPlay={isPlaying}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                ) : (
                  <Image
                    src={currentItem.src}
                    alt={currentItem.alt}
                    width={800}
                    height={600}
                    className="max-w-full max-h-full object-contain"
                    priority
                  />
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {currentItem.title}
                  </h2>
                  <p className="text-gray-300 mb-4">
                    {currentItem.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {categoryLabels[currentItem.category]}
                    </span>
                    <span className="capitalize">
                      {currentItem.type === 'video' ? 'Video' : 'Imagen'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePrevious}
                className="absolute top-1/2 -translate-y-1/2 -left-16 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={handleNext}
                className="absolute top-1/2 -translate-y-1/2 -right-16 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <FiChevronRight className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}