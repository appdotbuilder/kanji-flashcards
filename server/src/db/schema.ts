
import { serial, text, pgTable, timestamp, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const kanjiTable = pgTable('kanji', {
  id: serial('id').primaryKey(),
  character: varchar('character', { length: 1 }).notNull().unique(), // Single kanji character
  onyomi: text('onyomi'), // On'yomi reading (nullable)
  kunyomi: text('kunyomi'), // Kun'yomi reading (nullable)
  meaning: text('meaning').notNull(),
  grade: integer('grade'), // School grade level (nullable)
  jlpt_level: integer('jlpt_level'), // JLPT level (nullable)
  stroke_count: integer('stroke_count').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const exampleUsagesTable = pgTable('example_usages', {
  id: serial('id').primaryKey(),
  kanji_id: integer('kanji_id').notNull().references(() => kanjiTable.id, { onDelete: 'cascade' }),
  word: text('word').notNull(), // Word containing the kanji
  reading: text('reading').notNull(), // Reading of the word
  meaning: text('meaning').notNull(), // Meaning of the word
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const userProgressTable = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).notNull(), // Simple string-based user ID
  kanji_id: integer('kanji_id').notNull().references(() => kanjiTable.id, { onDelete: 'cascade' }),
  familiarity_level: integer('familiarity_level').notNull().default(0), // 0-5 scale
  last_reviewed: timestamp('last_reviewed').defaultNow().notNull(),
  review_count: integer('review_count').notNull().default(0),
  correct_count: integer('correct_count').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const kanjiRelations = relations(kanjiTable, ({ many }) => ({
  examples: many(exampleUsagesTable),
  userProgress: many(userProgressTable),
}));

export const exampleUsagesRelations = relations(exampleUsagesTable, ({ one }) => ({
  kanji: one(kanjiTable, {
    fields: [exampleUsagesTable.kanji_id],
    references: [kanjiTable.id],
  }),
}));

export const userProgressRelations = relations(userProgressTable, ({ one }) => ({
  kanji: one(kanjiTable, {
    fields: [userProgressTable.kanji_id],
    references: [kanjiTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Kanji = typeof kanjiTable.$inferSelect;
export type NewKanji = typeof kanjiTable.$inferInsert;
export type ExampleUsage = typeof exampleUsagesTable.$inferSelect;
export type NewExampleUsage = typeof exampleUsagesTable.$inferInsert;
export type UserProgress = typeof userProgressTable.$inferSelect;
export type NewUserProgress = typeof userProgressTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  kanji: kanjiTable,
  exampleUsages: exampleUsagesTable,
  userProgress: userProgressTable,
};
