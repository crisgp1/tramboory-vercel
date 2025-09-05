'use client'

import { useRef, useEffect } from 'react'
import { motion, useAnimation, useScroll, useTransform } from 'framer-motion'
import { FiCalendar, FiArrowDown, FiStar } from 'react-icons/fi'
import Link from 'next/link'
import { SignUpButton, useUser } from '@clerk/nextjs'
import { useHeroContent } from '@/hooks/useHeroContent'
import { Loader, Center, Stack, Text } from '@mantine/core'

// Mapeo de colores a gradientes
const overlayColors = {
  purple: 'from-purple-900/70 via-purple-800/70 to-indigo-900/70',
  blue: 'from-blue-900/70 via-blue-800/70 to-cyan-900/70',
  green: 'from-green-900/70 via-green-800/70 to-emerald-900/70',
  orange: 'from-orange-900/70 via-orange-800/70 to-red-900/70',
  pink: 'from-pink-900/70 via-pink-800/70 to-rose-900/70',
  teal: 'from-teal-900/70 via-teal-800/70 to-cyan-900/70',
  red: 'from-red-900/70 via-red-800/70 to-rose-900/70',
  indigo: 'from-indigo-900/70 via-indigo-800/70 to-blue-900/70'
}

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)
  const controls = useAnimation()
  const { scrollY } = useScroll()
  const { isSignedIn } = useUser()
  const { heroContent, loading, error } = useHeroContent()
  
  const yParallax = useTransform(scrollY, [0, 400], [0, -60])
  const opacityParallax = useTransform(scrollY, [0, 250], [1, 0])
  
  const scrollToContent = () => {
    const nextSection = document.querySelector('#content')
    nextSection?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    controls.start((i) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" }
    }))
  }, [controls])

  // Estados de carga y error
  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <Center>
          <Stack align="center" gap="md">
            <Loader size="lg" color="yellow" />
            <Text c="white">Cargando contenido...</Text>
          </Stack>
        </Center>
      </section>
    )
  }

  if (error || !heroContent) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <Center>
          <Stack align="center" gap="md">
            <Text c="red" size="lg">Error al cargar el contenido</Text>
            <Text c="white" size="sm">{error}</Text>
          </Stack>
        </Center>
      </section>
    )
  }

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Dynamic Background */}
      {heroContent.backgroundMedia.type === 'video' && heroContent.backgroundMedia.url && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={heroContent.backgroundMedia.url} type="video/webm" />
          <source src={heroContent.backgroundMedia.url} type="video/mp4" />
        </video>
      )}
      
      {heroContent.backgroundMedia.type === 'image' && heroContent.backgroundMedia.url && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${heroContent.backgroundMedia.url})` }}
        />
      )}
      
      {heroContent.backgroundMedia.type === 'gradient' && (
        <div className={`absolute inset-0 bg-gradient-to-br ${overlayColors[heroContent.backgroundMedia.overlayColor || 'purple'].replace('/70', '')}`} />
      )}
      
      {/* Dynamic Overlay gradient */}
      {(heroContent.backgroundMedia.type === 'video' || heroContent.backgroundMedia.type === 'image') && (
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${overlayColors[heroContent.backgroundMedia.overlayColor || 'purple']}`}
          style={{
            opacity: (heroContent.backgroundMedia.overlayOpacity || 70) / 100
          }}
        />
      )}
      
      {/* Optimized decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={controls}
          custom={0}
          className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-purple-600/10 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={controls}
          custom={1}
          className="absolute top-1/4 -left-16 w-40 h-40 bg-gradient-to-tr from-yellow-400/25 to-transparent rounded-full blur-2xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={controls}
          custom={2}
          className="absolute bottom-16 right-16 w-56 h-56 bg-gradient-to-tl from-purple-500/15 to-transparent rounded-full blur-2xl"
        />
      </div>
      
      {/* Main content */}
      <motion.div
        style={{ y: yParallax, opacity: opacityParallax }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-6 sm:px-6 pt-16 sm:pt-20 pb-20 sm:pb-28 text-center relative z-10 max-w-full"
      >
        <div className="max-w-4xl mx-auto">
          {/* Promoción especial (si está activa) */}
          {heroContent.promotion?.show && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 inline-block"
            >
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                bg-${heroContent.promotion.highlightColor}-500/25 
                text-${heroContent.promotion.highlightColor}-300 border border-${heroContent.promotion.highlightColor}-400/40 backdrop-blur-md
                hover:border-${heroContent.promotion.highlightColor}-400/60 transition-all duration-300`}>
                <FiStar className="w-4 h-4" />
                <span>🎉 {heroContent.promotion.text}</span>
              </span>
            </motion.div>
          )}
          
          {/* Main title */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.88] tracking-tight"
          >
            <span className="block text-center">{heroContent.mainTitle}</span>
            <span className="block relative inline-block max-w-full overflow-visible">
              {/* Glitter exterior para Tramboory - Solo si está habilitado */}
              {heroContent.showGlitter && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute -top-4 -left-8 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="absolute -top-6 left-12 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute -top-2 left-32 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                  <div className="absolute -top-8 left-48 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                  <div className="absolute -top-3 -right-6 w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
                  <div className="absolute -top-7 -right-12 w-2 h-2 bg-orange-400 rounded-full animate-ping" style={{animationDelay: '0.3s'}}></div>
                  
                  <div className="absolute top-4 -left-6 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.8s'}}></div>
                  <div className="absolute top-8 left-8 w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '1.3s'}}></div>
                  <div className="absolute top-6 left-28 w-1 h-1 bg-indigo-400 rounded-full animate-ping" style={{animationDelay: '0.6s'}}></div>
                  <div className="absolute top-2 left-44 w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '1.8s'}}></div>
                  <div className="absolute top-8 -right-4 w-1 h-1 bg-rose-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="absolute top-4 -right-10 w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping" style={{animationDelay: '1.1s'}}></div>
                  
                  <div className="absolute bottom-2 -left-4 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <div className="absolute bottom-6 left-16 w-1 h-1 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '1.6s'}}></div>
                  <div className="absolute bottom-1 left-36 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.9s'}}></div>
                  <div className="absolute bottom-4 -right-2 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1.4s'}}></div>
                  <div className="absolute bottom-7 -right-8 w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.7s'}}></div>
                </div>
              )}
              
              <span className="font-funhouse bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 relative z-10 text-5xl sm:text-7xl md:text-8xl lg:text-8xl inline-block max-w-full break-words">
                {heroContent.brandTitle}
              </span>
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {heroContent.subtitle}
          </motion.p>
          
          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              {heroContent.primaryButton.action === 'signup' ? (
                isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="relative inline-flex items-center px-8 sm:px-10 py-4 sm:py-5 
                      bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400
                      text-purple-900 rounded-2xl font-black text-lg sm:text-xl shadow-2xl
                      hover:from-yellow-300 hover:via-yellow-400 hover:to-orange-300 
                      hover:shadow-yellow-400/40 transform hover:-translate-y-1
                      transition-all duration-300 group w-full sm:w-auto justify-center
                      border-2 border-yellow-300/50 backdrop-blur-sm
                      before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r 
                      before:from-yellow-200/20 before:to-orange-200/20 before:blur-xl before:-z-10"
                  >
                    <FiCalendar className="w-6 h-6 mr-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                    <span className="tracking-wide">Ir al Dashboard</span>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-200/30 to-orange-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                ) : (
                  <SignUpButton mode="modal">
                    <button className="relative inline-flex items-center px-8 sm:px-10 py-4 sm:py-5 
                      bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400
                      text-purple-900 rounded-2xl font-black text-lg sm:text-xl shadow-2xl
                      hover:from-yellow-300 hover:via-yellow-400 hover:to-orange-300 
                      hover:shadow-yellow-400/40 transform hover:-translate-y-1
                      transition-all duration-300 group w-full sm:w-auto justify-center
                      border-2 border-yellow-300/50 backdrop-blur-sm
                      before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r 
                      before:from-yellow-200/20 before:to-orange-200/20 before:blur-xl before:-z-10">
                      <FiCalendar className="w-6 h-6 mr-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                      <span className="tracking-wide">{heroContent.primaryButton.text}</span>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-200/30 to-orange-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </SignUpButton>
                )
              ) : heroContent.primaryButton.action === 'dashboard' ? (
                <Link
                  href="/dashboard"
                  className="relative inline-flex items-center px-8 sm:px-10 py-4 sm:py-5 
                    bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400
                    text-purple-900 rounded-2xl font-black text-lg sm:text-xl shadow-2xl
                    hover:from-yellow-300 hover:via-yellow-400 hover:to-orange-300 
                    hover:shadow-yellow-400/40 transform hover:-translate-y-1
                    transition-all duration-300 group w-full sm:w-auto justify-center
                    border-2 border-yellow-300/50 backdrop-blur-sm
                    before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r 
                    before:from-yellow-200/20 before:to-orange-200/20 before:blur-xl before:-z-10"
                >
                  <FiCalendar className="w-6 h-6 mr-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                  <span className="tracking-wide">{heroContent.primaryButton.text}</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-200/30 to-orange-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              ) : (
                <Link
                  href={heroContent.primaryButton.href || '#'}
                  className="relative inline-flex items-center px-8 sm:px-10 py-4 sm:py-5 
                    bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400
                    text-purple-900 rounded-2xl font-black text-lg sm:text-xl shadow-2xl
                    hover:from-yellow-300 hover:via-yellow-400 hover:to-orange-300 
                    hover:shadow-yellow-400/40 transform hover:-translate-y-1
                    transition-all duration-300 group w-full sm:w-auto justify-center
                    border-2 border-yellow-300/50 backdrop-blur-sm
                    before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r 
                    before:from-yellow-200/20 before:to-orange-200/20 before:blur-xl before:-z-10"
                >
                  <FiCalendar className="w-6 h-6 mr-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                  <span className="tracking-wide">{heroContent.primaryButton.text}</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-200/30 to-orange-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              )}
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Link
                href={heroContent.secondaryButton.href}
                className="relative inline-flex items-center px-8 sm:px-10 py-4 sm:py-5 
                  bg-white/15 backdrop-blur-lg border-2 border-white/40
                  text-white rounded-2xl font-bold text-lg sm:text-xl shadow-xl
                  hover:bg-white/25 hover:border-white/60 hover:shadow-white/20
                  hover:-translate-y-1 transition-all duration-300 group 
                  w-full sm:w-auto justify-center
                  before:absolute before:inset-0 before:rounded-2xl 
                  before:bg-gradient-to-r before:from-white/10 before:to-white/5 
                  before:blur-xl before:-z-10"
              >
                <span className="tracking-wide group-hover:text-yellow-100 transition-colors duration-300">
                  {heroContent.secondaryButton.text}
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 
          w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center
          border border-white/25 hover:bg-white/15 hover:border-white/35 transition-all duration-300 z-20
          group"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        whileHover={{ y: 2 }}
        aria-label="Desplazarse hacia abajo"
      >
        <FiArrowDown className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
      </motion.button>

      {/* Violet overlay: transparent edges, opaque center */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-600/40 to-transparent pointer-events-none" />
    </section>
  )
}