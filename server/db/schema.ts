import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// Recordings table to store video recording references
export const recordings = pgTable('recordings', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull(),
  videoKey: text('video_key').notNull(),
  videoUrl: text('video_url').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// Sessions table (matching existing Supabase schema for reference)
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  childId: text('child_id').notNull(),
  problem: text('problem').notNull(),
  skill: text('skill'),
  difficulty: text('difficulty'),
  correctAnswer: integer('correct_answer'),
  solved: boolean('solved').default(false),
  attemptCount: integer('attempt_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

export type InsertRecording = typeof recordings.$inferInsert;
export type SelectRecording = typeof recordings.$inferSelect;