import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Create Prisma client with enhanced configuration
const createPrismaClient = () => {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set')
    console.log('Please set DATABASE_URL in your .env file')
    // Return a mock client for development without database
    return {
      $connect: () => Promise.reject(new Error('DATABASE_URL not configured')),
      $disconnect: () => Promise.resolve(),
      $transaction: () => Promise.reject(new Error('DATABASE_URL not configured')),
      order: {
        create: () => Promise.reject(new Error('DATABASE_URL not configured')),
        findMany: () => Promise.reject(new Error('DATABASE_URL not configured')),
        count: () => Promise.reject(new Error('DATABASE_URL not configured'))
      },
      users: {
        findUnique: () => Promise.reject(new Error('DATABASE_URL not configured')),
        count: () => Promise.reject(new Error('DATABASE_URL not configured'))
      },
      product: {
        findMany: () => Promise.reject(new Error('DATABASE_URL not configured'))
      }
    }
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Test connection on initialization
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully')
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error)
  })

// Gracefully disconnect on process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
