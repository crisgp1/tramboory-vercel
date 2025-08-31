'use client'

import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { motion } from 'framer-motion'
import { FiHeart, FiShield, FiGift, FiCamera, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { GiPartyPopper, GiBalloons } from 'react-icons/gi'
import { useCarousel } from '@/hooks/useCarousel'
import { CarouselCard } from '@/types/carousel'
import Image from 'next/image'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'

// Registrar plugin de Draggable
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable)
}

// Mapeo de iconos - puedes extender esto
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'GiPartyPopper': GiPartyPopper,
  'FiShield': FiShield,
  'GiBalloons': GiBalloons,
  'FiCamera': FiCamera,
  'FiHeart': FiHeart,
  'FiGift': FiGift,
}

interface CarouselCardProps {
  card: CarouselCard
  isActive: boolean
}

function CarouselCardComponent({ card, isActive }: CarouselCardProps) {
  const IconComponent = iconMap[card.icon] || GiPartyPopper

  return (
    <div className="carousel-card relative flex-shrink-0 w-[calc(100vw-3rem)] sm:w-80 lg:w-80 h-80 sm:h-96 mx-3 sm:mx-3 group max-w-sm sm:max-w-none">
      {/* SUPER GLITTER alrededor de la tarjeta */}
      <div className="absolute -inset-6 opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10">
        {/* Glitters GRANDES en las esquinas */}
        <div className="absolute -top-3 -left-3 text-2xl animate-pulse drop-shadow-[0_0_20px_rgba(251,191,36,1)]">✨</div>
        <div className="absolute -top-3 -right-3 text-2xl animate-bounce drop-shadow-[0_0_20px_rgba(244,114,182,1)]" style={{animationDelay: '0.2s'}}>⭐</div>
        <div className="absolute -bottom-3 -left-3 text-2xl animate-pulse drop-shadow-[0_0_20px_rgba(96,165,250,1)]" style={{animationDelay: '0.4s'}}>✨</div>
        <div className="absolute -bottom-3 -right-3 text-2xl animate-bounce drop-shadow-[0_0_20px_rgba(196,181,253,1)]" style={{animationDelay: '0.6s'}}>⭐</div>
        
        {/* Glitters BRILLANTES en los lados */}
        <div className="absolute top-1/2 -left-4 text-xl animate-ping drop-shadow-[0_0_15px_rgba(74,222,128,1)]" style={{animationDelay: '0.3s'}}>💫</div>
        <div className="absolute top-1/2 -right-4 text-xl animate-ping drop-shadow-[0_0_15px_rgba(251,146,60,1)]" style={{animationDelay: '0.5s'}}>💫</div>
        <div className="absolute -top-4 left-1/2 text-xl animate-bounce drop-shadow-[0_0_15px_rgba(34,211,238,1)]" style={{animationDelay: '0.7s'}}>✨</div>
        <div className="absolute -bottom-4 left-1/2 text-xl animate-pulse drop-shadow-[0_0_15px_rgba(251,113,133,1)]" style={{animationDelay: '0.9s'}}>⭐</div>
        
        {/* Más glitters COLORIDOS intermedios */}
        <div className="absolute top-1/4 -left-3.5 text-lg animate-pulse drop-shadow-[0_0_12px_rgba(129,140,248,1)]" style={{animationDelay: '0.1s'}}>🌟</div>
        <div className="absolute top-1/4 -right-3.5 text-lg animate-bounce drop-shadow-[0_0_12px_rgba(251,191,36,1)]" style={{animationDelay: '0.8s'}}>💖</div>
        <div className="absolute top-3/4 -left-3.5 text-lg animate-ping drop-shadow-[0_0_12px_rgba(45,212,191,1)]" style={{animationDelay: '1s'}}>🎉</div>
        <div className="absolute top-3/4 -right-3.5 text-lg animate-pulse drop-shadow-[0_0_12px_rgba(232,121,249,1)]" style={{animationDelay: '1.2s'}}>🎊</div>
        
        {/* Puntos brillantes adicionales */}
        <div className="absolute top-1/3 -left-4 w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(251,191,36,1)]"></div>
        <div className="absolute top-2/3 -right-4 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce shadow-[0_0_20px_rgba(147,51,234,1)]" style={{animationDelay: '0.3s'}}></div>
        <div className="absolute -top-5 left-1/3 w-2 h-2 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full animate-ping shadow-[0_0_20px_rgba(74,222,128,1)]" style={{animationDelay: '0.6s'}}></div>
        <div className="absolute -bottom-5 right-1/3 w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(251,146,60,1)]" style={{animationDelay: '0.9s'}}></div>
      </div>

      <motion.div
        className="relative h-full rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 hover:-translate-y-2"
        initial={{ scale: 1, opacity: 1 }}
        whileHover={{ 
          scale: 1.08,
          y: -8,
          rotateY: 5,
          rotateZ: Math.random() * 4 - 2
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Background Media */}
        <div className="absolute inset-0">
          {card.backgroundMedia.type === 'video' && card.backgroundMedia.url ? (
            <div className="relative w-full h-full">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={card.backgroundMedia.url} type="video/mp4" />
                <source src={card.backgroundMedia.url} type="video/webm" />
              </video>
              {card.backgroundMedia.fallbackImage && (
                <Image
                  src={card.backgroundMedia.fallbackImage}
                  alt={card.backgroundMedia.alt || card.title}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          ) : card.backgroundMedia.type === 'image' && card.backgroundMedia.url ? (
            <Image
              src={card.backgroundMedia.url}
              alt={card.backgroundMedia.alt || card.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${card.gradientColors}`} />
          )}
          
          {/* Overlay para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 h-full p-8 flex flex-col justify-between text-white">
          {/* Icono y badge superior */}
          <div className="flex justify-between items-start">
            <div className={`w-16 h-16 bg-gradient-to-br ${card.gradientColors} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            
            {card.backgroundMedia.type === 'video' && (
              <div className="bg-red-500/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold">
                VIDEO
              </div>
            )}
            {card.backgroundMedia.type === 'image' && (
              <div className="bg-blue-500/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold">
                IMAGEN
              </div>
            )}
          </div>

          {/* Contenido principal */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 drop-shadow-lg">
              {card.title} {card.emoji}
            </h3>
            <p className="text-lg leading-relaxed drop-shadow-md opacity-90">
              {card.description}
            </p>
          </div>


          {/* Super Shimmer effect con arcoíris */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-pink-400/20 via-purple-400/20 via-blue-400/20 to-transparent animate-shimmer" style={{animationDelay: '0.5s'}}></div>
          </div>

          {/* Marco brillante */}
          <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500">
            <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-border animate-pulse"></div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function InfiniteCarousel() {
  const { cards, loading, error } = useCarousel()
  const [isAutoplay, setIsAutoplay] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const draggableRef = useRef<Draggable | null>(null)
  
  // Detectar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    // Set initial width
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Multiplicar tarjetas para scroll verdaderamente infinito
  const repeatedCards = cards.length > 0 ? Array(30).fill(cards).flat() : []
  
  // Calcular ancho responsive de las tarjetas basado en windowWidth
  const cardWidth = windowWidth > 0 
    ? (windowWidth < 640 
        ? windowWidth - 24  // Una tarjeta por vista en móvil (full width - margins)
        : 336)              // Desktop normal (w-80 + margins)
    : 336 // Fallback para SSR
    
  const totalWidth = cards.length * cardWidth

  // Inicializar GSAP Timeline y Draggable
  useLayoutEffect(() => {
    if (cards.length === 0 || !carouselRef.current || windowWidth === 0) return

    const carousel = carouselRef.current
    
    // Posicionar al inicio en el medio del array
    gsap.set(carousel, { x: -totalWidth * 10 })

    // Timeline infinito para auto-scroll
    timelineRef.current = gsap.timeline({ 
      repeat: -1, 
      paused: false,
      ease: "none"
    })
    
    timelineRef.current.to(carousel, {
      duration: totalWidth / 15, // Velocidad basada en el ancho total
      x: -totalWidth * 11,
      ease: "none",
      onComplete: () => {
        // Reset position sin transición
        gsap.set(carousel, { x: -totalWidth * 10 })
      }
    })

    // Configurar Draggable para touch/mouse
    draggableRef.current = Draggable.create(carousel, {
      type: "x",
      inertia: true,
      edgeResistance: 0.85,
      bounds: { minX: -totalWidth * 15, maxX: -totalWidth * 5 },
      dragClickables: false, // Prevenir interferencia con clicks en tarjetas
      
      onDragStart: () => {
        setIsDragging(true)
        setIsAutoplay(false)
        if (timelineRef.current) {
          timelineRef.current.pause()
        }
        
        // Feedback táctil ligero
        gsap.to(carousel, {
          duration: 0.1,
          scale: 0.98,
          ease: "power2.out"
        })
      },
      
      onDrag: function() {
        // Efecto rubber band progresivo
        const progress = Math.abs(this.x) / (totalWidth * 10)
        const resistance = gsap.utils.clamp(0.5, 1, 1 - (progress * 0.5))
        
        // Aplicar resistencia visual
        gsap.set(carousel, {
          scaleX: resistance,
          transformOrigin: this.x > 0 ? "right center" : "left center"
        })
        
        // Vibración sutil en los extremos (solo en dispositivos móviles)
        if (progress > 1.2 && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(10)
        }
      },
      
      onDragEnd: function() {
        setIsDragging(false)
        
        // Restaurar escala normal
        gsap.to(carousel, {
          duration: 0.3,
          scale: 1,
          scaleX: 1,
          ease: "back.out(1.7)"
        })
        
        // Usar el endX del InertiaPlugin para calcular la posición final
        const currentX = this.x
        const endX = this.endX || currentX // endX viene del InertiaPlugin
        let targetCard = Math.round(Math.abs(currentX) / cardWidth)
        
        // Si hay movimiento inercial, ajustar basado en la dirección
        const deltaX = endX - currentX
        if (Math.abs(deltaX) > 50) {
          if (deltaX < 0) targetCard += 1 // Hacia la izquierda
          if (deltaX > 0) targetCard -= 1 // Hacia la derecha
        }
        
        const snapX = -targetCard * cardWidth
        
        gsap.to(carousel, {
          duration: 0.5,
          x: snapX,
          ease: "power3.out",
          onComplete: () => {
            // Reanudar autoplay después de 2.5 segundos
            setTimeout(() => {
              setIsAutoplay(true)
            }, 2500)
          }
        })
      },
      
      onRelease: function() {
        // Pequeño efecto de liberación
        gsap.to(carousel, {
          duration: 0.2,
          scale: 1.02,
          ease: "power2.out",
          yoyo: true,
          repeat: 1
        })
      },
      
      onClick: function(e) {
        // Prevenir clicks accidentales durante drag
        if (Math.abs(this.deltaX) > 5) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
    })[0]

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
      if (draggableRef.current) {
        draggableRef.current.kill()
      }
    }
  }, [cards.length, totalWidth, windowWidth, cardWidth])

  // Controlar autoplay
  useEffect(() => {
    if (timelineRef.current) {
      if (isAutoplay && !isDragging) {
        timelineRef.current.resume()
      } else {
        timelineRef.current.pause()
      }
    }
  }, [isAutoplay, isDragging])

  const goToNext = () => {
    if (!carouselRef.current) return
    
    setIsAutoplay(false)
    if (timelineRef.current) {
      timelineRef.current.pause()
    }
    
    const currentX = gsap.getProperty(carouselRef.current, "x") as number
    gsap.to(carouselRef.current, {
      duration: 0.6,
      x: currentX - cardWidth,
      ease: "back.out(1.7)",
      onComplete: () => {
        setTimeout(() => setIsAutoplay(true), 2000)
      }
    })
  }

  const goToPrev = () => {
    if (!carouselRef.current) return
    
    setIsAutoplay(false)
    if (timelineRef.current) {
      timelineRef.current.pause()
    }
    
    const currentX = gsap.getProperty(carouselRef.current, "x") as number
    gsap.to(carouselRef.current, {
      duration: 0.6,
      x: currentX + cardWidth,
      ease: "back.out(1.7)",
      onComplete: () => {
        setTimeout(() => setIsAutoplay(true), 2000)
      }
    })
  }

  const pauseAutoplay = () => {
    setIsAutoplay(false)
    if (timelineRef.current) {
      timelineRef.current.pause()
    }
  }

  const resumeAutoplay = () => {
    setTimeout(() => setIsAutoplay(true), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error || cards.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No hay tarjetas disponibles en el carousel</p>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden py-16 bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Efectos difuminados tipo nube - MUCHO más sutil */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 lg:w-20 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 lg:w-20 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
      
      {/* Capa de transición suave - Solo para los bordes */}
      <div className="absolute left-0 top-0 bottom-0 w-32 sm:w-40 lg:w-36 bg-gradient-to-r from-white/60 via-white/30 to-transparent z-[5] pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 sm:w-40 lg:w-36 bg-gradient-to-l from-white/60 via-white/30 to-transparent z-[5] pointer-events-none"></div>

      {/* Controles */}
      <div className="absolute top-1/2 left-8 z-20 transform -translate-y-1/2">
        <button
          onClick={goToPrev}
          className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-lg border border-white/50 flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-purple-200/50"
        >
          <FiChevronLeft className="w-7 h-7" />
        </button>
      </div>
      
      <div className="absolute top-1/2 right-8 z-20 transform -translate-y-1/2">
        <button
          onClick={goToNext}
          className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-lg border border-white/50 flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-purple-200/50"
        >
          <FiChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* Carousel */}
      <div className="flex items-center justify-center">
        <div
          ref={carouselRef}
          className={`flex items-center will-change-transform ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            // GSAP controla el transform
            touchAction: 'pan-y pinch-zoom' // Permitir scroll vertical y zoom
          }}
          onMouseEnter={pauseAutoplay}
          onMouseLeave={resumeAutoplay}
        >
          {repeatedCards.map((card, index) => (
            <CarouselCardComponent
              key={`${card.id}-${index}`}
              card={card}
              isActive={true} // Todas las tarjetas activas para scroll infinito
            />
          ))}
        </div>
      </div>

      {/* Indicadores mejorados */}
      <div className="flex justify-center mt-12 space-x-3">
        {cards.map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full bg-purple-300 opacity-60 animate-pulse"
            style={{
              animationDelay: `${index * 0.2}s`
            }}
          />
        ))}
      </div>

      {/* Indicador de estado */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center space-x-2 text-gray-500 text-sm">
          {isDragging ? (
            <>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-600 font-medium">Arrastrando...</span>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            </>
          ) : isAutoplay ? (
            <>
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
              <span>Scroll automático infinito • Arrastra para controlar</span>
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-orange-600">Pausado • Reanudando pronto...</span>
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}