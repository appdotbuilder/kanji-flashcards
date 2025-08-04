
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exampleUsagesTable, kanjiTable } from '../db/schema';
import { type CreateExampleUsageInput } from '../schema';
import { createExampleUsage } from '../handlers/create_example_usage';
import { eq } from 'drizzle-orm';

describe('createExampleUsage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an example usage', async () => {
    // Create prerequisite kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '火',
        onyomi: 'カ',
        kunyomi: 'ひ',
        meaning: 'fire',
        grade: 1,
        jlpt_level: 5,
        stroke_count: 4
      })
      .returning()
      .execute();

    const kanjiId = kanjiResult[0].id;

    const testInput: CreateExampleUsageInput = {
      kanji_id: kanjiId,
      word: '火事',
      reading: 'かじ',
      meaning: 'house fire'
    };

    const result = await createExampleUsage(testInput);

    // Basic field validation
    expect(result.kanji_id).toEqual(kanjiId);
    expect(result.word).toEqual('火事');
    expect(result.reading).toEqual('かじ');
    expect(result.meaning).toEqual('house fire');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save example usage to database', async () => {
    // Create prerequisite kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '水',
        onyomi: 'スイ',
        kunyomi: 'みず',
        meaning: 'water',
        grade: 1,
        jlpt_level: 5,
        stroke_count: 4
      })
      .returning()
      .execute();

    const kanjiId = kanjiResult[0].id;

    const testInput: CreateExampleUsageInput = {
      kanji_id: kanjiId,
      word: '水曜日',
      reading: 'すいようび',
      meaning: 'Wednesday'
    };

    const result = await createExampleUsage(testInput);

    // Query using proper drizzle syntax
    const exampleUsages = await db.select()
      .from(exampleUsagesTable)
      .where(eq(exampleUsagesTable.id, result.id))
      .execute();

    expect(exampleUsages).toHaveLength(1);
    expect(exampleUsages[0].kanji_id).toEqual(kanjiId);
    expect(exampleUsages[0].word).toEqual('水曜日');
    expect(exampleUsages[0].reading).toEqual('すいようび');
    expect(exampleUsages[0].meaning).toEqual('Wednesday');
    expect(exampleUsages[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent kanji', async () => {
    const testInput: CreateExampleUsageInput = {
      kanji_id: 99999, // Non-existent kanji ID
      word: '火事',
      reading: 'かじ',
      meaning: 'house fire'
    };

    await expect(createExampleUsage(testInput)).rejects.toThrow(/kanji with id 99999 does not exist/i);
  });

  it('should handle unicode characters correctly', async () => {
    // Create prerequisite kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '愛',
        onyomi: 'アイ',
        kunyomi: 'あい',
        meaning: 'love',
        grade: 4,
        jlpt_level: 4,
        stroke_count: 13
      })
      .returning()
      .execute();

    const kanjiId = kanjiResult[0].id;

    const testInput: CreateExampleUsageInput = {
      kanji_id: kanjiId,
      word: '愛情',
      reading: 'あいじょう',
      meaning: 'affection, love'
    };

    const result = await createExampleUsage(testInput);

    expect(result.word).toEqual('愛情');
    expect(result.reading).toEqual('あいじょう');
    expect(result.meaning).toEqual('affection, love');

    // Verify in database
    const saved = await db.select()
      .from(exampleUsagesTable)
      .where(eq(exampleUsagesTable.id, result.id))
      .execute();

    expect(saved[0].word).toEqual('愛情');
    expect(saved[0].reading).toEqual('あいじょう');
  });
});
