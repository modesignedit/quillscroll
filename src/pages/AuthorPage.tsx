import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, User, Globe2, Instagram, Twitter, Music2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getReadingTimeMinutes } from '@/lib/readingTime';

interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  created_at?: string;
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
        .select('id, display_name, bio, avatar_url, website_url, twitter_handle, instagram_handle, tiktok_handle, created_at')
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
      <div className="container px-3 sm:px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid gap-5 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
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
              <header className="space-y-6">
                <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-b from-background via-background to-muted/60 p-5 md:p-7">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4 md:gap-6">
                      <Avatar className="h-16 w-16 border border-border/60 shadow-sm md:h-20 md:w-20">
                        {profile.avatar_url ? (
                          <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                        ) : (
                          <AvatarFallback>
                            {profile.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="space-y-2">
                        <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                          Author
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                          {profile.display_name}
                        </h1>
                        {profile.bio && (
                          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                            {profile.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-3 text-[0.7rem] text-muted-foreground md:items-end md:text-xs">
                      <div className="flex flex-wrap items-center gap-4">
                        {posts && (
                          <span>
                            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                          </span>
                        )}
                        {profile.created_at && (
                          <span>
                            Joined{' '}
                            {new Date(profile.created_at).toLocaleString(undefined, {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.website_url && (
                          <a
                            href={
                              profile.website_url.startsWith('http')
                                ? profile.website_url
                                : `https://${profile.website_url}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
                          >
                            <Globe2 className="h-3.5 w-3.5" />
                            <span>Website</span>
                          </a>
                        )}
                        {profile.twitter_handle && (
                          <a
                            href={`https://twitter.com/${profile.twitter_handle.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
                          >
                            <Twitter className="h-3.5 w-3.5" />
                            <span>@{profile.twitter_handle.replace(/^@/, '')}</span>
                          </a>
                        )}
                        {profile.instagram_handle && (
                          <a
                            href={`https://instagram.com/${profile.instagram_handle.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
                          >
                            <Instagram className="h-3.5 w-3.5" />
                            <span>@{profile.instagram_handle.replace(/^@/, '')}</span>
                          </a>
                        )}
                        {profile.tiktok_handle && (
                          <a
                            href={`https://www.tiktok.com/@${profile.tiktok_handle.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
                          >
                            <Music2 className="h-3.5 w-3.5" />
                            <span>@{profile.tiktok_handle.replace(/^@/, '')}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {posts && posts.length > 0 && (
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                    Posts by {profile.display_name}
                  </p>
                )}
              </header>

              {posts && posts.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2">
                  {posts.map((post) => (
                    <Link key={post.id} to={`/post/${post.id}`}>
                      <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader className="space-y-2">
                          {post.category && (
                            <span className="mb-1 inline-flex items-center rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              {post.category}
                            </span>
                          )}
                          {post.tags && post.tags.length > 0 && (
                            <div className="mb-1 flex flex-wrap gap-1.5">
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
                          <CardTitle className="line-clamp-2 text-base md:text-lg">
                            {post.title}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-3 text-[0.7rem] text-muted-foreground md:text-xs">
                            {post.published_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(new Date(post.published_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                            <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                              {getReadingTimeMinutes(post.content_markdown)} min read
                            </span>
                          </CardDescription>
                        </CardHeader>
                        {post.excerpt && (
                          <CardContent>
                            <p className="line-clamp-3 text-[0.8rem] text-muted-foreground md:text-sm">
                              {post.excerpt}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No published posts yet.</p>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Author not found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
