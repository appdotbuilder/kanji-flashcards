
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type Kanji } from '../schema';

export async function getAllKanji(): Promise<Kanji[]> {
  try {
    const result = await db.select()
      .from(kanjiTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch all kanji:', error);
    throw error;
  }
}
