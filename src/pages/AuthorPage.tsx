import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
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

  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    if (!posts) return [] as PostSummary[];

    return posts.filter((post) => {
      const matchesTag = activeTag ? post.tags && post.tags.includes(activeTag) : true;
      const matchesCategory = activeCategory ? post.category === activeCategory : true;
      return matchesTag && matchesCategory;
    });
  }, [posts, activeTag, activeCategory]);

  const isLoadingCombined = profileLoading || postsLoading;

  return (
    <Layout>
      <div className="container px-3 sm:px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {isLoadingCombined ? (
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
                {filteredPosts && filteredPosts.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-muted-foreground md:text-xs">
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
              </header>

              {filteredPosts && filteredPosts.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2">
                  {filteredPosts.map((post) => (
                    <Link key={post.id} to={`/post/${post.id}`}>
                      <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader className="space-y-2">
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
