
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { FlashcardViewer } from '@/components/FlashcardViewer';
import { KanjiManager } from '@/components/KanjiManager';
import { ProgressStats } from '@/components/ProgressStats';
import type { Flashcard, GetFlashcardsInput } from '../../server/src/schema';

function App() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('user123'); // Simple user ID for demo
  const [filters, setFilters] = useState<Partial<GetFlashcardsInput>>({
    limit: 20
  });

  const loadFlashcards = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryInput: GetFlashcardsInput = {
        user_id: userId,
        limit: filters.limit || 20,
        ...(filters.grade && { grade: filters.grade }),
        ...(filters.jlpt_level && { jlpt_level: filters.jlpt_level }),
        ...(filters.familiarity_level !== undefined && { familiarity_level: filters.familiarity_level })
      };
      
      const result = await trpc.getFlashcards.query(queryInput);
      setFlashcards(result);
      setCurrentCardIndex(0);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
      // For demo purposes with stub API, show some sample data
      const sampleFlashcards: Flashcard[] = [
        {
          id: 1,
          character: '学',
          onyomi: 'ガク',
          kunyomi: 'まな.ぶ',
          meaning: 'study, learning, science',
          grade: 1,
          jlpt_level: 5,
          stroke_count: 8,
          examples: [
            {
              id: 1,
              kanji_id: 1,
              word: '学校',
              reading: 'がっこう',
              meaning: 'school',
              created_at: new Date()
            },
            {
              id: 2,
              kanji_id: 1,
              word: '学生',
              reading: 'がくせい',
              meaning: 'student',
              created_at: new Date()
            }
          ],
          user_progress: {
            id: 1,
            user_id: userId,
            kanji_id: 1,
            familiarity_level: 2,
            last_reviewed: new Date(),
            review_count: 5,
            correct_count: 3,
            created_at: new Date(),
            updated_at: new Date()
          }
        },
        {
          id: 2,
          character: '本',
          onyomi: 'ホン',
          kunyomi: 'もと',
          meaning: 'book, present, main, origin, true, real',
          grade: 1,
          jlpt_level: 5,
          stroke_count: 5,
          examples: [
            {
              id: 3,
              kanji_id: 2,
              word: '本',
              reading: 'ほん',
              meaning: 'book',
              created_at: new Date()
            },
            {
              id: 4,
              kanji_id: 2,
              word: '日本',
              reading: 'にほん',
              meaning: 'Japan',
              created_at: new Date()
            }
          ],
          user_progress: {
            id: 2,
            user_id: userId,
            kanji_id: 2,
            familiarity_level: 4,
            last_reviewed: new Date(),
            review_count: 8,
            correct_count: 7,
            created_at: new Date(),
            updated_at: new Date()
          }
        }
      ];
      setFlashcards(sampleFlashcards);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filters]);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  const handleProgressUpdate = async (kanjiId: number, isCorrect: boolean, newFamiliarityLevel: number) => {
    try {
      await trpc.updateUserProgress.mutate({
        user_id: userId,
        kanji_id: kanjiId,
        familiarity_level: newFamiliarityLevel,
        is_correct: isCorrect
      });
      
      // Update local flashcard data
      setFlashcards((prev: Flashcard[]) => 
        prev.map((card: Flashcard) => 
          card.id === kanjiId && card.user_progress
            ? {
                ...card,
                user_progress: {
                  ...card.user_progress,
                  familiarity_level: newFamiliarityLevel,
                  review_count: card.user_progress.review_count + 1,
                  correct_count: card.user_progress.correct_count + (isCorrect ? 1 : 0),
                  last_reviewed: new Date(),
                  updated_at: new Date()
                }
              }
            : card
        )
      );
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const nextCard = () => {
    setCurrentCardIndex((prev: number) => (prev + 1) % flashcards.length);
  };

  const previousCard = () => {
    setCurrentCardIndex((prev: number) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const resetSession = () => {
    setCurrentCardIndex(0);
    loadFlashcards();
  };

  const currentCard = flashcards[currentCardIndex];
  const progressPercentage = flashcards.length > 0 ? ((currentCardIndex + 1) / flashcards.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📚 Kanji Learning Studio
          </h1>
          <p className="text-gray-600">Master Japanese Kanji with interactive flashcards</p>
        </div>

        <Tabs defaultValue="flashcards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flashcards">🃏 Flashcards</TabsTrigger>
            <TabsTrigger value="progress">📊 Progress</TabsTrigger>
            <TabsTrigger value="manage">⚙️ Manage</TabsTrigger>
          </TabsList>

          {/* Flashcards Tab */}
          <TabsContent value="flashcards" className="space-y-6">
            {/* User and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Study Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      value={userId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)}
                      placeholder="Enter your user ID"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Grade Level</Label>
                    <Select 
                      value={filters.grade?.toString() || 'all'} 
                      onValueChange={(value: string) => 
                        setFilters((prev: Partial<GetFlashcardsInput>) => ({ 
                          ...prev, 
                          grade: value === 'all' ? undefined : parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any grade</SelectItem>
                        {[1, 2, 3, 4, 5, 6].map((grade: number) => (
                          <SelectItem key={grade} value={grade.toString()}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>JLPT Level</Label>
                    <Select 
                      value={filters.jlpt_level?.toString() || 'all'} 
                      onValueChange={(value: string) => 
                        setFilters((prev: Partial<GetFlashcardsInput>) => ({ 
                          ...prev, 
                          jlpt_level: value === 'all' ? undefined : parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any level</SelectItem>
                        {[5, 4, 3, 2, 1].map((level: number) => (
                          <SelectItem key={level} value={level.toString()}>
                            N{level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Familiarity</Label>
                    <Select 
                      value={filters.familiarity_level?.toString() || 'all'} 
                      onValueChange={(value: string) => 
                        setFilters((prev: Partial<GetFlashcardsInput>) => ({ 
                          ...prev, 
                          familiarity_level: value === 'all' ? undefined : parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any level</SelectItem>
                        <SelectItem value="0">Unknown (0)</SelectItem>
                        <SelectItem value="1">Beginner (1)</SelectItem>
                        <SelectItem value="2">Learning (2)</SelectItem>
                        <SelectItem value="3">Familiar (3)</SelectItem>
                        <SelectItem value="4">Confident (4)</SelectItem>
                        <SelectItem value="5">Mastered (5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Limit</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={filters.limit || 20}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setFilters((prev: Partial<GetFlashcardsInput>) => ({ 
                          ...prev, 
                          limit: parseInt(e.target.value) || 20 
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={loadFlashcards} disabled={isLoading}>
                    {isLoading ? '🔄 Loading...' : '🚀 Start Session'}
                  </Button>
                  <Button variant="outline" onClick={resetSession}>
                    🔄 Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Bar */}
            {flashcards.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress: {currentCardIndex + 1} of {flashcards.length}</span>
                      <span>{Math.round(progressPercentage)}% complete</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Flashcard Viewer */}
            {currentCard ? (
              <FlashcardViewer
                flashcard={currentCard}
                onNext={nextCard}
                onPrevious={previousCard}
                onProgressUpdate={handleProgressUpdate}
                isFirst={currentCardIndex === 0}
                isLast={currentCardIndex === flashcards.length - 1}
              />
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  {isLoading ? (
                    <div>
                      <div className="text-4xl mb-4">🔄</div>
                      <p className="text-gray-600">Loading flashcards...</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-4">📚</div>
                      <p className="text-gray-600 mb-4">No flashcards found. Try adjusting your filters or create some kanji first!</p>
                      <Button onClick={loadFlashcards}>
                        🔄 Reload
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <ProgressStats userId={userId} flashcards={flashcards} />
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage">
            <KanjiManager onKanjiCreated={loadFlashcards} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
