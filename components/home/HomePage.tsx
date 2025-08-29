'use client'

import { PublicLayout } from '@/components/layouts/PublicLayout'
import { HeroSection } from '@/components/hero/HeroSection'
import { ContentSection } from '@/components/home/ContentSection'

export function HomePage() {
  return (
    <PublicLayout>
      <HeroSection />
      <ContentSection />
    </PublicLayout>
  )
}