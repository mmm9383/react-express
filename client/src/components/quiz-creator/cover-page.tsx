import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface CoverPageProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  performanceMessages: Record<string, string>;
  setPerformanceMessages: (messages: Record<string, string>) => void;
  randomizeQuestions: boolean;
  setRandomizeQuestions: (randomize: boolean) => void;
  onNext: () => void;
}

export default function CoverPage({
  title,
  setTitle,
  description,
  setDescription,
  performanceMessages,
  setPerformanceMessages,
  randomizeQuestions,
  setRandomizeQuestions,
  onNext,
}: CoverPageProps) {
  const updateMessage = (score: string, message: string) => {
    setPerformanceMessages({
      ...performanceMessages,
      [score]: message,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-8">
      <div className="container max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Create New Quiz</h1>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your quiz"
                className="mt-1"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="randomizeQuestions">Question Order</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="randomizeQuestions"
                  checked={randomizeQuestions}
                  onCheckedChange={setRandomizeQuestions}
                />
                <label 
                  htmlFor="randomizeQuestions" 
                  className="text-sm cursor-pointer select-none"
                >
                  Randomize question order (if unchecked, questions will appear in the order you added them)
                </label>
                {randomizeQuestions && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                    ✓ Questions will be randomized
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label>Performance Messages</Label>
              <div className="grid gap-4 mt-2">
                {Object.entries(performanceMessages).map(([score, message]) => (
                  <div key={score} className="flex gap-2 items-center">
                    <div className="w-16 text-sm text-muted-foreground">
                      {score}%
                    </div>
                    <Input
                      value={message}
                      onChange={(e) => updateMessage(score, e.target.value)}
                      placeholder={`Message for ${score}% score`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={onNext}
              className="w-full"
              disabled={!title.trim()}
            >
              Next: Add Questions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}