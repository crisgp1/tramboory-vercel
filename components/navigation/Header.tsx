'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { FiMenu, FiX } from 'react-icons/fi'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { Button } from '@mantine/core'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { isSignedIn } = useUser()
  const pathname = usePathname()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const navItems = [
    { href: '#content', label: 'Servicios' },
    { href: '/tematicas', label: 'Temáticas' },
    { href: '/galeria', label: 'Galería' },
    { href: '/contacto', label: 'Contacto' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Determinar si estamos en el home
  const isHomePage = pathname === '/'
  
  // Si no estamos en home, siempre mostrar fondo
  // Si estamos en home, mostrar fondo solo al scrollear
  const shouldShowBackground = !isHomePage || isScrolled

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        shouldShowBackground
          ? 'bg-purple-900/80 backdrop-blur-md border-b border-purple-500/30'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-40">
              {/* Solo logo - visible al hacer scroll o en páginas que no son home */}
              <motion.div
                className="absolute top-0 left-0 flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: shouldShowBackground ? 1 : 0,
                  x: shouldShowBackground ? 0 : -20
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative w-10 h-10">
                  <Image
                    src="/assets/logo.webp"
                    alt="Tramboory Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
              </motion.div>

              {/* Logo texto solo - visible solo en home antes de scrollear */}
              <motion.div
                className="absolute top-0 left-0 flex items-center"
                initial={{ opacity: 1, x: 0 }}
                animate={{
                  opacity: shouldShowBackground ? 0 : 1,
                  x: shouldShowBackground ? 20 : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative h-10 flex items-center">
                  <Image
                    src="/assets/logo-texto.webp"
                    alt="Tramboory"
                    width={140}
                    height={40}
                    className="object-contain"
                  />
                </div>
              </motion.div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/90 hover:text-white transition-colors duration-200 font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    Dashboard
                  </Button>
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                      userButtonPopoverCard: "bg-white/95 backdrop-blur-md",
                      userButtonPopoverActionButton: "hover:bg-purple-50"
                    }
                  }}
                />
              </div>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button
                    className="px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Iniciar Sesión
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all"
                  >
                    Registrarse
                  </button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white"
          >
            {isMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20"
          >
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-white/90 hover:text-white transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-white/20 pt-4 flex flex-col space-y-3">
                {isSignedIn ? (
                  <div className="flex flex-col space-y-3">
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full text-white border-white/30 hover:bg-white/10"
                      >
                        Dashboard
                      </Button>
                    </Link>
                    <div className="flex justify-center">
                      <UserButton
                        appearance={{
                          elements: {
                            avatarBox: "w-10 h-10",
                            userButtonPopoverCard: "bg-white/95 backdrop-blur-md",
                            userButtonPopoverActionButton: "hover:bg-purple-50"
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <SignInButton mode="modal">
                      <button
                        className="w-full px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Iniciar Sesión
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Registrarse
                      </button>
                    </SignUpButton>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </motion.header>
  )
}