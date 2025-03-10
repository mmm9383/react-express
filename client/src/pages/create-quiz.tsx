import { useState, useEffect } from "react";
import { useLocation, useQueryParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionForm from "@/components/quiz-creator/question-form";
import BulkImport from "@/components/quiz-creator/bulk-import";
import CoverPage from "@/components/quiz-creator/cover-page";
import { Question } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Placeholder for queryClient -  Replace with your actual implementation
const queryClient = {
  invalidateQueries: (params) => {
    console.log("Invalidating queries:", params); // Simulate cache invalidation
  },
};


export default function CreateQuiz() {
  const [step, setStep] = useState<"cover" | "questions">("cover");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [quizId, setQuizId] = useState<number | null>(null);
  const { toast } = useToast();

  // Get the edit parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
      const id = parseInt(editId);
      setQuizId(id);
      setIsEditing(true);
      console.log("Editing quiz ID:", id);

      // Fetch the quiz data
      const fetchQuiz = async () => {
        try {
          const response = await fetch(`/api/quizzes/${id}`);
          if (response.ok) {
            const quizData = await response.json();
            setTitle(quizData.title);
            setDescription(quizData.description || "");
            setQuestions(quizData.questions || []);
            setPerformanceMessages(quizData.performanceMessages);
            // Explicitly check and set the randomizeQuestions value
            const shouldRandomize = !!quizData.randomizeQuestions;
            console.log("Quiz loaded with randomizeQuestions:", shouldRandomize);
            setRandomizeQuestions(shouldRandomize);
          }
        } catch (error) {
          console.error("Failed to fetch quiz:", error);
        }
      };

      fetchQuiz();
    }
  }, []);

  const [performanceMessages, setPerformanceMessages] = useState<Record<string, string>>({
    "0": "You need more practice!",
    "50": "Getting there!",
    "80": "Great job!",
  });

  const handleQuestionAdd = (question: Question) => {
    if (currentEditingIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[currentEditingIndex] = question;
      setQuestions(updatedQuestions);
      setCurrentEditingIndex(null);
    } else {
      setQuestions([...questions, question]);
    }
  };

  const handleBulkImport = (importedQuestions: Question[]) => {
    setQuestions([...questions, ...importedQuestions]);
    if (importedQuestions.length > 0) {
      setCurrentEditingIndex(questions.length - 1);
    }
  };

  const handleEditQuestion = (index: number) => {
    setCurrentEditingIndex(index);
  };

  const [showUpdateOptions, setShowUpdateOptions] = useState(false);

  const handleSubmit = async (createCopy = false) => {
    try {
      console.log("Submitting quiz with randomizeQuestions:", randomizeQuestions);
      
      if (isEditing && !createCopy) {
        // Update existing quiz - use the title exactly as entered by the user
        await apiRequest("PUT", `/api/quizzes/${quizId}`, {
          title, // Use exact title as entered
          description,
          questions,
          performanceMessages,
          randomizeQuestions, // Ensure this is included
        });

        toast({
          title: "Success",
          description: "Quiz updated successfully!",
        });
      } else {
        // Create a new quiz or a copy - don't add (Copy) suffix
        const quizData = {
          title, // Use exact title as entered by the user
          description,
          questions,
          performanceMessages,
          randomizeQuestions,
        };

        await apiRequest("POST", "/api/quizzes", quizData);

        toast({
          title: "Success",
          description: isEditing && createCopy ? "Quiz copy created successfully!" : "Quiz created successfully!",
        });
      }

      // Redirect to home page
      setLocation("/");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Error",
        description: isEditing ? "Failed to create quiz copy" : "Failed to create quiz",
        variant: "destructive",
      });
    }
  };

  if (step === "cover") {
    return (
      <CoverPage
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        performanceMessages={performanceMessages}
        setPerformanceMessages={setPerformanceMessages}
        randomizeQuestions={randomizeQuestions}
        setRandomizeQuestions={setRandomizeQuestions}
        onNext={() => setStep("questions")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 p-8">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {isEditing ? "Edit Quiz" : "Create New Quiz"}
          </h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/50">
          <Tabs defaultValue="manual" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <QuestionForm
                onAdd={handleQuestionAdd}
                initialQuestion={currentEditingIndex !== null ? questions[currentEditingIndex] : undefined}
              />
            </TabsContent>

            <TabsContent value="bulk">
              <BulkImport onImport={handleBulkImport} />
            </TabsContent>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Questions ({questions.length})</h3>
              {questions.map((q, i) => (
                <div key={i} className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg mb-4 border border-blue-100 dark:border-blue-900">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{q.text}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditQuestion(i)}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50"
                    >
                      Edit
                    </Button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {q.options.map((opt, j) => (
                      <li
                        key={j}
                        className={j === q.correctAnswer ? "text-green-600 dark:text-green-400" : ""}
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep("cover")}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50"
              >
                Back to Cover
              </Button>
              <Button
                onClick={() => isEditing ? setShowUpdateOptions(true) : handleSubmit(false)}
                disabled={questions.length === 0}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isEditing ? "Update Quiz" : "Create Quiz"}
              </Button>
            </div>
          </Tabs>
        </Card>

        {/* Update Options Dialog */}
        {showUpdateOptions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Update Options</h3>
              <p className="mb-6 text-muted-foreground">
                How would you like to update this quiz?
              </p>
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  onClick={() => {
                    setShowUpdateOptions(false);
                    handleSubmit(false);
                  }}
                  variant="outline"
                  className="border-2 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
                >
                  <div className="text-left">
                    <div className="font-medium">Update Existing Quiz</div>
                    <div className="text-sm text-muted-foreground">
                      Modify the current quiz, replacing the original
                    </div>
                  </div>
                </Button>

                <Button 
                  onClick={() => {
                    setShowUpdateOptions(false);
                    handleSubmit(true);
                  }}
                  variant="outline"
                  className="border-2 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all"
                >
                  <div className="text-left">
                    <div className="font-medium">Create a Copy</div>
                    <div className="text-sm text-muted-foreground">
                      Create a new quiz based on these changes
                    </div>
                  </div>
                </Button>

                <Button 
                  onClick={() => setShowUpdateOptions(false)}
                  variant="ghost"
                  className="mt-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}