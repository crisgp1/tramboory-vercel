require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set in .env.local');
  process.exit(1);
}

async function initializeSystemConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const systemConfigCollection = db.collection('systemconfigs');
    
    // Check if system config already exists
    const existingConfig = await systemConfigCollection.findOne({});
    
    if (existingConfig) {
      console.log('System config already exists:', existingConfig._id);
      
      // Update existing config to include timeBlocks and restDays if they don't exist
      if (!existingConfig.timeBlocks || !existingConfig.restDays) {
        const updateDoc = {};
        
        if (!existingConfig.timeBlocks) {
          updateDoc.timeBlocks = [
            {
              name: "Miércoles a Lunes - Tarde",
              days: [1, 3, 4, 5, 6, 0], // Lunes, Miércoles, Jueves, Viernes, Sábado, Domingo
              startTime: "14:00",
              endTime: "19:00",
              duration: 3.5,
              halfHourBreak: true,
              maxEventsPerBlock: 1
            }
          ];
        }
        
        if (!existingConfig.restDays) {
          updateDoc.restDays = [
            {
              day: 2, // Martes
              name: "Martes",
              fee: 1500,
              canBeReleased: true
            }
          ];
        }
        
        if (Object.keys(updateDoc).length > 0) {
          await systemConfigCollection.updateOne(
            { _id: existingConfig._id },
            { $set: updateDoc }
          );
          console.log('Updated existing config with timeBlocks and restDays');
        }
      }
    } else {
      // Create new system config
      const defaultConfig = {
        restDay: 2, // Martes
        restDayFee: 1500,
        businessHours: {
          start: "14:00",
          end: "19:00"
        },
        advanceBookingDays: 7,
        maxConcurrentEvents: 1,
        defaultEventDuration: 3.5,
        timeBlocks: [
          {
            name: "Miércoles a Lunes - Tarde",
            days: [1, 3, 4, 5, 6, 0], // Lunes, Miércoles, Jueves, Viernes, Sábado, Domingo
            startTime: "14:00",
            endTime: "19:00",
            duration: 3.5,
            halfHourBreak: true,
            maxEventsPerBlock: 1
          }
        ],
        restDays: [
          {
            day: 2, // Martes
            name: "Martes",
            fee: 1500,
            canBeReleased: true
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await systemConfigCollection.insertOne(defaultConfig);
      console.log('Created new system config:', result.insertedId);
    }
    
    console.log('System configuration initialized successfully');
  } catch (error) {
    console.error('Error initializing system config:', error);
  } finally {
    await client.close();
  }
}

initializeSystemConfig();