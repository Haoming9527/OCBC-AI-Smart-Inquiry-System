import { neon } from '@neondatabase/serverless';

// Get database URL from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create Neon client
export const sql = neon(connectionString);

