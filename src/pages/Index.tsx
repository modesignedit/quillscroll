import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, User, Search } from 'lucide-react';
import { getReadingTimeMinutes } from '@/lib/readingTime';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { seedLovableDemoPosts } from '@/lib/demoPosts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content_markdown: string;
  published_at: string | null;
  category: string | null;
  tags: string[];
  author_id: string;
  profiles: {
    display_name: string;
  };
}

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: posts, isLoading, isError, error, refetch } = useQuery({
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
          category,
          tags,
          author_id,
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

  const allTags = useMemo(() => {
    if (!posts) return [] as string[];
    const tagSet = new Set<string>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const allCategories = useMemo(() => {
    if (!posts) return [] as string[];
    const categorySet = new Set<string>();
    posts.forEach((post) => {
      if (post.category) categorySet.add(post.category);
    });
    return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [] as Post[];

    return posts.filter((post) => {
      const matchesSearch = searchQuery
        ? (
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (post.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.content_markdown.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : true;

      const matchesTag = activeTag ? post.tags && post.tags.includes(activeTag) : true;

      const matchesCategory = activeCategory ? post.category === activeCategory : true;

      return matchesSearch && matchesTag && matchesCategory;
    });
  }, [posts, searchQuery, activeTag, activeCategory]);

  return (
    <Layout>
      <div className="container px-3 sm:px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Latest Posts
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
              Discover stories, thinking, and expertise from writers on any topic.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts by title, vibe, or content..."
                className="h-9 rounded-full border-border/60 bg-muted/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 shadow-sm focus-visible:ring-1 md:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {(allCategories.length > 0 || allTags.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {allCategories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                      Categories
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(null)}
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium transition ${
                        activeCategory === null
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/60 bg-muted/60 text-muted-foreground hover:border-primary/60 hover:text-foreground'
                      }`}
                    >
                      All
                    </button>
                    {allCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          setActiveCategory((current) =>
                            current === category ? null : category
                          )
                        }
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium transition ${
                          activeCategory === category
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border/60 bg-muted/60 text-muted-foreground hover:border-primary/60 hover:text-foreground'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}

                {allTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                      Tags
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTag(null)}
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium transition ${
                        activeTag === null
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/60 bg-muted/60 text-muted-foreground hover:border-primary/60 hover:text-foreground'
                      }`}
                    >
                      All
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setActiveTag((current) => (current === tag ? null : tag))
                        }
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium transition ${
                          activeTag === tag
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border/60 bg-muted/60 text-muted-foreground hover:border-primary/60 hover:text-foreground'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {isError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  We couldnt load the latest posts. Please check your connection and try again.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="rounded-full px-4"
                >
                  Try again
                </Button>
                {/* Optional debug info:
                <p className="text-[0.7rem] text-muted-foreground/70">
                  {error instanceof Error ? error.message : 'Unexpected error occurred.'}
                </p>
                */}
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="space-y-2 px-3 py-3 md:px-4 md:py-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent className="px-3 pb-3 pt-0 md:px-4 md:pb-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPosts.map((post) => (
                <Link key={post.id} to={`/post/${post.id}`}>
                  <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                    <CardHeader className="space-y-2 px-3 py-3 md:px-4 md:py-4">
                      {post.category && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveCategory((current) =>
                              current === post.category ? null : post.category
                            );
                          }}
                          className="mb-1 inline-flex items-center rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
                        >
                          {post.category}
                        </button>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mb-1 flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveTag((current) => (current === tag ? null : tag));
                              }}
                              className="inline-flex items-center rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                      <CardTitle className="line-clamp-2 text-sm font-semibold md:text-base">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2 text-[0.7rem] text-muted-foreground md:text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/author/${post.author_id}`);
                          }}
                          className="inline-flex items-center gap-1 text-left hover:text-foreground"
                        >
                          <Avatar className="h-5 w-5 border border-border/60">
                            <AvatarFallback className="bg-primary/10 text-[0.6rem] font-medium uppercase">
                              {post.profiles.display_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{post.profiles.display_name}</span>
                        </button>
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
                      <CardContent className="px-3 pb-3 pt-0 md:px-4 md:pb-4">
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10">
                <p className="text-sm text-muted-foreground">
                  No posts found. Try a different vibe.
                </p>

                <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                  {!user && (
                    <Link
                      to="/auth"
                      className="text-xs font-medium text-primary hover:underline sm:text-sm"
                    >
                      Sign up to write the first one →
                    </Link>
                  )}

                  {user && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          toast({ title: 'Loading demo posts…' });
                          const result = await seedLovableDemoPosts(user.id);

                          if (result.alreadySeeded) {
                            toast({
                              title: 'Demo posts already loaded',
                              description: 'Your lovable.dev demo posts are already in your feed.',
                            });
                          } else {
                            toast({
                              title: 'Demo posts added',
                              description: 'We pulled in 7 posts from lovable.dev/blog.',
                            });
                            queryClient.invalidateQueries({ queryKey: ['posts'] });
                          }
                        } catch (error) {
                          console.error('Error seeding demo posts', error);
                          toast({
                            title: 'Error loading demo posts',
                            description: 'Something went wrong while loading demo content.',
                            variant: 'destructive',
                          });
                        }
                      }}
                      className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-primary shadow-sm transition-colors hover:border-primary hover:bg-background sm:text-sm"
                    >
                      Load 7 demo posts from lovable.dev
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
