
import { db } from '../db';
import { userProgressTable } from '../db/schema';
import { type GetUserProgressInput, type UserProgress } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getUserProgress(input: GetUserProgressInput): Promise<UserProgress[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(userProgressTable.user_id, input.user_id));

    // Optionally filter by specific kanji_id
    if (input.kanji_id !== undefined) {
      conditions.push(eq(userProgressTable.kanji_id, input.kanji_id));
    }

    // Execute query with conditions
    const results = await db.select()
      .from(userProgressTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    // Return results (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Get user progress failed:', error);
    throw error;
  }
}
