import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Calendar, User, Edit } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content_markdown: string;
  published_at: string | null;
  author_id: string;
  profiles: {
    display_name: string;
  };
}

export default function Post() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content_markdown,
          published_at,
          author_id,
          profiles (
            display_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Post;
    },
    enabled: !!id,
  });

  const isAuthor = user?.id === post?.author_id;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to feed
          </Button>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : post ? (
            <article className="space-y-6">
              <header className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                      {post.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {post.profiles.display_name}
                      </span>
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(post.published_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAuthor && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/dashboard/edit/${post.id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </header>

              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown>{post.content_markdown}</ReactMarkdown>
              </div>
            </article>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Post not found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
