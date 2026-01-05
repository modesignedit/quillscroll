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
import { PlusCircle, Edit, Trash2, FileText, Globe2, Twitter, Instagram, Music2, CheckCircle2, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { seedLovableDemoPosts } from '@/lib/demoPosts';
interface DashboardPost {
  id: string;
  title: string;
  is_published: boolean;
  updated_at: string;
  slug: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);

  const {
    data: posts,
    isLoading,
    isError: isPostsError,
    error: postsError,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ['user-posts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, is_published, updated_at, slug')
        .eq('author_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as DashboardPost[];
    },
    enabled: !!user,
  });

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['my-profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'display_name, avatar_url, website_url, twitter_handle, instagram_handle, tiktok_handle'
        )
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const totalPosts = posts?.length ?? 0;
  const publishedPosts = posts?.filter((post) => post.is_published)?.length ?? 0;
  const draftPosts = totalPosts - publishedPosts;
  const lastUpdatedAt = posts?.[0]?.updated_at ?? null;

  const hasCompletedProfile = !!profile && (profile.display_name?.trim().length ?? 0) >= 2;
  const hasWrittenFirstPost = totalPosts > 0;
  const hasLoadedDemoPosts = (posts ?? []).some((post) => post.slug?.startsWith('lovable-demo-'));
  const allOnboardingDone = hasCompletedProfile && hasWrittenFirstPost && hasLoadedDemoPosts;

  const visiblePosts = [...(posts ?? [])]
    .filter((post) => {
      if (statusFilter === 'published') return post.is_published;
      if (statusFilter === 'draft') return !post.is_published;
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.updated_at).getTime();
      const bTime = new Date(b.updated_at).getTime();
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
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

  const handleSeedDemoPosts = async () => {
    if (!user) return;

    try {
      setIsSeedingDemo(true);
      const result = await seedLovableDemoPosts(user.id);

      if (result.alreadySeeded) {
        toast.success('Demo posts already loaded');
      } else {
        toast.success('Demo posts added');
        queryClient.invalidateQueries({ queryKey: ['user-posts'] });
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    } catch (error) {
      console.error('Error seeding demo posts from dashboard', error);
      toast.error('Error loading demo posts');
    } finally {
      setIsSeedingDemo(false);
    }
  };

  return (
    <Layout>
      <div className="container px-3 sm:px-4 py-6 md:py-10">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
                Dashboard
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
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

          {!allOnboardingDone && (
            <Card className="border-dashed border-border/70 bg-card/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-tight sm:text-base">
                  Get set up in a few steps
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground sm:text-sm">
                  Complete these quick tasks so your profile and posts look great to readers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {/* Complete profile */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {hasCompletedProfile ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-medium sm:text-sm">Complete your profile</span>
                        <span className="text-[0.7rem] text-muted-foreground sm:text-xs">
                          Add your name and public links so readers know who you are.
                        </span>
                      </div>
                    </div>
                    {!hasCompletedProfile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/settings')}
                        className="rounded-full px-3 text-xs"
                      >
                        Edit profile
                      </Button>
                    )}
                  </div>

                  {/* Write first post */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {hasWrittenFirstPost ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-medium sm:text-sm">Write your first post</span>
                        <span className="text-[0.7rem] text-muted-foreground sm:text-xs">
                          Draft and publish something small to test your writing flow.
                        </span>
                      </div>
                    </div>
                    {!hasWrittenFirstPost && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => navigate('/dashboard/new')}
                        className="rounded-full px-3 text-xs"
                      >
                        Start writing
                      </Button>
                    )}
                  </div>

                  {/* Load demo posts */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {hasLoadedDemoPosts ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-medium sm:text-sm">Load demo posts</span>
                        <span className="text-[0.7rem] text-muted-foreground sm:text-xs">
                          Pull in a few example posts from lovable.dev to see the layout filled out.
                        </span>
                      </div>
                    </div>
                    {!hasLoadedDemoPosts && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSeedingDemo}
                        onClick={handleSeedDemoPosts}
                        className="rounded-full px-3 text-xs"
                      >
                        {isSeedingDemo ? 'Loading…' : 'Load demos'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {isProfileLoading ? (
            <Card className="border-border/70 bg-card/50 shadow-sm">
              <CardContent className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
                <Skeleton className="h-11 w-11 rounded-full sm:h-12 sm:w-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </CardContent>
            </Card>
          ) : isProfileError ? (
            <Card className="border-border/70 bg-card/50 shadow-sm">
              <CardContent className="flex flex-col items-start justify-between gap-3 px-3 py-3 sm:flex-row sm:items-center sm:px-4 sm:py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">We couldnt load your profile.</p>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Please check your connection and try again.
                  </p>
                  {/* Optional debug info:
                  <p className="text-[0.7rem] text-muted-foreground/70">
                    {profileError instanceof Error ? profileError.message : 'Unexpected error.'}
                  </p>
                  */}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetchProfile()}
                  className="rounded-full px-4"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : profile ? (
            <Card className="border-border/70 bg-card/50 shadow-sm">
              <CardContent className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-11 w-11 border border-border/60 shadow-sm sm:h-12 sm:w-12">
                    {profile.avatar_url ? (
                      <AvatarImage
                        src={profile.avatar_url}
                        alt={profile.display_name || user?.email || 'Author avatar'}
                      />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-xs font-medium uppercase sm:text-sm">
                        {(profile.display_name || user?.email || '?').charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      You appear as
                    </p>
                    <p className="text-sm font-semibold leading-tight sm:text-base">
                      {profile.display_name}
                    </p>
                    <p className="text-[0.7rem] text-muted-foreground sm:text-xs">
                      This is how readers see you on your author page and posts.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  {(() => {
                    const website = profile.website_url?.trim();
                    const twitter = profile.twitter_handle?.trim();
                    const instagram = profile.instagram_handle?.trim();
                    const tiktok = profile.tiktok_handle?.trim();

                    let href: string | null = null;
                    let label: string | null = null;
                    let Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | null = null;

                    if (website) {
                      const normalized = website.startsWith('http') ? website : `https://${website}`;
                      href = normalized;
                      try {
                        const url = new URL(normalized);
                        label = url.hostname.replace('www.', '');
                      } catch {
                        label = website;
                      }
                      Icon = Globe2;
                    } else if (twitter) {
                      const handle = twitter.replace(/^@/, '');
                      href = `https://twitter.com/${handle}`;
                      label = `@${handle}`;
                      Icon = Twitter;
                    } else if (instagram) {
                      const handle = instagram.replace(/^@/, '');
                      href = `https://instagram.com/${handle}`;
                      label = `@${handle}`;
                      Icon = Instagram;
                    } else if (tiktok) {
                      const handle = tiktok.replace(/^@/, '');
                      href = `https://www.tiktok.com/@${handle}`;
                      label = `@${handle}`;
                      Icon = Music2;
                    }

                    if (!href || !label || !Icon) {
                      return (
                        <div className="text-[0.7rem] text-muted-foreground sm:text-xs">
                          No public links yet.{' '}
                          <button
                            type="button"
                            onClick={() => navigate('/settings')}
                            className="underline underline-offset-4 hover:text-foreground"
                          >
                            Add your website or socials.
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col items-start gap-1 text-[0.7rem] text-muted-foreground sm:items-end sm:text-xs">
                        <span className="uppercase tracking-[0.16em]">
                          Primary link
                        </span>
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[0.7rem] font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-background hover:text-primary sm:text-xs"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[180px] sm:max-w-[220px]">
                            {label}
                          </span>
                        </a>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!isLoading && posts && posts.length > 0 && (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
              <Card className="border-border/60 bg-card/60 shadow-sm">
                <CardContent className="px-3 py-3 sm:px-4 sm:py-4">
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Total posts
                  </p>
                  <p className="mt-1 text-xl font-semibold sm:text-2xl">{totalPosts}</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/60 shadow-sm">
                <CardContent className="px-3 py-3 sm:px-4 sm:py-4">
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Published / Drafts
                  </p>
                  <p className="mt-1 text-xl font-semibold sm:text-2xl">
                    {publishedPosts}
                    <span className="mx-1 text-sm text-muted-foreground">/</span>
                    {draftPosts}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/60 shadow-sm">
                <CardContent className="px-3 py-3 sm:px-4 sm:py-4">
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Last updated
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lastUpdatedAt
                      ? formatDistanceToNow(new Date(lastUpdatedAt), { addSuffix: true })
                      : 'No posts yet'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-border/70 bg-card/40 shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight sm:text-base md:text-lg">
                  Your Posts
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground sm:text-sm md:text-base">
                  {posts?.length || 0} {posts?.length === 1 ? 'post' : 'posts'} total
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-muted-foreground sm:text-xs">
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-[0.16em]">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                    className="rounded-lg border border-border bg-background/80 px-2 py-1 text-[0.7rem] sm:text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="draft">Drafts</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-[0.16em]">Sort</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                    className="rounded-lg border border-border bg-background/80 px-2 py-1 text-[0.7rem] sm:text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </div>
              </div>
            </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : isPostsError ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  We couldnt load your posts. Please check your connection and try again.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetchPosts()}
                  className="rounded-full px-4"
                >
                  Retry
                </Button>
                {/* Optional debug info:
                <p className="text-[0.7rem] text-muted-foreground/70">
                  {postsError instanceof Error ? postsError.message : 'Unexpected error.'}
                </p>
                */}
              </div>
            ) : posts && posts.length > 0 ? (
              visiblePosts.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-border/70 bg-card/40 backdrop-blur-sm">
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
                      {visiblePosts.map((post) => (
                        <TableRow key={post.id} className="border-b border-border/40 last:border-0">
                          <TableCell className="py-3 align-middle text-sm font-medium md:text-base">
                            {post.title}
                          </TableCell>
                          <TableCell className="py-3 align-middle">
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
                          <TableCell className="py-3 align-middle text-[0.7rem] text-muted-foreground sm:text-xs md:text-sm">
                            {formatDistanceToNow(new Date(post.updated_at), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell className="py-3 align-middle text-right">
                            <div className="flex justify-end gap-1.5 sm:gap-2">
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
                  <p className="text-muted-foreground mb-2">No posts match your filters</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setSortOrder('desc');
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              )
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
