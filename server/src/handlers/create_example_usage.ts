
import { db } from '../db';
import { exampleUsagesTable, kanjiTable } from '../db/schema';
import { type CreateExampleUsageInput, type ExampleUsage } from '../schema';
import { eq } from 'drizzle-orm';

export async function createExampleUsage(input: CreateExampleUsageInput): Promise<ExampleUsage> {
  try {
    // Verify that the kanji exists
    const existingKanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, input.kanji_id))
      .execute();

    if (existingKanji.length === 0) {
      throw new Error(`Kanji with ID ${input.kanji_id} does not exist`);
    }

    // Insert example usage record
    const result = await db.insert(exampleUsagesTable)
      .values({
        kanji_id: input.kanji_id,
        word: input.word,
        reading: input.reading,
        meaning: input.meaning
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Example usage creation failed:', error);
    throw error;
  }
}
