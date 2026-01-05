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
import { getReadingTimeMinutes } from '@/lib/readingTime';
import { useReadingProgress } from '@/hooks/use-reading-progress';

interface Post {
  id: string;
  title: string;
  content_markdown: string;
  published_at: string | null;
  author_id: string;
  category: string | null;
  tags: string[];
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
          category,
          tags,
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
  const readingTimeMinutes = post ? getReadingTimeMinutes(post.content_markdown) : null;
  const progress = useReadingProgress('post-content');

  return (
    <Layout>
      <div className="fixed inset-x-0 top-[56px] z-30 h-[2px] bg-border/40 md:top-[64px]">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="container px-3 sm:px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-5 px-0 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to feed
          </Button>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : post ? (
            <article className="space-y-6">
              <header className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-3">
                    {post.category && (
                      <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        {post.category}
                      </span>
                    )}
                    <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
                      {post.title}
                    </h1>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground md:text-sm">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <Link
                          to={`/author/${post.author_id}`}
                          className="underline underline-offset-4 decoration-border/60 hover:decoration-primary"
                        >
                          {post.profiles.display_name}
                        </Link>
                      </span>
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(post.published_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                      {readingTimeMinutes && (
                        <span className="text-[0.7rem] uppercase tracking-wide text-muted-foreground md:text-xs">
                          {readingTimeMinutes} min read
                        </span>
                      )}
                    </div>
                  </div>
                  {isAuthor && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/edit/${post.id}`)}
                      className="shrink-0 text-xs md:text-sm"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </header>

              <div id="post-content" className="post-prose">
                <ReactMarkdown>{post.content_markdown}</ReactMarkdown>
              </div>
            </article>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Post not found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
