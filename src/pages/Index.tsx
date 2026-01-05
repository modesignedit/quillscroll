import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/Layout';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, User } from 'lucide-react';
import { getReadingTimeMinutes } from '@/lib/readingTime';

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content_markdown: string;
  published_at: string | null;
  profiles: {
    display_name: string;
  };
}

export default function Index() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          excerpt,
          content_markdown,
          published_at,
          profiles (
            display_name
          )
        `)
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
  });

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Latest Posts
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover stories, thinking, and expertise from writers on any topic.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <Link key={post.id} to={`/post/${post.id}`}>
                  <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.profiles.display_name}
                        </span>
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(post.published_at), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                        <span className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                          {getReadingTimeMinutes(post.content_markdown)} min read
                        </span>
                      </CardDescription>
                    </CardHeader>
                    {post.excerpt && (
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No posts yet. Be the first to write!</p>
                <Link
                  to="/auth"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up to get started →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
