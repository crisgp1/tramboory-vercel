'use client'

import { Header } from '@/components/navigation/Header'
import { HeroSection } from '@/components/hero/HeroSection'
import { ContentSection } from '@/components/home/ContentSection'
import { Footer } from '@/components/navigation/Footer'

export function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <HeroSection />
        <ContentSection />
      </main>
      <Footer />
    </>
  )
}