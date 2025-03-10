import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Quiz } from "@shared/schema";
import { FileDown, Plus, Trash2, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateQuizTemplate } from "@/lib/quiz-template";
import { useEffect } from "react";

export default function HomePage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/logout", { method: "POST" });
    },
    onSuccess: () => {
      window.location.href = "/auth";
    },
  });

  const { data: quizzes, isLoading, refetch } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    queryFn: async () => {
      // Simple direct fetch with no cache-busting
      const response = await fetch("/api/quizzes");
      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }
      const data = await response.json();
      console.log("Fetched quizzes:", data);
      return data;
    },
    staleTime: 1000, // 1 second stale time
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Refresh data when component mounts
  useEffect(() => {
    refetch();

    // Optional refresh every 5 seconds
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  const deleteQuiz = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/quizzes/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Quiz deleted",
        description: "The quiz has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };

  const downloadQuiz = async (quiz: Quiz) => {
    try {
      // Create a deep copy of the quiz data to avoid modifying the original
      const downloadQuiz = JSON.parse(JSON.stringify(quiz));

      // Using original image URLs directly
      // Note: Downloaded quiz will require internet connection to display images

      // Generate HTML using our template with the quiz data
      const htmlContent = generateQuizTemplate(downloadQuiz);

      // Create and download file
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quiz.title}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Quiz downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download quiz",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
      <header className="border-b bg-white/50 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:bg-black/50">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            QuizMaker
          </h1>
          <div className="flex items-center gap-4">
            {user?.isAdmin && (
              <Button variant="outline" asChild>
                <Link href="/admin">Admin Panel</Link>
              </Button>
            )}
            <Button onClick={() => logoutMutation.mutate()}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">My Quizzes</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Link href="/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Quiz
              </Link>
            </Button>
          </div>
        </div>

        {/* Grid is already defined above, removing duplicate grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading quizzes...</p>
          </div>
        ) : (!quizzes || quizzes.length === 0) ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No quizzes yet. Create your first quiz!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes
              .filter((quiz, index, self) =>
                index === self.findIndex(q => q.id === quiz.id)
              )
              .map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {quiz.description || "No description"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {quiz.questions.length} questions
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => downloadQuiz(quiz)}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/quiz/${quiz.id}`}>Take Quiz</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        title="Edit this quiz"
                      >
                        <Link href={`/create?edit=${quiz.id}`}>
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteQuiz(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}