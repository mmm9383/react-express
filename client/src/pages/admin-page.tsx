import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p>You do not have permission to access this page.</p>
            <Button asChild className="mt-4">
              <Link href="/">Go Back</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deleteUser = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {users?.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium">{u.username}</p>
                    <p className="text-sm text-muted-foreground">
                      Last login: {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div>
                    {u.isAdmin ? (
                      <span className="text-sm text-primary">Admin</span>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteUser(u.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
