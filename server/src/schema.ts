
import { z } from 'zod';

// Kanji schema
export const kanjiSchema = z.object({
  id: z.number(),
  character: z.string(),
  onyomi: z.string().nullable(), // On'yomi reading (Chinese-derived)
  kunyomi: z.string().nullable(), // Kun'yomi reading (Japanese)
  meaning: z.string(),
  grade: z.number().int().nullable(), // School grade level (1-6, or null for non-Joyo)
  jlpt_level: z.number().int().nullable(), // JLPT level (1-5, or null)
  stroke_count: z.number().int(),
  created_at: z.coerce.date()
});

export type Kanji = z.infer<typeof kanjiSchema>;

// Example usage schema
export const exampleUsageSchema = z.object({
  id: z.number(),
  kanji_id: z.number(),
  word: z.string(), // Word containing the kanji
  reading: z.string(), // Reading of the word
  meaning: z.string(), // Meaning of the word
  created_at: z.coerce.date()
});

export type ExampleUsage = z.infer<typeof exampleUsageSchema>;

// User progress schema
export const userProgressSchema = z.object({
  id: z.number(),
  user_id: z.string(), // Simple string-based user identification
  kanji_id: z.number(),
  familiarity_level: z.number().int().min(0).max(5), // 0-5 scale (0=unknown, 5=mastered)
  last_reviewed: z.coerce.date(),
  review_count: z.number().int().nonnegative(),
  correct_count: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserProgress = z.infer<typeof userProgressSchema>;

// Flashcard with full kanji data and user progress
export const flashcardSchema = z.object({
  id: z.number(),
  character: z.string(),
  onyomi: z.string().nullable(),
  kunyomi: z.string().nullable(),
  meaning: z.string(),
  grade: z.number().int().nullable(),
  jlpt_level: z.number().int().nullable(),
  stroke_count: z.number().int(),
  examples: z.array(exampleUsageSchema),
  user_progress: userProgressSchema.nullable()
});

export type Flashcard = z.infer<typeof flashcardSchema>;

// Input schemas for creating/updating data
export const createKanjiInputSchema = z.object({
  character: z.string().min(1),
  onyomi: z.string().nullable(),
  kunyomi: z.string().nullable(),
  meaning: z.string().min(1),
  grade: z.number().int().min(1).max(6).nullable(),
  jlpt_level: z.number().int().min(1).max(5).nullable(),
  stroke_count: z.number().int().positive()
});

export type CreateKanjiInput = z.infer<typeof createKanjiInputSchema>;

export const createExampleUsageInputSchema = z.object({
  kanji_id: z.number(),
  word: z.string().min(1),
  reading: z.string().min(1),
  meaning: z.string().min(1)
});

export type CreateExampleUsageInput = z.infer<typeof createExampleUsageInputSchema>;

export const updateUserProgressInputSchema = z.object({
  user_id: z.string(),
  kanji_id: z.number(),
  familiarity_level: z.number().int().min(0).max(5),
  is_correct: z.boolean() // Whether the user answered correctly in this review
});

export type UpdateUserProgressInput = z.infer<typeof updateUserProgressInputSchema>;

export const getFlashcardsInputSchema = z.object({
  user_id: z.string(),
  limit: z.number().int().positive().optional().default(20),
  grade: z.number().int().min(1).max(6).optional(),
  jlpt_level: z.number().int().min(1).max(5).optional(),
  familiarity_level: z.number().int().min(0).max(5).optional()
});

export type GetFlashcardsInput = z.infer<typeof getFlashcardsInputSchema>;

export const getUserProgressInputSchema = z.object({
  user_id: z.string(),
  kanji_id: z.number().optional()
});

export type GetUserProgressInput = z.infer<typeof getUserProgressInputSchema>;
