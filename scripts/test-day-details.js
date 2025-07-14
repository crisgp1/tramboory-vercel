#!/usr/bin/env node
/**
 * Script to test the day-details API endpoint and debug reservation date issues
 * Run with: node scripts/test-day-details.js
 */

import mongoose from 'mongoose';
import { format } from 'date-fns';
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

async function testDayDetails() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the Reservation model
    const Reservation = mongoose.model('Reservation');
    
    // 1. Check total reservations
    const totalReservations = await Reservation.countDocuments();
    console.log(`\nTotal reservations in database: ${totalReservations}`);
    
    // 2. Get sample reservations
    const sampleReservations = await Reservation.find()
      .limit(5)
      .sort({ eventDate: -1 })
      .lean();
    
    console.log('\nSample reservations:');
    sampleReservations.forEach((res, index) => {
      console.log(`\nReservation ${index + 1}:`);
      console.log(`  ID: ${res._id}`);
      console.log(`  Event Date (raw): ${res.eventDate}`);
      console.log(`  Event Date (ISO): ${new Date(res.eventDate).toISOString()}`);
      console.log(`  Event Date (formatted): ${format(new Date(res.eventDate), 'yyyy-MM-dd')}`);
      console.log(`  Event Time: ${res.eventTime}`);
      console.log(`  Customer: ${res.customer?.name}`);
      console.log(`  Status: ${res.status}`);
      console.log(`  Payment Status: ${res.paymentStatus || 'not set'}`);
    });
    
    // 3. Test specific date filtering
    const testDate = new Date(); // Today
    const testDateStr = format(testDate, 'yyyy-MM-dd');
    console.log(`\n\nTesting date filter for: ${testDateStr}`);
    
    // Method 1: Direct date range query
    const startOfDay = new Date(testDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(testDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const method1Results = await Reservation.find({
      eventDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' }
    }).lean();
    
    console.log(`Method 1 (direct date range): ${method1Results.length} reservations found`);
    
    // Method 2: String comparison (like the API)
    const widerStart = new Date(testDate);
    widerStart.setDate(widerStart.getDate() - 1);
    widerStart.setHours(0, 0, 0, 0);
    const widerEnd = new Date(testDate);
    widerEnd.setDate(widerEnd.getDate() + 2);
    widerEnd.setHours(23, 59, 59, 999);
    
    const allReservations = await Reservation.find({
      eventDate: {
        $gte: widerStart,
        $lte: widerEnd
      },
      status: { $ne: 'cancelled' }
    }).lean();
    
    const method2Results = allReservations.filter(reservation => {
      const eventDate = new Date(reservation.eventDate);
      const reservationDateStr = format(eventDate, 'yyyy-MM-dd');
      return reservationDateStr === testDateStr;
    });
    
    console.log(`Method 2 (string comparison): ${method2Results.length} reservations found from ${allReservations.length} in wider range`);
    
    // 4. Check for timezone issues
    console.log('\n\nTimezone check:');
    console.log(`Server timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`Process TZ env: ${process.env.TZ || 'not set'}`);
    
    // 5. Test the actual API endpoint
    if (process.env.NEXTAUTH_URL || process.env.VERCEL_URL) {
      const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}`;
      console.log(`\n\nTesting API endpoint at: ${baseUrl}`);
      
      try {
        const response = await fetch(`${baseUrl}/api/admin/availability/day-details?date=${testDateStr}`);
        const data = await response.json();
        
        if (data.success) {
          console.log(`API Response: ${data.data.reservations?.length || 0} reservations found`);
        } else {
          console.log(`API Error: ${data.error}`);
        }
      } catch (error) {
        console.log('Could not test API endpoint:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
testDayDetails();