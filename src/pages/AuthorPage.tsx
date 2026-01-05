import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getReadingTimeMinutes } from '@/lib/readingTime';

interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
}

interface PostSummary {
  id: string;
  title: string;
  excerpt: string | null;
  content_markdown: string;
  published_at: string | null;
  category: string | null;
  tags: string[];
}

export default function AuthorPage() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['author-profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, bio')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!id,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['author-posts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, excerpt, content_markdown, published_at, category, tags')
        .eq('author_id', id)
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as PostSummary[];
    },
    enabled: !!id,
  });

  const isLoading = profileLoading || postsLoading;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map((i) => (
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
            </div>
          ) : profile ? (
            <>
              <header className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Author
                  </p>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {profile.display_name}
                  </h1>
                </div>
                {profile.bio && (
                  <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                    {profile.bio}
                  </p>
                )}
                {posts && posts.length > 0 && (
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
                    {posts.length} {posts.length === 1 ? 'Post' : 'Posts'}
                  </p>
                )}
              </header>

              {posts && posts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {posts.map((post) => (
                    <Link key={post.id} to={`/post/${post.id}`}>
                      <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                        <CardHeader>
                          {post.category && (
                            <span className="mb-2 inline-flex items-center rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              {post.category}
                            </span>
                          )}
                          {post.tags && post.tags.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1.5">
                              {post.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-3 text-xs">
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
                <p className="text-sm text-muted-foreground">
                  No published posts yet.
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Author not found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
