'use client'

import { useRef, useEffect } from 'react'
import { motion, useAnimation, useScroll, useTransform } from 'framer-motion'
import { FiCalendar, FiArrowDown, FiStar } from 'react-icons/fi'
import Link from 'next/link'
import { SignUpButton, useUser } from '@clerk/nextjs'

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)
  const controls = useAnimation()
  const { scrollY } = useScroll()
  const { isSignedIn } = useUser()
  
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

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900"
    >
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
        className="container mx-auto px-6 pt-20 pb-28 text-center relative z-10"
      >
        <div className="max-w-4xl mx-auto">
          {/* Enhanced badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 inline-block"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
              bg-gradient-to-r from-purple-500/25 to-purple-600/20 
              text-yellow-300 border border-purple-400/40 backdrop-blur-md
              hover:border-yellow-400/60 transition-all duration-300">
              <FiStar className="w-4 h-4" />
              <span>El mejor salón de fiestas infantiles en Zapopan</span>
            </span>
          </motion.div>
          
          {/* Main title */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.88] tracking-tight"
          >
            <span className="block">
              Celebra con{' '}
              <span className="relative inline-block">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500">
                  Tramboory
                </span>
              </span>
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base md:text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Experiencias mágicas diseñadas para crear recuerdos inolvidables 
            en el cumpleaños de tus pequeños en Zapopan.
          </motion.p>
          
          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500
                    text-purple-900 rounded-xl font-bold text-lg shadow-xl
                    hover:from-yellow-500 hover:to-yellow-600 hover:shadow-yellow-400/25
                    transition-all duration-300 group"
                >
                  <FiCalendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Ir al Dashboard</span>
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500
                    text-purple-900 rounded-xl font-bold text-lg shadow-xl
                    hover:from-yellow-500 hover:to-yellow-600 hover:shadow-yellow-400/25
                    transition-all duration-300 group">
                    <FiCalendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    <span>Reserva tu fiesta</span>
                  </button>
                </SignUpButton>
              )}
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/nosotros"
                className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-md border border-white/30
                  text-white rounded-lg font-semibold hover:bg-white/15 hover:border-white/40
                  transition-all duration-300"
              >
                Conócenos
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