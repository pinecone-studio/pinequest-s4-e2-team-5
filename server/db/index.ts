import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { recordings } from './schema';
import { eq } from 'drizzle-orm';

// Create a PostgreSQL pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle database instance
export const db = drizzle(pool, { schema });

// Helper function to insert a recording
export async function createRecording(record: typeof recordings.$inferInsert) {
  try {
    const result = await db.insert(recordings).values(record).returning();
    return result[0];
  } catch (error) {
    console.error('Failed to create recording record:', error);
    throw error;
  }
}

// Helper function to get recordings by session ID
export async function getRecordingsBySessionId(sessionId: string) {
  try {
    const result = await db.select().from(recordings).where(eq(recordings.sessionId, sessionId));
    return result;
  } catch (error) {
    console.error('Failed to get recordings for session:', error);
    throw error;
  }
}