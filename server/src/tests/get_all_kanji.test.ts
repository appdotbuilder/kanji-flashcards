
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable } from '../db/schema';
import { type CreateKanjiInput } from '../schema';
import { getAllKanji } from '../handlers/get_all_kanji';

// Test kanji data
const testKanji1: CreateKanjiInput = {
  character: '水',
  onyomi: 'スイ',
  kunyomi: 'みず',
  meaning: 'water',
  grade: 1,
  jlpt_level: 5,
  stroke_count: 4
};

const testKanji2: CreateKanjiInput = {
  character: '火',
  onyomi: 'カ',
  kunyomi: 'ひ',
  meaning: 'fire',
  grade: 1,
  jlpt_level: 5,
  stroke_count: 4
};

const testKanji3: CreateKanjiInput = {
  character: '龍',
  onyomi: 'リュウ',
  kunyomi: 'たつ',
  meaning: 'dragon',
  grade: null,
  jlpt_level: 1,
  stroke_count: 16
};

describe('getAllKanji', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no kanji exist', async () => {
    const result = await getAllKanji();
    expect(result).toEqual([]);
  });

  it('should return all kanji characters', async () => {
    // Insert test kanji
    await db.insert(kanjiTable).values([
      testKanji1,
      testKanji2,
      testKanji3
    ]).execute();

    const result = await getAllKanji();

    expect(result).toHaveLength(3);
    
    // Check that all kanji are present
    const characters = result.map(k => k.character);
    expect(characters).toContain('水');
    expect(characters).toContain('火');
    expect(characters).toContain('龍');
  });

  it('should return kanji with all expected fields', async () => {
    // Insert a single kanji
    await db.insert(kanjiTable).values(testKanji1).execute();

    const result = await getAllKanji();

    expect(result).toHaveLength(1);
    const kanji = result[0];

    expect(kanji.id).toBeDefined();
    expect(kanji.character).toEqual('水');
    expect(kanji.onyomi).toEqual('スイ');
    expect(kanji.kunyomi).toEqual('みず');
    expect(kanji.meaning).toEqual('water');
    expect(kanji.grade).toEqual(1);
    expect(kanji.jlpt_level).toEqual(5);
    expect(kanji.stroke_count).toEqual(4);
    expect(kanji.created_at).toBeInstanceOf(Date);
  });

  it('should handle kanji with nullable fields', async () => {
    // Insert kanji with null grade
    await db.insert(kanjiTable).values(testKanji3).execute();

    const result = await getAllKanji();

    expect(result).toHaveLength(1);
    const kanji = result[0];

    expect(kanji.character).toEqual('龍');
    expect(kanji.grade).toBeNull();
    expect(kanji.jlpt_level).toEqual(1);
    expect(kanji.onyomi).toEqual('リュウ');
    expect(kanji.kunyomi).toEqual('たつ');
  });

  it('should return kanji in database insertion order', async () => {
    // Insert kanji in specific order
    await db.insert(kanjiTable).values(testKanji1).execute();
    await db.insert(kanjiTable).values(testKanji2).execute();
    await db.insert(kanjiTable).values(testKanji3).execute();

    const result = await getAllKanji();

    expect(result).toHaveLength(3);
    expect(result[0].character).toEqual('水');
    expect(result[1].character).toEqual('火');
    expect(result[2].character).toEqual('龍');
  });
});
