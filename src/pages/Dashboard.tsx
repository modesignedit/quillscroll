import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface DashboardPost {
  id: string;
  title: string;
  is_published: boolean;
  updated_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['user-posts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, is_published, updated_at')
        .eq('author_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as DashboardPost[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Post deleted successfully');
      setDeletePostId(null);
    },
    onError: () => {
      toast.error('Failed to delete post');
    },
  });

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
                Dashboard
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Track your posts, drafts, and publishing flow.
              </p>
            </div>
            <Button
              onClick={() => navigate('/dashboard/new')}
              size="lg"
              className="mt-2 sm:mt-0 shadow-sm"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              New Post
            </Button>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <CardTitle className="text-base md:text-lg font-semibold tracking-tight">
                  Your Posts
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-muted-foreground">
                  {posts?.length || 0} {posts?.length === 1 ? 'post' : 'posts'} total
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="rounded-xl border border-border/70 overflow-hidden bg-card/60 backdrop-blur">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/60">
                        <TableHead className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Title
                        </TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Last Updated
                        </TableHead>
                        <TableHead className="text-right text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id} className="border-b border-border/40 last:border-0">
                          <TableCell className="py-4 align-middle text-sm md:text-base font-medium">
                            {post.title}
                          </TableCell>
                          <TableCell className="py-4 align-middle">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                post.is_published
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {post.is_published ? 'Published' : 'Draft'}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 align-middle text-xs md:text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(post.updated_at), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell className="py-4 align-middle text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => navigate(`/dashboard/edit/${post.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletePostId(post.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    You haven't created any posts yet
                  </p>
                  <Button onClick={() => navigate('/dashboard/new')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create your first post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostId && deleteMutation.mutate(deletePostId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
