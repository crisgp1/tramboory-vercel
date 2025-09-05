'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FiHeart, FiShield, FiGift, FiCamera } from 'react-icons/fi'
import { GiPartyPopper, GiBalloons } from 'react-icons/gi'
import { useCarousel } from '@/hooks/useCarousel'
import { CarouselCard } from '@/types/carousel'
import Image from 'next/image'
import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/react-splide/css'

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
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window !== 'undefined' && cardRef.current) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = cardRef.current?.getBoundingClientRect()
        if (rect) {
          setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          })
        }
      }

      cardRef.current.addEventListener('mousemove', handleMouseMove)
      return () => cardRef.current?.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div ref={cardRef} className="carousel-card relative flex-shrink-0 w-[calc(100vw-3rem)] sm:w-80 lg:w-80 h-80 sm:h-96 mx-3 sm:mx-3 group max-w-sm sm:max-w-none p-4">

      <motion.div
        className="relative h-full rounded-3xl overflow-hidden transform"
        initial={{ scale: 1, opacity: 1 }}
        whileHover={{ 
          scale: 1.02,
          y: -4
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, 
            rgba(255, 255, 255, 0.1) 0%, 
            transparent 50%
          )`,
          boxShadow: `
            0 0 20px rgba(${Math.sin(mousePosition.x * 0.01) * 255}, ${Math.cos(mousePosition.y * 0.01) * 255}, 255, 0.3),
            inset 0 0 20px rgba(${Math.cos(mousePosition.x * 0.01) * 255}, ${Math.sin(mousePosition.y * 0.01) * 255}, 255, 0.2)
          `,
          border: '2px solid transparent',
          backgroundImage: `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0)), 
            linear-gradient(${Math.atan2(mousePosition.y - 200, mousePosition.x - 200) * 180 / Math.PI}deg, 
            #ff006e, #8338ec, #3a86ff, #06ffa5, #ffbe0b, #fb5607
          )`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'content-box, border-box'
        }}
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
            <div className={`w-16 h-16 bg-gradient-to-br ${card.gradientColors} rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
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


        </div>
      </motion.div>
    </div>
  )
}

export function InfiniteCarousel() {
  const { cards, loading, error } = useCarousel()

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
    <div className="relative w-full overflow-hidden py-8">
      <Splide
        options={{
          type: 'loop',
          perPage: 3,
          perMove: 1,
          autoplay: true,
          interval: 3000,
          pauseOnHover: true,
          pauseOnFocus: true,
          gap: '1rem',
          arrows: true,
          pagination: true,
          drag: 'free',
          snap: true,
          breakpoints: {
            640: {
              perPage: 1,
            },
            768: {
              perPage: 2,
            },
            1024: {
              perPage: 3,
            },
          },
        }}
      >
        {cards.map((card) => (
          <SplideSlide key={card.id}>
            <CarouselCardComponent
              card={card}
              isActive={true}
            />
          </SplideSlide>
        ))}
      </Splide>
    </div>
  )
}