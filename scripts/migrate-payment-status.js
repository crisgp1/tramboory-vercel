#!/usr/bin/env node
/**
 * Migration script to add paymentStatus field to existing reservations
 * Run with: node scripts/migrate-payment-status.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function migratePaymentStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the Reservation model
    const Reservation = mongoose.model('Reservation');
    
    // Count reservations without paymentStatus
    const reservationsWithoutPaymentStatus = await Reservation.countDocuments({
      paymentStatus: { $exists: false }
    });
    
    console.log(`Found ${reservationsWithoutPaymentStatus} reservations without paymentStatus`);
    
    if (reservationsWithoutPaymentStatus > 0) {
      // Update all reservations without paymentStatus
      const result = await Reservation.updateMany(
        { paymentStatus: { $exists: false } },
        { 
          $set: { 
            paymentStatus: 'pending',
            amountPaid: 0
          } 
        }
      );
      
      console.log(`Updated ${result.modifiedCount} reservations with default paymentStatus`);
    }
    
    // Also update reservations with confirmed status to have paid payment status
    const confirmedReservations = await Reservation.updateMany(
      { 
        status: 'confirmed',
        paymentStatus: 'pending'
      },
      { 
        $set: { 
          paymentStatus: 'paid',
          paymentDate: new Date()
        } 
      }
    );
    
    console.log(`Updated ${confirmedReservations.modifiedCount} confirmed reservations to paid status`);
    
    // Show summary
    const summary = await Reservation.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\nPayment status summary:');
    summary.forEach(item => {
      console.log(`  ${item._id || 'not set'}: ${item.count} reservations`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration
migratePaymentStatus();