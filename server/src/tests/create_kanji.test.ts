
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { createKanji } from '../handlers/create_kanji';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateKanjiInput = {
  character: '水',
  onyomi: 'スイ',
  kunyomi: 'みず',
  meaning: 'water',
  grade: 1,
  jlpt_level: 5,
  stroke_count: 4
};

// Test input with nullable fields as null
const testInputWithNulls: CreateKanjiInput = {
  character: '愛',
  onyomi: null,
  kunyomi: 'あい',
  meaning: 'love',
  grade: null,
  jlpt_level: null,
  stroke_count: 13
};

describe('createKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a kanji with all fields', async () => {
    const result = await createKanji(testInput);

    // Basic field validation
    expect(result.character).toEqual('水');
    expect(result.onyomi).toEqual('スイ');
    expect(result.kunyomi).toEqual('みず');
    expect(result.meaning).toEqual('water');
    expect(result.grade).toEqual(1);
    expect(result.jlpt_level).toEqual(5);
    expect(result.stroke_count).toEqual(4);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a kanji with nullable fields as null', async () => {
    const result = await createKanji(testInputWithNulls);

    expect(result.character).toEqual('愛');
    expect(result.onyomi).toBeNull();
    expect(result.kunyomi).toEqual('あい');
    expect(result.meaning).toEqual('love');
    expect(result.grade).toBeNull();
    expect(result.jlpt_level).toBeNull();
    expect(result.stroke_count).toEqual(13);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save kanji to database', async () => {
    const result = await createKanji(testInput);

    // Query database to verify save
    const kanji = await db.select()
      .from(kanjiTable)
      .where(eq(kanjiTable.id, result.id))
      .execute();

    expect(kanji).toHaveLength(1);
    expect(kanji[0].character).toEqual('水');
    expect(kanji[0].onyomi).toEqual('スイ');
    expect(kanji[0].kunyomi).toEqual('みず');
    expect(kanji[0].meaning).toEqual('water');
    expect(kanji[0].grade).toEqual(1);
    expect(kanji[0].jlpt_level).toEqual(5);
    expect(kanji[0].stroke_count).toEqual(4);
    expect(kanji[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique character constraint', async () => {
    // Create first kanji
    await createKanji(testInput);

    // Attempt to create duplicate should fail
    await expect(createKanji(testInput))
      .rejects.toThrow(/unique/i);
  });

  it('should handle characters with only kunyomi reading', async () => {
    const kunOnlyInput: CreateKanjiInput = {
      character: '山',
      onyomi: null,
      kunyomi: 'やま',
      meaning: 'mountain',
      grade: 1,
      jlpt_level: 5,
      stroke_count: 3
    };

    const result = await createKanji(kunOnlyInput);

    expect(result.character).toEqual('山');
    expect(result.onyomi).toBeNull();
    expect(result.kunyomi).toEqual('やま');
    expect(result.meaning).toEqual('mountain');
  });

  it('should handle characters with only onyomi reading', async () => {
    const onOnlyInput: CreateKanjiInput = {
      character: '机',
      onyomi: 'キ',
      kunyomi: null,
      meaning: 'desk',
      grade: 6,
      jlpt_level: 3,
      stroke_count: 6
    };

    const result = await createKanji(onOnlyInput);

    expect(result.character).toEqual('机');
    expect(result.onyomi).toEqual('キ');
    expect(result.kunyomi).toBeNull();
    expect(result.meaning).toEqual('desk');
  });
});
