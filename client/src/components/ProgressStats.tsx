
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Flashcard } from '../../../server/src/schema';

interface ProgressStatsProps {
  userId: string;
  flashcards: Flashcard[];
}

export function ProgressStats({ userId, flashcards }: ProgressStatsProps) {
  const stats = flashcards.reduce((acc, card) => {
    const progress = card.user_progress;
    if (!progress) return acc;

    acc.totalReviews += progress.review_count;
    acc.totalCorrect += progress.correct_count;
    acc.familiarityLevels[progress.familiarity_level] = (acc.familiarityLevels[progress.familiarity_level] || 0) + 1;
    
    if (card.grade) {
      acc.gradeProgress[card.grade] = (acc.gradeProgress[card.grade] || 0) + 1;
    }
    
    if (card.jlpt_level) {
      acc.jlptProgress[card.jlpt_level] = (acc.jlptProgress[card.jlpt_level] || 0) + 1;
    }

    return acc;
  }, {
    totalReviews: 0,
    totalCorrect: 0,
    familiarityLevels: {} as Record<number, number>,
    gradeProgress: {} as Record<number, number>,
    jlptProgress: {} as Record<number, number>
  });

  const overallAccuracy = stats.totalReviews > 0 ? Math.round((stats.totalCorrect / stats.totalReviews) * 100) : 0;
  const masteredCount = stats.familiarityLevels[5] || 0;
  const masteredPercentage = flashcards.length > 0 ? Math.round((masteredCount / flashcards.length) * 100) : 0;

  const getFamiliarityColor = (level: number) => {
    const colors = ['bg-gray-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    return colors[level] || colors[0];
  };

  const getFamiliarityLabel = (level: number) => {
    const labels = ['Unknown', 'Beginner', 'Learning', 'Familiar', 'Confident', 'Mastered'];
    return labels[level] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* User Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👤 Progress Overview for {userId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{flashcards.length}</div>
              <div className="text-sm text-gray-600">Total Kanji</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{masteredCount}</div>
              <div className="text-sm text-gray-600">Mastered ({masteredPercentage}%)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.totalReviews}</div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{overallAccuracy}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mastery Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Mastery Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Mastered Kanji</span>
              <span>{masteredCount} / {flashcards.length}</span>
            </div>
            <Progress value={masteredPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Familiarity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Familiarity Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[0, 1, 2, 3, 4, 5].map((level) => {
              const count = stats.familiarityLevels[level] || 0;
              const percentage = flashcards.length > 0 ? Math.round((count / flashcards.length) * 100) : 0;
              
              return (
                <div key={level} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge className={`${getFamiliarityColor(level)} text-white`}>
                      {getFamiliarityLabel(level)} ({level})
                    </Badge>
                    <span className="text-sm text-gray-600">{count} kanji ({percentage}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Grade Progress */}
      {Object.keys(stats.gradeProgress).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏫 Grade Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(stats.gradeProgress).map(([grade, count]) => (
                <div key={grade} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <div className="text-sm text-gray-600">Grade {grade}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* JLPT Progress */}
      {Object.keys(stats.jlptProgress).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 JLPT Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.jlptProgress).map(([level, count]) => (
                <div key={level} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{count}</div>
                  <div className="text-sm text-gray-600">JLPT N{level}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Kanji Progress */}
      {flashcards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📚 Individual Kanji Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {flashcards
                .filter((card) => card.user_progress)
                .sort((a, b) => (b.user_progress?.familiarity_level || 0) - (a.user_progress?.familiarity_level || 0))
                .map((card) => {
                  const progress = card.user_progress!;
                  const accuracy = progress.review_count > 0 
                    ? Math.round((progress.correct_count / progress.review_count) * 100)
                    : 0;
                  
                  return (
                    <div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold">{card.character}</span>
                        <div>
                          <div className="font-medium">{card.meaning}</div>
                          <div className="text-sm text-gray-600">
                            Reviews: {progress.review_count} | Accuracy: {accuracy}%
                          </div>
                        </div>
                      </div>
                      <Badge className={`${getFamiliarityColor(progress.familiarity_level)} text-white`}>
                        {getFamiliarityLabel(progress.familiarity_level)}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
