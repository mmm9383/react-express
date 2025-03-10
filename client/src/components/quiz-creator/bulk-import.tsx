import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Question } from "@shared/schema";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  onImport: (questions: Question[]) => void;
};

export default function BulkImport({ onImport }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parseQuestions = (text: string): Question[] => {
    const questions: Question[] = [];
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

    let currentQuestion: Partial<Question> | null = null;
    let options: string[] = [];

    for (const line of lines) {
      if (line.startsWith("Q:")) {
        // Save previous question if exists
        if (currentQuestion?.text && options.length >= 2 && currentQuestion.correctAnswer !== undefined) {
          currentQuestion.options = options;
          questions.push(currentQuestion as Question);
        }

        // Start new question
        currentQuestion = {
          text: line.slice(2).trim(),
          timeLimit: 30,
        };
        options = [];
      } else if (line.match(/^[A-Z]:/)) {
        // Option line (A:, B:, C:, etc.)
        if (!currentQuestion) {
          throw new Error("Found option before question");
        }
        const option = line.slice(2).trim();
        options.push(option);
      } else if (line.startsWith("Correct:")) {
        // Correct answer
        if (!currentQuestion) {
          throw new Error("Found correct answer before question");
        }
        const correctLetter = line.slice(8).trim();
        currentQuestion.correctAnswer = correctLetter.charCodeAt(0) - 65;
        if (currentQuestion.correctAnswer < 0 || currentQuestion.correctAnswer >= options.length) {
          throw new Error("Invalid correct answer letter");
        }
      } else if (line.startsWith("Explanation:")) {
        // Explanation
        if (!currentQuestion) {
          throw new Error("Found explanation before question");
        }
        currentQuestion.explanation = line.slice(12).trim();
      } else if (line.startsWith("Time:")) {
        // Time limit
        if (!currentQuestion) {
          throw new Error("Found time limit before question");
        }
        currentQuestion.timeLimit = parseInt(line.slice(5).trim());
      }
    }

    // Add last question
    if (currentQuestion?.text && options.length >= 2 && currentQuestion.correctAnswer !== undefined) {
      currentQuestion.options = options;
      questions.push(currentQuestion as Question);
    }

    return questions;
  };

  const handleImport = () => {
    try {
      setError(null);
      const questions = parseQuestions(text);
      if (questions.length === 0) {
        throw new Error("No valid questions found");
      }
      onImport(questions);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid format");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground">
        Format your questions like this:
        <pre className="mt-2 p-4 bg-muted rounded-lg">
{`Q: What is 2 + 2?
A: 3
B: 4
C: 5
Correct: B
Explanation: 2 + 2 = 4
Time: 10

Q: Next question...`}
        </pre>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your questions here..."
        className="min-h-[300px] font-mono"
      />

      <Button onClick={handleImport} className="w-full">
        Import Questions
      </Button>
    </div>
  );
}