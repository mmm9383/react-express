import { Quiz } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Download, Home } from "lucide-react";
import { generateQuizTemplate } from "@/lib/quiz-template";

type Props = {
  quiz: Quiz;
  answers: Array<{
    questionIndex: number;
    selectedOption: number | null;
    timeSpent: number;
    status: 'correct' | 'incorrect' | 'skipped' | 'timeExpired'; // Added status property
  }>;
};

export default function ResultsView({ quiz, answers }: Props) {
  const correctAnswers = answers.filter(
    (a) => a.status === 'correct'
  ).length;
  const incorrectQuestions = answers.filter(
    (a) => a.status === 'incorrect'
  ).length;
  const skippedQuestions = answers.filter((a) => a.status === 'skipped').length;
  const timeExpiredQuestions = answers.filter((a) => a.status === 'timeExpired').length;


  // Make sure all questions are represented in the answers array
  const normalizedAnswers = quiz.questions.map((question, index) => {
    // Find the answer by its index in the questions array (display index)
    const existingAnswer = answers.find(a => a.questionIndex === index);
    
    if (existingAnswer) {
      return {
        ...existingAnswer,
        // Keep track of the display index for rendering
        displayIndex: index
      };
    }
    
    // If the question wasn't answered (skipped to results), create a skipped entry
    return {
      questionIndex: index,
      displayIndex: index,
      selectedOption: null,
      timeSpent: 0,
      status: 'skipped' //Default to skipped if no answer was provided.
    };
  });

  const score = Math.round((correctAnswers / quiz.questions.length) * 100);

  const getPerformanceMessage = () => {
    const thresholds = Object.keys(quiz.performanceMessages || {})
      .map(Number)
      .sort((a, b) => b - a);

    for (const threshold of thresholds) {
      if (score >= threshold) {
        return quiz.performanceMessages[threshold];
      }
    }
    return quiz.performanceMessages[0] || "Quiz completed!";
  };

  const downloadResults = () => {
    const content = generateQuizTemplate(quiz, answers, score);
    const blob = new Blob([content], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Result - ${quiz.title}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getQuestionStatus = (answer) => {
    return answer.status; // Directly return the status
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case "correct":
        return "text-green-600";
      case "incorrect":
        return "text-red-600";
      case "skipped":
        return "text-blue-600";
      case "timeExpired":
        return "text-orange-600";
      default:
        return "";
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case "correct":
        return "Correct";
      case "incorrect":
        return "Incorrect";
      case "skipped":
        return "Skipped";
      case "timeExpired":
        return "Time Expired";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4">
      <div className="container max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <div className="flex gap-2">
            <Button onClick={downloadResults} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Results
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-6xl font-bold mb-4">{score}%</div>
              <div className="text-lg text-muted-foreground">
                {correctAnswers} of {quiz.questions.length} correct
              </div>
              {skippedQuestions > 0 && (
                <div className="text-sm text-blue-500 mt-1">
                  {skippedQuestions} question{skippedQuestions !== 1 ? "s" : ""} skipped
                </div>
              )}
              {timeExpiredQuestions > 0 && (
                <div className="text-sm text-orange-500 mt-1">
                  {timeExpiredQuestions} question{timeExpiredQuestions !== 1 ? "s" : ""} timed out
                </div>
              )}
              <p className="text-2xl text-muted-foreground">
                {getPerformanceMessage()}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 grid grid-cols-2 gap-4 text-center">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="font-medium text-green-700">Correct</p>
            <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="font-medium text-red-700">Incorrect</p>
            <p className="text-2xl font-bold text-red-600">{incorrectQuestions}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-700">Skipped</p>
            <p className="text-2xl font-bold text-blue-600">{skippedQuestions}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <p className="font-medium text-orange-700">Time Expired</p>
            <p className="text-2xl font-bold text-orange-600">{timeExpiredQuestions}</p>
          </div>
        </div>

        <div className="space-y-6">
          {normalizedAnswers.map((answer, index) => {
            // Use displayIndex for rendering if available, otherwise use the original index
            const displayIdx = answer.displayIndex !== undefined ? answer.displayIndex : index;
            const question = quiz.questions[displayIdx];
            const status = getQuestionStatus(answer);
            const statusColorClass = getStatusColorClass(status);

            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Question {answer.questionIndex + 1}</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        Time: {answer.timeSpent}s
                      </span>
                      <span className={`text-sm font-medium ${statusColorClass}`}>
                        {status}
                      </span>
                    </div>
                  </div>

                  <p className="mb-4">{question.text}</p>

                  {/* Display question image if available */}
                  {(question.image || question.imageUrl) && (
                    <div className="mb-4">
                      <img
                        src={question.image || question.imageUrl}
                        alt={`Question ${answer.questionIndex + 1}`}
                        className="mx-auto max-h-64 rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  <div className="space-y-2 mt-4">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`p-4 rounded-lg ${
                          optIndex === question.correctAnswer
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-500"
                            : answer.selectedOption !== null && optIndex === answer.selectedOption
                            ? "bg-red-50 dark:bg-red-900/20 border border-red-500"
                            : "border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {String.fromCharCode(65 + optIndex)}: {option}
                      </div>
                    ))}
                    <div className={`mt-4 p-4 rounded-lg border ${
                      status === "correct" 
                        ? "bg-green-50 dark:bg-green-900/20 border-green-400" 
                        : status === "incorrect"
                          ? "bg-red-50 dark:bg-red-900/20 border-red-400"
                          : status === "skipped"
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400"
                            : "bg-orange-50 dark:bg-orange-900/20 border-orange-400"
                    }`}>
                      <p className={`font-medium ${statusColorClass}`}>
                        Status: {getStatusLabel(status)}
                      </p>
                      {status !== "correct" && (
                        <p className="text-sm mt-1">
                          The correct answer was option {String.fromCharCode(65 + question.correctAnswer)}
                        </p>
                      )}
                    </div>
                  </div>

                  {question.explanation && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="font-medium">Explanation:</p>
                      <p className="text-muted-foreground">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}