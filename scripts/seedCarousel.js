const mongoose = require('mongoose');
require('dotenv').config();

const carouselCardSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  icon: { 
    type: String, 
    required: true,
    trim: true,
    default: 'GiPartyPopper'
  },
  emoji: { 
    type: String, 
    required: true,
    trim: true,
    default: '🎉'
  },
  
  backgroundMedia: {
    type: { 
      type: String, 
      required: true,
      enum: ['video', 'image', 'gradient'],
      default: 'gradient'
    },
    url: { type: String, trim: true },
    fallbackImage: { type: String, trim: true },
    alt: { type: String, trim: true }
  },
  
  gradientColors: {
    type: String,
    required: true,
    default: 'from-purple-500 to-purple-600'
  },
  
  isActive: { 
    type: Boolean, 
    default: true 
  },
  order: {
    type: Number,
    default: 0
  },
  
  createdBy: { 
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const CarouselCard = mongoose.models.CarouselCard || mongoose.model('CarouselCard', carouselCardSchema);

const defaultCards = [
  {
    title: 'Fiestas Épicas',
    emoji: '🎉',
    description: 'Creamos aventuras increíbles donde tu peque es la estrella. ¡Cada fiesta es única y súper divertida!',
    icon: 'GiPartyPopper',
    backgroundMedia: { type: 'gradient' },
    gradientColors: 'from-pink-500 to-purple-600',
    isActive: true,
    order: 1
  },
  {
    title: 'Zona Segura',
    emoji: '🛡️',
    description: 'Mientras los niños saltan y juegan como locos, tú te relajas sabiendo que todo está bajo control.',
    icon: 'FiShield',
    backgroundMedia: { type: 'gradient' },
    gradientColors: 'from-blue-500 to-cyan-600',
    isActive: true,
    order: 2
  },
  {
    title: 'Todo Listo',
    emoji: '🎈',
    description: 'Ponemos la decoración, la comida rica y la diversión. ¡Tú solo trae las ganas de festejar!',
    icon: 'GiBalloons',
    backgroundMedia: { type: 'gradient' },
    gradientColors: 'from-yellow-500 to-orange-600',
    isActive: true,
    order: 3
  },
  {
    title: 'Fotos Geniales',
    emoji: '📸',
    description: 'Capturamos todas las risas y travesuras para que revivas estos momentos cuando quieras.',
    icon: 'FiCamera',
    backgroundMedia: { type: 'gradient' },
    gradientColors: 'from-green-500 to-teal-600',
    isActive: true,
    order: 4
  }
];

async function seedCarousel() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Checking if carousel cards already exist...');
    const existingCards = await CarouselCard.countDocuments();
    
    if (existingCards > 0) {
      console.log(`Found ${existingCards} existing carousel cards. Skipping seed.`);
      return;
    }
    
    console.log('Creating default carousel cards...');
    await CarouselCard.insertMany(defaultCards);
    
    console.log('✅ Carousel cards seeded successfully!');
    console.log(`Created ${defaultCards.length} carousel cards`);
    
  } catch (error) {
    console.error('❌ Error seeding carousel:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedCarousel();