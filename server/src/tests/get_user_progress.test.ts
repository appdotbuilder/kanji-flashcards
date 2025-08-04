
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type GetUserProgressInput } from '../schema';
import { getUserProgress } from '../handlers/get_user_progress';

describe('getUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let testKanjiId1: number;
  let testKanjiId2: number;

  const setupTestData = async () => {
    // Create test kanji first
    const kanjiResults = await db.insert(kanjiTable)
      .values([
        {
          character: '水',
          onyomi: 'スイ',
          kunyomi: 'みず',
          meaning: 'water',
          grade: 1,
          jlpt_level: 5,
          stroke_count: 4
        },
        {
          character: '火',
          onyomi: 'カ',
          kunyomi: 'ひ',
          meaning: 'fire',
          grade: 1,
          jlpt_level: 5,
          stroke_count: 4
        }
      ])
      .returning()
      .execute();

    testKanjiId1 = kanjiResults[0].id;
    testKanjiId2 = kanjiResults[1].id;

    // Create test user progress data
    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'user1',
          kanji_id: testKanjiId1,
          familiarity_level: 3,
          review_count: 5,
          correct_count: 4
        },
        {
          user_id: 'user1',
          kanji_id: testKanjiId2,
          familiarity_level: 2,
          review_count: 3,
          correct_count: 2
        },
        {
          user_id: 'user2',
          kanji_id: testKanjiId1,
          familiarity_level: 4,
          review_count: 8,
          correct_count: 7
        }
      ])
      .execute();
  };

  it('should get all user progress for a user', async () => {
    await setupTestData();

    const input: GetUserProgressInput = {
      user_id: 'user1'
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(2);
    
    // Check that all results belong to user1
    result.forEach(progress => {
      expect(progress.user_id).toEqual('user1');
      expect(progress.id).toBeDefined();
      expect(progress.last_reviewed).toBeInstanceOf(Date);
      expect(progress.created_at).toBeInstanceOf(Date);
      expect(progress.updated_at).toBeInstanceOf(Date);
    });

    // Check specific progress data
    const waterProgress = result.find(p => p.kanji_id === testKanjiId1);
    const fireProgress = result.find(p => p.kanji_id === testKanjiId2);

    expect(waterProgress).toBeDefined();
    expect(waterProgress!.familiarity_level).toEqual(3);
    expect(waterProgress!.review_count).toEqual(5);
    expect(waterProgress!.correct_count).toEqual(4);

    expect(fireProgress).toBeDefined();
    expect(fireProgress!.familiarity_level).toEqual(2);
    expect(fireProgress!.review_count).toEqual(3);
    expect(fireProgress!.correct_count).toEqual(2);
  });

  it('should get specific kanji progress for a user', async () => {
    await setupTestData();

    const input: GetUserProgressInput = {
      user_id: 'user1',
      kanji_id: testKanjiId1
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('user1');
    expect(result[0].kanji_id).toEqual(testKanjiId1);
    expect(result[0].familiarity_level).toEqual(3);
    expect(result[0].review_count).toEqual(5);
    expect(result[0].correct_count).toEqual(4);
  });

  it('should return empty array for user with no progress', async () => {
    await setupTestData();

    const input: GetUserProgressInput = {
      user_id: 'nonexistent_user'
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for specific kanji with no progress', async () => {
    await setupTestData();

    const input: GetUserProgressInput = {
      user_id: 'user1',
      kanji_id: 99999 // Non-existent kanji ID
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(0);
  });

  it('should not return progress from other users', async () => {
    await setupTestData();

    const input: GetUserProgressInput = {
      user_id: 'user2'
    };

    const result = await getUserProgress(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('user2');
    expect(result[0].kanji_id).toEqual(testKanjiId1);
    expect(result[0].familiarity_level).toEqual(4);
  });
});
