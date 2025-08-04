
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput, type Kanji } from '../schema';

export const createKanji = async (input: CreateKanjiInput): Promise<Kanji> => {
  try {
    // Insert kanji record
    const result = await db.insert(kanjiTable)
      .values({
        character: input.character,
        onyomi: input.onyomi,
        kunyomi: input.kunyomi,
        meaning: input.meaning,
        grade: input.grade,
        jlpt_level: input.jlpt_level,
        stroke_count: input.stroke_count
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Kanji creation failed:', error);
    throw error;
  }
};
