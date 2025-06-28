import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ParticlesBackground } from '@/components/decorative/ParticlesBackground'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Nosotros - Tramboory',
  description: 'Conoce la historia, valores y equipo detrás de Tramboory, el mejor salón de fiestas infantiles en Zapopan.',
  keywords: 'nosotros, historia, equipo, valores, misión, visión, tramboory, zapopan',
  openGraph: {
    title: 'Nosotros - Tramboory',
    description: 'Descubre quiénes somos y por qué somos el mejor salón de fiestas infantiles',
    images: ['/img/logo2.webp'],
    type: 'website',
  },
}

// Team members
const teamMembers = [
  {
    name: 'Ana García',
    role: 'Fundadora y Directora',
    image: '/img/logo2.webp', // Placeholder - replace with actual team member image
    description: 'Fundadora con más de 15 años de experiencia en la industria del entretenimiento infantil.'
  },
  {
    name: 'Carlos Mendoza',
    role: 'Director Creativo',
    image: '/img/blur.webp', // Placeholder - replace with actual team member image
    description: 'Experto en diseño de experiencias temáticas y entretenimiento para niños.'
  },
  {
    name: 'Sofía Rodríguez',
    role: 'Gerente de Operaciones',
    image: '/img/noblur.webp', // Placeholder - replace with actual team member image
    description: 'Responsable de garantizar la excelencia en la ejecución de cada evento.'
  },
  {
    name: 'Javier López',
    role: 'Chef Ejecutivo',
    image: '/img/background-noblur.webp', // Placeholder - replace with actual team member image
    description: 'Especialista en gastronomía infantil con menús divertidos y saludables.'
  }
]

// Company values
const values = [
  {
    icon: '✨',
    title: 'Creatividad',
    description: 'Innovamos constantemente para ofrecer experiencias únicas y memorables.',
    color: 'from-purple-500 to-violet-600'
  },
  {
    icon: '🛡️',
    title: 'Seguridad',
    description: 'La seguridad de los niños es nuestra prioridad absoluta en cada detalle.',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: '🌟',
    title: 'Excelencia',
    description: 'Buscamos la perfección en cada evento y nos esforzamos por superar expectativas.',
    color: 'from-tramboory-yellow-400 to-amber-600'
  },
  {
    icon: '❤️',
    title: 'Pasión',
    description: 'Amamos lo que hacemos y lo reflejamos en cada celebración que organizamos.',
    color: 'from-pink-500 to-rose-600'
  }
]

// Milestones for timeline
const milestones = [
  {
    year: 2015,
    title: 'Fundación',
    description: 'Tramboory abre sus puertas con la misión de crear momentos mágicos para los niños.'
  },
  {
    year: 2017,
    title: 'Expansión',
    description: 'Ampliamos nuestras instalaciones y agregamos nuevas temáticas y experiencias.'
  },
  {
    year: 2019,
    title: 'Reconocimiento',
    description: 'Ganamos el premio al "Mejor Salón de Fiestas Infantiles" en Jalisco.'
  },
  {
    year: 2021,
    title: 'Innovación Digital',
    description: 'Lanzamos nuestra plataforma de reservas en línea y personalización de eventos.'
  },
  {
    year: 2023,
    title: 'Sustentabilidad',
    description: 'Implementamos prácticas eco-amigables en todos nuestros servicios y operaciones.'
  }
]

// Testimonials
const testimonials = [
  {
    quote: "¡La mejor fiesta que mi hija ha tenido! Todo el equipo de Tramboory hizo un trabajo excepcional.",
    author: "María Fernández",
    role: "Mamá de Sofía, 7 años"
  },
  {
    quote: "Profesionalismo y atención a los detalles. Recomiendo Tramboory a todas las familias.",
    author: "Roberto Guzmán",
    role: "Papá de Diego, 5 años"
  },
  {
    quote: "La decoración temática superó nuestras expectativas. ¡Los niños estaban encantados!",
    author: "Laura Vega",
    role: "Mamá de Valentina, 6 años"
  }
]

export default function NosotrosPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-tramboory-purple-900 to-indigo-950 text-white pb-20">
      {/* Decorative background */}
      <ParticlesBackground 
        colorVariant="gradient" 
        particleCount={30}
        connectionDistance={100}
        opacity={0.3}
      />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center z-10">
        <h1 className="text-5xl md:text-6xl font-funhouse font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-tramboory-yellow-300 to-tramboory-yellow-500">
          Nosotros
        </h1>
        <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 text-tramboory-yellow-100">
          Conoce el equipo y la historia detrás de la magia de Tramboory
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-tramboory-purple-400 to-tramboory-yellow-400 rounded-full"></div>
      </section>
      
      {/* About Us Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative h-[400px] rounded-2xl overflow-hidden">
            <Image 
              src="/img/background-noblur.webp" // Placeholder - replace with actual image
              alt="Equipo Tramboory"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          </div>
          
          <div>
            <Badge className="mb-4 bg-tramboory-yellow-500 text-tramboory-purple-900 hover:bg-tramboory-yellow-600">
              Nuestra Historia
            </Badge>
            <h2 className="text-3xl font-funhouse font-bold mb-6 text-tramboory-yellow-300">
              La magia detrás de Tramboory
            </h2>
            
            <div className="space-y-4 text-white/80">
              <p>
                Tramboory nació en 2015 con una misión clara: transformar las celebraciones infantiles en experiencias mágicas e inolvidables. Fundado por un equipo de entusiastas del entretenimiento infantil, buscamos crear un espacio donde la imaginación y la diversión no tuvieran límites.
              </p>
              <p>
                Desde nuestros inicios, nos hemos dedicado a diseñar cada detalle para que tanto niños como padres disfruten de momentos especiales. Nuestro enfoque en la creatividad, la seguridad y la excelencia nos ha permitido convertirnos en el salón de fiestas infantiles preferido en Zapopan.
              </p>
              <p>
                A lo largo de los años, hemos evolucionado constantemente, innovando en temáticas, actividades y servicios, pero manteniendo siempre nuestra esencia: crear recuerdos que perduren en la memoria de las familias que nos visitan.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Mission & Vision Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gradient-to-br from-tramboory-purple-800/50 to-tramboory-purple-900/50 backdrop-blur-sm border-tramboory-purple-300/20 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-funhouse text-tramboory-yellow-300">
                Nuestra Misión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Crear experiencias mágicas y memorables para los niños y sus familias, ofreciendo un entorno seguro, divertido y estimulante donde puedan celebrar momentos especiales con creatividad y excelencia en cada detalle.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-tramboory-purple-800/50 to-tramboory-purple-900/50 backdrop-blur-sm border-tramboory-purple-300/20 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-funhouse text-tramboory-yellow-300">
                Nuestra Visión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Ser reconocidos como el referente en celebraciones infantiles, expandiendo nuestra presencia y concepto innovador, manteniendo siempre nuestro compromiso con la calidad, la creatividad y la felicidad de cada niño que nos visita.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Values Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 z-10 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-funhouse font-bold mb-4 text-white">
            Nuestros Valores
          </h2>
          <p className="text-white/80 max-w-3xl mx-auto">
            Los principios que guían cada decisión y acción en Tramboory
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <Card 
              key={index}
              className="bg-white/10 backdrop-blur-sm border-tramboory-purple-300/20 text-white overflow-hidden hover:transform hover:-translate-y-2 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className={cn(
                  "w-16 h-16 rounded-full mb-4 flex items-center justify-center text-2xl",
                  "bg-gradient-to-br", value.color
                )}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-tramboory-yellow-300">{value.title}</h3>
                <p className="text-white/80">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Timeline Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 z-10 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-funhouse font-bold mb-4 text-white">
            Nuestra Trayectoria
          </h2>
          <p className="text-white/80 max-w-3xl mx-auto">
            El camino que hemos recorrido para convertirnos en líderes en fiestas infantiles
          </p>
        </div>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-tramboory-purple-600/30"></div>
          
          <div className="space-y-16">
            {milestones.map((milestone, index) => (
              <div key={index} className="relative flex justify-center">
                <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-10 h-10 rounded-full bg-tramboory-purple-800 border-4 border-tramboory-yellow-400 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                </div>
                
                <div className={cn(
                  "w-5/12 pb-10",
                  index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left ml-auto"
                )}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="inline-block px-4 py-2 bg-gradient-to-r from-tramboory-yellow-400 to-tramboory-yellow-600 rounded-lg text-tramboory-purple-900 font-bold mb-4">
                      {milestone.year}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-tramboory-yellow-300">{milestone.title}</h3>
                    <p className="text-white/80">{milestone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Team Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 z-10 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-funhouse font-bold mb-4 text-white">
            Nuestro Equipo
          </h2>
          <p className="text-white/80 max-w-3xl mx-auto">
            Las personas que hacen posible la magia de Tramboory
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-tramboory-purple-800/50 to-tramboory-purple-900/50 backdrop-blur-sm rounded-xl overflow-hidden group transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/20"
            >
              <div className="h-64 relative">
                <Image 
                  src={member.image} 
                  alt={member.name}
                  fill
                  className="object-cover transition-all duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-tramboory-purple-900 to-transparent opacity-70"></div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1 text-tramboory-yellow-300">{member.name}</h3>
                <p className="text-white/60 text-sm mb-3">{member.role}</p>
                <p className="text-white/80 text-sm">{member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 z-10 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-funhouse font-bold mb-4 text-white">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-white/80 max-w-3xl mx-auto">
            Testimonios de familias que han vivido la experiencia Tramboory
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="bg-white/10 backdrop-blur-sm border-tramboory-purple-300/20 text-white overflow-hidden"
            >
              <CardContent className="p-6">
                <svg className="w-10 h-10 text-tramboory-yellow-400 mb-4" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                
                <p className="text-white/90 italic mb-6">{testimonial.quote}</p>
                
                <div>
                  <p className="font-medium text-tramboory-yellow-300">{testimonial.author}</p>
                  <p className="text-white/60 text-sm">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center z-10 relative">
        <div className="bg-gradient-to-r from-tramboory-purple-800 to-tramboory-purple-900 rounded-2xl p-10 shadow-2xl shadow-purple-800/30">
          <h2 className="text-3xl font-funhouse font-bold mb-4">¿Quieres ser parte de nuestra historia?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Haz de la celebración de tus pequeños un capítulo especial en la historia de Tramboory. Reserva ahora y déjanos crear un evento inolvidable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contacto" className="bg-white text-tramboory-purple-700 font-medium py-3 px-6 rounded-xl hover:bg-tramboory-purple-50 transition-all duration-300 shadow-lg">
              Reservar Ahora
            </Link>
            <Link href="/galeria" className="bg-transparent border-2 border-white/30 text-white font-medium py-3 px-6 rounded-xl hover:bg-white/10 transition-all duration-300">
              Ver Galería
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}