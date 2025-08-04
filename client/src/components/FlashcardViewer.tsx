
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Flashcard } from '../../../server/src/schema';

interface FlashcardViewerProps {
  flashcard: Flashcard;
  onNext: () => void;
  onPrevious: () => void;
  onProgressUpdate: (kanjiId: number, isCorrect: boolean, newFamiliarityLevel: number) => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
}

export function FlashcardViewer({ 
  flashcard, 
  onNext, 
  onPrevious, 
  onProgressUpdate, 
  isFirst, 
  isLast 
}: FlashcardViewerProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);

  const handleAnswer = async (isCorrect: boolean) => {
    setIsAnswering(true);
    try {
      const currentLevel = flashcard.user_progress?.familiarity_level || 0;
      let newLevel = currentLevel;
      
      if (isCorrect) {
        newLevel = Math.min(5, currentLevel + 1);
      } else {
        newLevel = Math.max(0, currentLevel - 1);
      }
      
      await onProgressUpdate(flashcard.id, isCorrect, newLevel);
      
      // Auto advance to next card after a short delay
      setTimeout(() => {
        setShowAnswer(false);
        onNext();
      }, 1500);
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setIsAnswering(false);
    }
  };

  const getFamiliarityColor = (level: number) => {
    const colors = [
      'bg-gray-500',    // 0 - Unknown
      'bg-red-500',     // 1 - Beginner
      'bg-orange-500',  // 2 - Learning
      'bg-yellow-500',  // 3 - Familiar
      'bg-blue-500',    // 4 - Confident
      'bg-green-500'    // 5 - Mastered
    ];
    return colors[level] || colors[0];
  };

  const getFamiliarityLabel = (level: number) => {
    const labels = ['Unknown', 'Beginner', 'Learning', 'Familiar', 'Confident', 'Mastered'];
    return labels[level] || 'Unknown';
  };

  const accuracy = flashcard.user_progress 
    ? flashcard.user_progress.review_count > 0 
      ? Math.round((flashcard.user_progress.correct_count / flashcard.user_progress.review_count) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Flashcard */}
      <Card className="min-h-[400px] flex flex-col">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-2">
              {flashcard.grade && (
                <Badge variant="outline">Grade {flashcard.grade}</Badge>
              )}
              {flashcard.jlpt_level && (
                <Badge variant="outline">JLPT N{flashcard.jlpt_level}</Badge>
              )}
              <Badge variant="outline">{flashcard.stroke_count} strokes</Badge>
            </div>
            
            {flashcard.user_progress && (
              <div className="text-right space-y-1">
                <Badge className={`${getFamiliarityColor(flashcard.user_progress.familiarity_level)} text-white`}>
                  {getFamiliarityLabel(flashcard.user_progress.familiarity_level)}
                </Badge>
                <div className="text-xs text-gray-500">
                  {accuracy}% accuracy ({flashcard.user_progress.correct_count}/{flashcard.user_progress.review_count})
                </div>
              </div>
            )}
          </div>
          
          {/* Large Kanji Character */}
          <div className="text-8xl font-bold text-center py-8 text-gray-800">
            {flashcard.character}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {!showAnswer ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
              <p className="text-xl text-gray-600">
                🤔 What does this kanji mean and how is it read?
              </p>
              <Button onClick={() => setShowAnswer(true)} size="lg">
                🔍 Show Answer
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Readings and Meaning */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">On'yomi (音読み)</h3>
                  <p className="text-lg font-mono bg-gray-100 p-2 rounded">
                    {flashcard.onyomi || '—'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Kun'yomi (訓読み)</h3>
                  <p className="text-lg font-mono bg-gray-100 p-2 rounded">
                    {flashcard.kunyomi || '—'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Meaning</h3>
                  <p className="text-lg bg-blue-50 p-2 rounded text-blue-800">
                    {flashcard.meaning}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Example Usage */}
              {flashcard.examples.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    📝 Example Usage
                  </h3>
                  <div className="grid gap-3">
                    {flashcard.examples.map((example) => (
                      <div key={example.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-bold text-gray-800">
                            {example.word}
                          </span>
                          <span className="text-gray-600 font-mono">
                            ({example.reading})
                          </span>
                          <span className="text-blue-600">
                            — {example.meaning}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer Buttons */}
              <div className="flex justify-center gap-4 pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isAnswering}>
                      ❌ Incorrect
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mark as Incorrect?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will decrease your familiarity level with this kanji and it will appear more frequently in future sessions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleAnswer(false)}>
                        Mark Incorrect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" disabled={isAnswering}>
                      ✅ Correct
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mark as Correct?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Great job! This will increase your familiarity level with this kanji.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleAnswer(true)}>
                        Mark Correct
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={onPrevious} 
          disabled={isFirst}
          className="flex items-center gap-2"
        >
          ⬅️ Previous
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={() => setShowAnswer(false)}
          disabled={!showAnswer}
        >
          🔄 Hide Answer
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onNext} 
          disabled={isLast}
          className="flex items-center gap-2"
        >
          Next ➡️
        </Button>
      </div>
    </div>
  );
}
