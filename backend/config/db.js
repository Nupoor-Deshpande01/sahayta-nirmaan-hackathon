const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

// Pimpri-Chinchwad / Pune area real hospitals seed data
const SEED_HOSPITALS = [
  {
    name: 'Yashwantrao Chavan Memorial Hospital',
    location: { type: 'Point', coordinates: [73.8000, 18.6298] },
    availableBeds: 8,
    totalBeds: 50,
    ICUAvailable: true,
    ventilators: 4,
    totalVentilators: 6,
    bloodUnits: { 'O-': 14, 'O+': 20, 'A-': 8, 'A+': 15, 'B-': 5, 'B+': 12, 'AB-': 3, 'AB+': 6 },
    traumaRoom: 'Bay 1',
    surgicalTeamStatus: 'Ready',
    traumaCenter: 1,
  },
  {
    name: 'Aditya Birla Memorial Hospital',
    location: { type: 'Point', coordinates: [73.7770, 18.6523] },
    availableBeds: 12,
    totalBeds: 80,
    ICUAvailable: true,
    ventilators: 6,
    totalVentilators: 8,
    bloodUnits: { 'O-': 22, 'O+': 30, 'A-': 10, 'A+': 18, 'B-': 7, 'B+': 14, 'AB-': 4, 'AB+': 9 },
    traumaRoom: 'Bay 2',
    surgicalTeamStatus: 'Ready',
    traumaCenter: 2,
  },
  {
    name: 'Jehangir Hospital Chinchwad',
    location: { type: 'Point', coordinates: [73.8067, 18.6210] },
    availableBeds: 5,
    totalBeds: 40,
    ICUAvailable: false,
    ventilators: 2,
    totalVentilators: 4,
    bloodUnits: { 'O-': 9, 'O+': 16, 'A-': 4, 'A+': 11, 'B-': 3, 'B+': 8, 'AB-': 2, 'AB+': 4 },
    traumaRoom: 'Bay 3',
    surgicalTeamStatus: 'Standby',
    traumaCenter: 3,
  },
  {
    name: 'Dr. D.Y. Patil Medical College & Hospital',
    location: { type: 'Point', coordinates: [73.7600, 18.6400] },
    availableBeds: 20,
    totalBeds: 120,
    ICUAvailable: true,
    ventilators: 10,
    totalVentilators: 14,
    bloodUnits: { 'O-': 30, 'O+': 40, 'A-': 15, 'A+': 25, 'B-': 10, 'B+': 20, 'AB-': 6, 'AB+': 12 },
    traumaRoom: 'Bay 4',
    surgicalTeamStatus: 'Ready',
    traumaCenter: 4,
  },
  {
    name: 'Lokmanya Hospital Chinchwad',
    location: { type: 'Point', coordinates: [73.8120, 18.6350] },
    availableBeds: 3,
    totalBeds: 30,
    ICUAvailable: true,
    ventilators: 3,
    totalVentilators: 5,
    bloodUnits: { 'O-': 7, 'O+': 12, 'A-': 3, 'A+': 9, 'B-': 2, 'B+': 6, 'AB-': 1, 'AB+': 3 },
    traumaRoom: 'Bay 1',
    surgicalTeamStatus: 'Busy',
    traumaCenter: 5,
  },
];

const SEED_AMBULANCES = [
  { driverName: 'Rahul Patil', currentLocation: { type: 'Point', coordinates: [73.7997, 18.6298] }, status: 'available' },
  { driverName: 'Suresh Kamble', currentLocation: { type: 'Point', coordinates: [73.7900, 18.6400] }, status: 'available' },
  { driverName: 'Amit Shinde', currentLocation: { type: 'Point', coordinates: [73.8100, 18.6150] }, status: 'available' },
];

async function seedDatabase() {
  const Hospital = require('../models/Hospital');
  const Ambulance = require('../models/Ambulance');

  const hospitalCount = await Hospital.countDocuments();
  if (hospitalCount === 0) {
    await Hospital.insertMany(SEED_HOSPITALS);
    console.log(`✅ Seeded ${SEED_HOSPITALS.length} hospitals into database.`);
  }

  const ambCount = await Ambulance.countDocuments();
  if (ambCount === 0) {
    await Ambulance.insertMany(SEED_AMBULANCES);
    console.log(`✅ Seeded ${SEED_AMBULANCES.length} ambulances into database.`);
  }
}

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    if (!uri) {
      console.log('No MONGO_URI found — starting in-memory MongoDB for development...');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log(`In-memory MongoDB started at: ${uri}`);
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed real data after connecting
    await seedDatabase();
  } catch (error) {
    console.error(`DB Connection Error: ${error.message}`);
    console.warn('Server will continue without a working DB connection.');
  }
};

// Gracefully stop in-memory server on process exit
process.on('exit', async () => {
  if (mongod) await mongod.stop();
});

module.exports = connectDB;
