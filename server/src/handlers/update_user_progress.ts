
import { db } from '../db';
import { userProgressTable } from '../db/schema';
import { type UpdateUserProgressInput, type UserProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateUserProgress(input: UpdateUserProgressInput): Promise<UserProgress> {
  try {
    // Check if user progress record already exists
    const existingProgress = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, input.user_id),
          eq(userProgressTable.kanji_id, input.kanji_id)
        )
      )
      .execute();

    const now = new Date();

    if (existingProgress.length > 0) {
      // Update existing progress record
      const current = existingProgress[0];
      const newReviewCount = current.review_count + 1;
      const newCorrectCount = current.correct_count + (input.is_correct ? 1 : 0);
      
      // Spaced repetition algorithm for familiarity level adjustment
      let newFamiliarityLevel = current.familiarity_level;
      if (input.is_correct) {
        // Correct answer: increase familiarity (max 5)
        newFamiliarityLevel = Math.min(5, current.familiarity_level + 1);
      } else {
        // Incorrect answer: decrease familiarity (min 0)
        newFamiliarityLevel = Math.max(0, current.familiarity_level - 1);
      }

      const result = await db.update(userProgressTable)
        .set({
          familiarity_level: newFamiliarityLevel,
          last_reviewed: now,
          review_count: newReviewCount,
          correct_count: newCorrectCount,
          updated_at: now
        })
        .where(
          and(
            eq(userProgressTable.user_id, input.user_id),
            eq(userProgressTable.kanji_id, input.kanji_id)
          )
        )
        .returning()
        .execute();

      return result[0];
    } else {
      // Create new progress record
      const initialFamiliarityLevel = input.is_correct ? 1 : 0;
      
      const result = await db.insert(userProgressTable)
        .values({
          user_id: input.user_id,
          kanji_id: input.kanji_id,
          familiarity_level: initialFamiliarityLevel,
          last_reviewed: now,
          review_count: 1,
          correct_count: input.is_correct ? 1 : 0,
          created_at: now,
          updated_at: now
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('User progress update failed:', error);
    throw error;
  }
}
