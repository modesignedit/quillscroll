import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/Layout';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, User, Search } from 'lucide-react';
import { getReadingTimeMinutes } from '@/lib/readingTime';
import { Input } from '@/components/ui/input';

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content_markdown: string;
  published_at: string | null;
  category: string | null;
  tags: string[];
  profiles: {
    display_name: string;
  };
}

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
          category,
          tags,
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

      const matchesTag = activeTag
        ? post.tags && post.tags.includes(activeTag)
        : true;

      const matchesCategory = activeCategory
        ? post.category === activeCategory
        : true;

      return matchesSearch && matchesTag && matchesCategory;
    });
  }, [posts, searchQuery, activeTag, activeCategory]);

  return (
    <Layout>
      <div className="container px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Latest Posts
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover stories, thinking, and expertise from writers on any topic.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts by title, vibe, or content..."
                className="pl-9 text-sm md:text-base"
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
                          ? 'bg-primary text-primary-foreground border-primary'
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
                            ? 'bg-primary text-primary-foreground border-primary'
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
                          ? 'bg-primary text-primary-foreground border-primary'
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
                            ? 'bg-primary text-primary-foreground border-primary'
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
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredPosts.map((post) => (
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
                <p className="text-muted-foreground mb-4">No posts found. Try a different vibe.</p>
                <Link
                  to="/auth"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up to write the first one →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
