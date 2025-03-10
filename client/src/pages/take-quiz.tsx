import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Quiz } from "@shared/schema";
import QuizPlayer from "@/components/quiz/quiz-player";
import ResultsView from "@/components/quiz/results-view";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type Answer = {
  questionIndex: number;
  selectedOption: number | null;
  timeSpent: number;
  status: 'correct' | 'incorrect' | 'skipped' | 'timeExpired';
};

export default function TakeQuiz() {
  const { id } = useParams<{ id: string }>();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [originalQuiz, setOriginalQuiz] = useState<Quiz | null>(null);


  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return <div>Quiz not found</div>;
  }

  if (showResults) {
    return (
      <ResultsView
        quiz={quiz}
        answers={answers}
      />
    );
  }

  return (
    <QuizPlayer
      quiz={quiz}
      onAnswer={(answer) => {
        // Update answer if it already exists for this question
        const existingAnswerIndex = answers.findIndex(a => a.questionIndex === answer.questionIndex);

        if (existingAnswerIndex !== -1) {
          const updatedAnswers = [...answers];
          updatedAnswers[existingAnswerIndex] = answer;
          setAnswers(updatedAnswers);
        } else {
          setAnswers([...answers, answer]);
        }
      }}
      onComplete={() => {
        // If user clicked "Skip to Results" before answering all questions,
        // mark remaining questions as skipped
        if (answers.length < quiz.questions.length) {
          const remainingAnswers = [];
          for (let i = answers.length; i < quiz.questions.length; i++) {
            remainingAnswers.push({
              questionIndex: i,
              selectedOption: null, // Use null for skipped questions
              timeSpent: 0,
              status: 'skipped'
            });
          }
          setAnswers([...answers, ...remainingAnswers]);
        }
        setShowResults(true);
      }}
      currentQuestionIndex={answers.length}
    />
  );
}