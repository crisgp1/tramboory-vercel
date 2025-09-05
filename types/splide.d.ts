declare module '@splidejs/react-splide' {
  import { Component, ReactNode } from 'react'

  export interface SplideOptions {
    type?: 'loop' | 'slide' | 'fade'
    perPage?: number
    perMove?: number
    gap?: string | number
    autoplay?: boolean
    interval?: number
    pauseOnHover?: boolean
    resetProgress?: boolean
    arrows?: boolean
    pagination?: boolean
    drag?: boolean | 'free'
    focus?: string | number
    width?: string | number
    height?: string | number
    fixedWidth?: string | number
    fixedHeight?: string | number
    heightRatio?: number
    autoWidth?: boolean
    autoHeight?: boolean
    start?: number
    trimSpace?: boolean
    updateOnMove?: boolean
    throttle?: number
    destroy?: boolean
    breakpoints?: Record<string, Partial<SplideOptions>>
    classes?: Record<string, string>
    i18n?: Record<string, string>
    [key: string]: any
  }

  export interface SplideProps {
    options?: SplideOptions
    hasTrack?: boolean
    tag?: string
    className?: string
    style?: React.CSSProperties
    children?: ReactNode
    onMounted?: (splide: any) => void
    onUpdated?: (splide: any) => void
    onMove?: (newIndex: number, prevIndex: number, destIndex: number) => void
    onMoved?: (newIndex: number, prevIndex: number, destIndex: number) => void
    onClick?: (slide: any, e: Event) => void
    onArrowsMounted?: (prev: Element, next: Element) => void
    onArrowsUpdated?: (prev: Element, next: Element) => void
    onPaginationMounted?: (data: any) => void
    onPaginationUpdated?: (data: any) => void
    onNavigationMounted?: (splide: any) => void
    onAutoplayPlay?: (rate: number) => void
    onAutoplayPause?: (rate: number) => void
    onAutoplayPlaying?: (rate: number) => void
    onLazyLoadLoaded?: (img: HTMLImageElement, slide: any) => void
  }

  export interface SplideSlideProps {
    className?: string
    style?: React.CSSProperties
    children?: ReactNode
  }

  export class Splide extends Component<SplideProps> {}
  export class SplideSlide extends Component<SplideSlideProps> {}
  export class SplideTrack extends Component<{ children?: ReactNode; className?: string }> {}
}

declare module '@splidejs/react-splide/css' {}