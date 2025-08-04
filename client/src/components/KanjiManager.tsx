
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { CreateKanjiInput, CreateExampleUsageInput } from '../../../server/src/schema';

interface KanjiManagerProps {
  onKanjiCreated: () => void;
}

export function KanjiManager({ onKanjiCreated }: KanjiManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [kanjiForm, setKanjiForm] = useState<CreateKanjiInput>({
    character: '',
    onyomi: null,
    kunyomi: null,
    meaning: '',
    grade: null,
    jlpt_level: null,
    stroke_count: 1
  });

  const [exampleForm, setExampleForm] = useState<Omit<CreateExampleUsageInput, 'kanji_id'>>({
    word: '',
    reading: '',
    meaning: ''
  });

  const [examples, setExamples] = useState<Omit<CreateExampleUsageInput, 'kanji_id'>[]>([]);

  const handleKanjiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const kanji = await trpc.createKanji.mutate(kanjiForm);
      console.log('Created kanji:', kanji);

      // Create examples if any
      for (const example of examples) {
        await trpc.createExampleUsage.mutate({
          kanji_id: kanji.id,
          ...example
        });
      }

      // Reset forms
      setKanjiForm({
        character: '',
        onyomi: null,
        kunyomi: null,
        meaning: '',
        grade: null,
        jlpt_level: null,
        stroke_count: 1
      });
      setExamples([]);
      onKanjiCreated();
    } catch (error) {
      console.error('Failed to create kanji:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addExample = () => {
    if (exampleForm.word && exampleForm.reading && exampleForm.meaning) {
      setExamples((prev: Omit<CreateExampleUsageInput, 'kanji_id'>[]) => [...prev, exampleForm]);
      setExampleForm({ word: '', reading: '', meaning: '' });
    }
  };

  const removeExample = (index: number) => {
    setExamples((prev: Omit<CreateExampleUsageInput, 'kanji_id'>[]) => 
      prev.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ➕ Add New Kanji
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleKanjiSubmit} className="space-y-6">
            {/* Basic Kanji Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="character">Kanji Character *</Label>
                <Input
                  id="character"
                  value={kanjiForm.character}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setKanjiForm((prev: CreateKanjiInput) => ({ ...prev, character: e.target.value }))
                  }
                  placeholder="漢"
                  className="text-2xl text-center"
                  maxLength={1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stroke_count">Stroke Count *</Label>
                <Input
                  id="stroke_count"
                  type="number"
                  min="1"
                  max="30"
                  value={kanjiForm.stroke_count}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setKanjiForm((prev: CreateKanjiInput) => ({ 
                      ...prev, 
                      stroke_count: parseInt(e.target.value) || 1 
                    }))
                  }
                  required
                />
              </div>
            </div>

            {/* Readings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="onyomi">On'yomi (音読み)</Label>
                <Input
                  id="onyomi"
                  value={kanjiForm.onyomi || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setKanjiForm((prev: CreateKanjiInput) => ({ 
                      ...prev, 
                      onyomi: e.target.value || null 
                    }))
                  }
                  placeholder="カン"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kunyomi">Kun'yomi (訓読み)</Label>
                <Input
                  id="kunyomi"
                  value={kanjiForm.kunyomi || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setKanjiForm((prev: CreateKanjiInput) => ({ 
                      ...prev, 
                      kunyomi: e.target.value || null 
                    }))
                  }
                  placeholder="かん"
                />
              </div>
            </div>

            {/* Meaning */}
            <div className="space-y-2">
              <Label htmlFor="meaning">Meaning *</Label>
              <Textarea
                id="meaning"
                value={kanjiForm.meaning}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setKanjiForm((prev: CreateKanjiInput) => ({ ...prev, meaning: e.target.value }))
                }
                placeholder="Chinese, Han dynasty"
                required
              />
            </div>

            {/* Classification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Select 
                  value={kanjiForm.grade?.toString() || 'none'} 
                  onValueChange={(value: string) => 
                    setKanjiForm((prev: CreateKanjiInput) => ({ 
                      ...prev, 
                      grade: value === 'none' ? null : parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No grade</SelectItem>
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
                  value={kanjiForm.jlpt_level?.toString() || 'none'} 
                  onValueChange={(value: string) => 
                    setKanjiForm((prev: CreateKanjiInput) => ({ 
                      ...prev, 
                      jlpt_level: value === 'none' ? null : parseInt(value) 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select JLPT level (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No JLPT level</SelectItem>
                    {[5, 4, 3, 2, 1].map((level: number) => (
                      <SelectItem key={level} value={level.toString()}>
                        N{level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Example Usage Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Example Usage</h3>
              
              {/* Add Example Form */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Word (e.g., 漢字)"
                  value={exampleForm.word}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setExampleForm((prev: Omit<CreateExampleUsageInput, 'kanji_id'>) => ({ 
                      ...prev, 
                      word: e.target.value 
                    }))
                  }
                />
                <Input
                  placeholder="Reading (e.g., かんじ)"
                  value={exampleForm.reading}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setExampleForm((prev: Omit<CreateExampleUsageInput, 'kanji_id'>) => ({ 
                      ...prev, 
                      reading: e.target.value 
                    }))
                  }
                />
                <Input
                  placeholder="Meaning (e.g., kanji)"
                  value={exampleForm.meaning}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setExampleForm((prev: Omit<CreateExampleUsageInput, 'kanji_id'>) => ({ 
                      ...prev, 
                      meaning: e.target.value 
                    }))
                  }
                />
                <Button type="button" onClick={addExample}>
                  ➕ Add
                </Button>
              </div>

              {/* Example List */}
              {examples.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Added Examples:</h4>
                  {examples.map((example, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{example.word}</Badge>
                        <span className="text-sm text-gray-600">({example.reading})</span>
                        <span className="text-sm">{example.meaning}</span>
                      </div>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeExample(index)}
                      >
                        🗑️
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? '⏳ Creating...' : '🚀 Create Kanji'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Use authentic Japanese readings and meanings</p>
          <p>• Add multiple example words to help with learning context</p>
          <p>• Grade levels 1-6 correspond to Japanese elementary school grades</p>
          <p>• JLPT levels: N5 (easiest) to N1 (hardest)</p>
          <p>• Stroke count should be accurate for proper learning</p>
        </CardContent>
      </Card>
    </div>
  );
}
