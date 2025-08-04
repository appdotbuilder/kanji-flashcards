
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type UpdateUserProgressInput } from '../schema';
import { updateUserProgress } from '../handlers/update_user_progress';
import { eq, and } from 'drizzle-orm';

describe('updateUserProgress', () => {
  let testKanjiId: number;
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    await createDB();
    
    // Create test kanji first
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
    
    testKanjiId = kanjiResult[0].id;
  });

  afterEach(resetDB);

  it('should create new progress record for first review', async () => {
    const input: UpdateUserProgressInput = {
      user_id: testUserId,
      kanji_id: testKanjiId,
      familiarity_level: 2,
      is_correct: true
    };

    const result = await updateUserProgress(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.kanji_id).toEqual(testKanjiId);
    expect(result.familiarity_level).toEqual(1); // Correct answer starts at 1
    expect(result.review_count).toEqual(1);
    expect(result.correct_count).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.last_reviewed).toBeInstanceOf(Date);
  });

  it('should create progress record with familiarity 0 for incorrect first answer', async () => {
    const input: UpdateUserProgressInput = {
      user_id: testUserId,
      kanji_id: testKanjiId,
      familiarity_level: 3,
      is_correct: false
    };

    const result = await updateUserProgress(input);

    expect(result.familiarity_level).toEqual(0); // Incorrect answer starts at 0
    expect(result.review_count).toEqual(1);
    expect(result.correct_count).toEqual(0);
  });

  it('should update existing progress record and increase familiarity for correct answer', async () => {
    // Create initial progress
    await db.insert(userProgressTable)
      .values({
        user_id: testUserId,
        kanji_id: testKanjiId,
        familiarity_level: 2,
        review_count: 3,
        correct_count: 2
      })
      .execute();

    const input: UpdateUserProgressInput = {
      user_id: testUserId,
      kanji_id: testKanjiId,
      familiarity_level: 2,
      is_correct: true
    };

    const result = await updateUserProgress(input);

    expect(result.familiarity_level).toEqual(3); // Increased from 2 to 3
    expect(result.review_count).toEqual(4); // Increased from 3 to 4
    expect(result.correct_count).toEqual(3); // Increased from 2 to 3
    expect(result.last_reviewed).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing progress record and decrease familiarity for incorrect answer', async () => {
    // Create initial progress
    await db.insert(userProgressTable)
      .values({
        user_id: testUserId,
        kanji_id: testKanjiId,
        familiarity_level: 3,
        review_count: 5,
        correct_count: 4
      })
      .execute();

    const input: UpdateUserProgressInput = {
      user_id: testUserId,
      kanji_id: testKanjiId,
      familiarity_level: 3,
      is_correct: false
    };

    const result = await updateUserProgress(input);

    expect(result.familiarity_level).toEqual(2); // Decreased from 3 to 2
    expect(result.review_count).toEqual(6); // Increased from 5 to 6
    expect(result.correct_count).toEqual(4); // Unchanged (incorrect answer)
  });

  it('should not exceed maximum familiarity level of 5', async () => {
    // Create progress at max level
    await db.insert(userProgressTable)
      .values({
        user_id: testUserId,
        kanji_id: testKanjiId,
        familiarity_level: 5,
        review_count: 10,
        correct_count: 9
      })
      .execute();

    const input: UpdateUserProgressInput = {
      user_id: testUserId,
      kanji_id: testKanjiId,
      familiarity_level: 5,
      is_correct: true
    };

    const result = await updateUserProgress(input);

    expect(result.familiarity_level).toEqual(5); // Stays at max 5
    expect(result.review_count).toEqual(11);
    expect(result.correct_count).toEqual(10);
  });

  it('should not go below minimum familiarity level of 0', async () => {
    // Create progress at min level
    await db.insert(userProgressTable)
      .values({
        user_id: testUserId,
        kanji_id: testKanjiId,
        familiarity_level: 0,
        review_count: 2,
        correct_count: 0
      })
      .execute();

    const input: UpdateUserProgressInput = {
      user_id: testUserId,
      kanji_id: testKanjiId,
      familiarity_level: 0,
      is_correct: false
    };

    const result = await updateUserProgress(input);

    expect(result.familiarity_level).toEqual(0); // Stays at min 0
    expect(result.review_count).toEqual(3);
    expect(result.correct_count).toEqual(0);
  });

  it('should save progress to database', async () => {
    const input: UpdateUserProgressInput = {
      user_id: testUserId,
      kanji_id: testKanjiId,
      familiarity_level: 1,
      is_correct: true
    };

    const result = await updateUserProgress(input);

    // Verify record was saved to database
    const savedProgress = await db.select()
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, testUserId),
          eq(userProgressTable.kanji_id, testKanjiId)
        )
      )
      .execute();

    expect(savedProgress).toHaveLength(1);
    expect(savedProgress[0].id).toEqual(result.id);
    expect(savedProgress[0].familiarity_level).toEqual(1);
    expect(savedProgress[0].review_count).toEqual(1);
    expect(savedProgress[0].correct_count).toEqual(1);
  });
});
