import { useState, useEffect, useRef } from "react";
import { Quiz, Question } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Timer, Home, SkipForward } from "lucide-react";
import { Link } from "wouter";

type Props = {
  quiz: Quiz;
  onAnswer: (answer: { questionIndex: number; selectedOption: number | null; timeSpent: number; status: 'correct' | 'incorrect' | 'skipped' | 'timeExpired' }) => void;
  onComplete: () => void;
  currentQuestionIndex: number;
};

export default function QuizPlayer({ quiz, onAnswer, onComplete, currentQuestionIndex }: Props) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasTimerExpired, setHasTimerExpired] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null); 
  const timerExpiredProcessed = useRef(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  useEffect(() => {
    if (!currentQuestion) return;

    const timeLimit = currentQuestion.timeLimit || 30;
    setTimeRemaining(timeLimit);
    setTimeSpent(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setHasTimerExpired(false);
    timerExpiredProcessed.current = false; // Reset for each question

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setHasTimerExpired(true);
          // Always show explanation when time expires, regardless of selection
          setShowExplanation(true);

          // Always set selectedOption to -1 if none was selected when time expires
          if (selectedOption === null) {
            setSelectedOption(-1);
          }

          // Calculate final timeSpent when timer expires
          const finalTimeSpent = currentQuestion.timeLimit || 30;
          setTimeSpent(finalTimeSpent);

          return 0;
        }
        setTimeSpent((prev) => prev + 1);
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current!); 
      timerRef.current = null; 
    };
  }, [currentQuestion]);

  // Handle answer selection
  const handleOptionSelect = (optionIndex: number) => {
    if (showExplanation || hasTimerExpired) return;

    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correctAnswer;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Use original index if available (for randomized quizzes)
    const questionIndex = currentQuestion.originalIndex !== undefined ? 
      currentQuestion.originalIndex : currentQuestionIndex;

    onAnswer({
      questionIndex: questionIndex,
      selectedOption: optionIndex,
      timeSpent,
      status: isCorrect ? 'correct' : 'incorrect'
    });
  };

  const handleSubmit = () => {
    // Stop timer when submitting
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Show explanation without advancing to next question
    setShowExplanation(true);

    // If timer expired and no option was selected, mark it accordingly
    if (hasTimerExpired && selectedOption === null) {
      setSelectedOption(-1);
    }

    // We don't call onAnswer() here anymore
    // It will be called when user clicks "Next Question" button
    // This way the user sees their answer and explanation before moving on
    // The status will be determined when the user clicks "Next Question"
  };

  useEffect(() => {
    if (hasTimerExpired && !timerExpiredProcessed.current) {
      timerExpiredProcessed.current = true;

      // Use original index if available (for randomized quizzes)
      const questionIndex = currentQuestion.originalIndex !== undefined ? 
        currentQuestion.originalIndex : currentQuestionIndex;

      onAnswer({
        questionIndex: questionIndex,
        selectedOption: null,
        timeSpent: currentQuestion.timeLimit,
        status: 'timeExpired'
      });
    }
  }, [hasTimerExpired, currentQuestionIndex, onAnswer, currentQuestion]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-none border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
            <div className={`flex items-center gap-2 ${timeRemaining === 0 ? "text-red-500 font-bold" : ""}`}>
              <Timer className="h-4 w-4" />
              {timeRemaining > 0 ? `${timeRemaining}s` : "Time's up!"}
            </div>
          </div>
          {!showExplanation && !hasTimerExpired && (
            <Button variant="outline" size="sm" onClick={onComplete} className="skip-to-results-btn">
              <SkipForward className="h-4 w-4 mr-2" />
              Skip to Results
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground text-right">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{currentQuestion.text}</h2>
            {currentQuestion.imageUrl && (
              <div className="my-4">
                <img 
                  src={currentQuestion.imageUrl} 
                  alt="Question image" 
                  className="mx-auto max-h-64 rounded-lg border border-gray-200"
                />
              </div>
            )}
            <div className="grid gap-2">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={showExplanation || timeRemaining === 0 || hasTimerExpired}
                  className={`w-full text-left px-6 py-4 rounded-lg border ${
                    showExplanation || hasTimerExpired
                      ? index === currentQuestion.correctAnswer
                        ? "border-green-500 bg-green-50"
                        : index === selectedOption && selectedOption !== -1
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                      : selectedOption === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  } ${timeRemaining === 0 && !showExplanation ? "opacity-60" : ""}`}
                >
                  {String.fromCharCode(65 + index)}: {option}
                </button>
              ))}
            </div>
          </div>

          {showExplanation && (
            <div className="p-4 bg-gray-50 rounded-lg mt-4 border border-gray-200">
              <p className="font-medium text-gray-900 mb-2">Explanation:</p>
              {currentQuestion.explanation ? (
                <p className="text-gray-600">{currentQuestion.explanation}</p>
              ) : (
                <p className="text-gray-600 italic">No explanation provided for this question.</p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 pt-6">
          <Button
            variant="outline"
            className="flex-1 skip-question-btn"
            disabled={showExplanation || hasTimerExpired} 
            onClick={() => {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              
              // For randomized quizzes, we need to properly track the question index
              // Always use the current display index for consistency
              onAnswer({
                questionIndex: currentQuestionIndex,
                selectedOption: null, 
                timeSpent,
                status: 'skipped'
              });
              if (currentQuestionIndex === quiz.questions.length - 1) {
                onComplete();
              }
            }}
          >
            <SkipForward className="mr-2 h-4 w-4" /> Skip Question
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              onComplete();
            }}
          >
            Skip to Results
          </Button>
          <Button
            className="flex-1"
            disabled={selectedOption === null && !showExplanation && !hasTimerExpired}
            onClick={showExplanation || hasTimerExpired ? () => {
              // When explanation is showing and user clicks Next Question/View Results

              // Record the answer before completing, regardless of whether it's the last question
              // Determine the status based on the selected option
              let status: 'correct' | 'incorrect' | 'skipped' | 'timeExpired';
              let finalSelectedOption = selectedOption; // Create a mutable copy

              if (hasTimerExpired) {
                status = 'timeExpired';
                finalSelectedOption = selectedOption === null ? -1 : selectedOption;
              } else if (selectedOption === null || selectedOption === -1) {
                status = 'skipped';
              } else if (selectedOption === currentQuestion.correctAnswer) {
                status = 'correct';
              } else {
                status = 'incorrect';
              }

              // Ensure timeSpent is accurately recorded
              const actualTimeSpent = currentQuestion.timeLimit ? 
                (currentQuestion.timeLimit - timeRemaining) : timeSpent;

              // Use original index if available (for randomized quizzes)
              const questionIndex = currentQuestion.originalIndex !== undefined ? 
                currentQuestion.originalIndex : currentQuestionIndex;

              onAnswer({
                questionIndex: questionIndex,
                selectedOption: finalSelectedOption === null ? -1 : finalSelectedOption,
                timeSpent: actualTimeSpent,
                status
              });

              if (currentQuestionIndex === quiz.questions.length - 1) {
                // Last question, show results
                onComplete();
              }
            } : handleSubmit}
          >
            {showExplanation
              ? currentQuestionIndex === quiz.questions.length - 1
                ? "View Results"
                : "Next Question"
              : "Submit Answer"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}