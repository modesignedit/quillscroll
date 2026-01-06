import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Calendar, User, Edit, Globe2, Instagram, Twitter, Music2, Trash2 } from 'lucide-react';
import { ShareButtons } from '@/components/ShareButtons';
import { getReadingTimeMinutes } from '@/lib/readingTime';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';
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
import { toast } from '@/hooks/use-toast';

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
    bio: string | null;
    avatar_url: string | null;
    website_url: string | null;
    twitter_handle: string | null;
    instagram_handle: string | null;
    tiktok_handle: string | null;
  };
}

export default function Post() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!post) throw new Error('Post not loaded');
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });

      toast({
        title: 'Post deleted',
        description: 'Your post was deleted successfully.',
      });

      setIsDeleteOpen(false);
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Error deleting post', error);
      toast({
        title: 'Error deleting post',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const {
    data: post,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
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
            display_name,
            bio,
            avatar_url,
            website_url,
            twitter_handle,
            instagram_handle,
            tiktok_handle
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
      <div className="fixed inset-x-0 top-[56px] z-30 h-[3px] bg-border/40 md:top-[64px]">
        <div
          className="h-full bg-primary shadow-glow transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="container px-3 sm:px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="group mb-6 px-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to feed
          </Button>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : isError ? (
            <div className="py-12 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                We couldnt load this post. Please check your connection and try again.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="rounded-full px-4"
                >
                  Back to feed
                </Button>
                <Button
                  size="sm"
                  onClick={() => refetch()}
                  className="rounded-full px-4"
                >
                  Try again
                </Button>
              </div>
              {/* Optional debug info:
              <p className="text-[0.7rem] text-muted-foreground/70">
                {error instanceof Error ? error.message : 'Unexpected error occurred.'}
              </p>
              */}
            </div>
          ) : post ? (
            <article className="space-y-8 animate-fade-in">
              <header className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-4">
                    {post.category && (
                      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary shadow-sm">
                        {post.category}
                      </span>
                    )}
                    <h1 className="break-words font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
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
                    <div className="pt-2">
                      <ShareButtons title={post.title} />
                    </div>
                  </div>
                  {isAuthor && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/edit/${post.id}`)}
                        className="shrink-0 text-xs md:text-sm"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs text-destructive hover:text-destructive"
                        onClick={() => setIsDeleteOpen(true)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </header>

              <div id="post-content" className="post-prose">
                <ReactMarkdown>{post.content_markdown}</ReactMarkdown>
              </div>

              <section className="mt-12 rounded-2xl border border-border/70 bg-gradient-to-br from-muted/60 to-muted/30 p-6 md:p-8 shadow-sm">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4 md:gap-5">
                    <Avatar className="h-14 w-14 border-2 border-border/60 shadow-md md:h-16 md:w-16 ring-2 ring-primary/10">
                      {post.profiles.avatar_url ? (
                        <AvatarImage
                          src={post.profiles.avatar_url}
                          alt={post.profiles.display_name}
                        />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-xs font-medium uppercase">
                          {post.profiles.display_name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        About the author
                      </p>
                      <Link
                        to={`/author/${post.author_id}`}
                        className="text-sm font-semibold tracking-tight underline-offset-4 hover:underline md:text-base"
                      >
                        {post.profiles.display_name}
                      </Link>
                      {post.profiles.bio && (
                        <p className="max-w-xl text-xs text-muted-foreground md:text-sm">
                          {post.profiles.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 text-[0.7rem] text-muted-foreground md:items-end md:text-xs">
                    <div className="flex flex-wrap gap-2">
                      {post.profiles.website_url && (
                        <a
                          href={post.profiles.website_url.startsWith('http') ? post.profiles.website_url : `https://${post.profiles.website_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
                        >
                          <Globe2 className="h-3.5 w-3.5" />
                          <span>Website</span>
                        </a>
                      )}
                      {post.profiles.twitter_handle && (
                        <a
                          href={`https://twitter.com/${post.profiles.twitter_handle.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
                        >
                          <Twitter className="h-3.5 w-3.5" />
                          <span>@{post.profiles.twitter_handle.replace(/^@/, '')}</span>
                        </a>
                      )}
                      {post.profiles.instagram_handle && (
                        <a
                          href={`https://instagram.com/${post.profiles.instagram_handle.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
                        >
                          <Instagram className="h-3.5 w-3.5" />
                          <span>@{post.profiles.instagram_handle.replace(/^@/, '')}</span>
                        </a>
                      )}
                      {post.profiles.tiktok_handle && (
                        <a
                          href={`https://www.tiktok.com/@${post.profiles.tiktok_handle.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
                        >
                          <Music2 className="h-3.5 w-3.5" />
                          <span>@{post.profiles.tiktok_handle.replace(/^@/, '')}</span>
                        </a>
                      )}
                    </div>
                    <Link
                      to={`/author/${post.author_id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View more from {post.profiles.display_name} 
                    </Link>
                  </div>
                </div>
              </section>

              <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently remove the post from your
                      dashboard and public feed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </article>
          ) : (
            <div className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">Post not found</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="rounded-full px-4"
              >
                Back to feed
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
