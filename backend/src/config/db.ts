/**
 * Database Configuration - PRODUCTION ONLY
 * FOR THE KIDS - No mock data fallbacks
 *
 * GOSPEL V1.4.1 SURVIVAL MODE
 */

import { PrismaClient } from '@prisma/client';

// Force DATABASE_URL - NO FALLBACKS
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('🚨 FATAL: DATABASE_URL environment variable is REQUIRED');
  console.error('🚨 This is a production system - mock data is FORBIDDEN');
  console.error('🚨 Set DATABASE_URL in Railway environment variables');
  process.exit(1);
}

// Validate connection string format
if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  console.error('🚨 FATAL: DATABASE_URL must be a valid PostgreSQL connection string');
  console.error('🚨 Expected format: postgresql://user:password@host:port/database');
  process.exit(1);
}

// Initialize Prisma client with production settings
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// Connection test on startup
export async function validateDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ DATABASE: Connected to PostgreSQL');
  } catch (error) {
    console.error('🚨 FATAL: Database connection failed');
    console.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('📤 DATABASE: Disconnected');
}

export default prisma;
