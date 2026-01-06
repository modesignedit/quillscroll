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
  } | null;
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
      {/* Reading progress bar */}
      <div className="fixed inset-x-0 top-[56px] z-30 h-1 bg-muted/50 md:top-[64px]">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-[width] duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container px-4 py-10 sm:py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="group mb-8 -ml-2 gap-2 text-muted-foreground hover:text-foreground hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm">Back</span>
          </Button>

          {isLoading ? (
            <div className="space-y-8 animate-pulse">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="pt-8 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ) : isError ? (
            <div className="py-20 text-center space-y-6">
              <p className="text-muted-foreground">
                Couldn't load this post
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                  Go back
                </Button>
                <Button size="sm" onClick={() => refetch()}>
                  Try again
                </Button>
              </div>
            </div>
          ) : post ? (
            <article className="animate-fade-in">
              {/* Header */}
              <header className="mb-10 space-y-6">
                {/* Category badge */}
                {post.category && (
                  <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {post.category}
                  </span>
                )}

                {/* Title */}
                <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                  {post.title}
                </h1>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <Link
                    to={`/author/${post.author_id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {post.profiles?.display_name ?? 'Anonymous'}
                  </Link>
                  <span className="text-muted-foreground/40">·</span>
                  {post.published_at && (
                    <>
                      <span>
                        {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                    </>
                  )}
                  {readingTimeMinutes && (
                    <span>{readingTimeMinutes} min read</span>
                  )}
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions row */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <ShareButtons title={post.title} />
                  
                  {isAuthor && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dashboard/edit/${post.id}`)}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-destructive"
                        onClick={() => setIsDeleteOpen(true)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  )}
                </div>
              </header>

              {/* Content */}
              <div id="post-content" className="post-prose">
                <ReactMarkdown>{post.content_markdown}</ReactMarkdown>
              </div>

              {/* Author card */}
              <footer className="mt-16 pt-8 border-t border-border/50">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-border">
                    {post.profiles?.avatar_url ? (
                      <AvatarImage
                        src={post.profiles.avatar_url}
                        alt={post.profiles?.display_name ?? 'Author'}
                      />
                    ) : (
                      <AvatarFallback className="bg-muted text-sm font-medium">
                        {post.profiles?.display_name?.charAt(0) ?? 'A'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Written by</p>
                    <Link
                      to={`/author/${post.author_id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {post.profiles?.display_name ?? 'Anonymous'}
                    </Link>
                    {post.profiles?.bio && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {post.profiles.bio}
                      </p>
                    )}
                    
                    {/* Social links */}
                    {post.profiles && (
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        {post.profiles.website_url && (
                          <a
                            href={post.profiles.website_url.startsWith('http') ? post.profiles.website_url : `https://${post.profiles.website_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Globe2 className="h-4 w-4" />
                          </a>
                        )}
                        {post.profiles.twitter_handle && (
                          <a
                            href={`https://twitter.com/${post.profiles.twitter_handle.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Twitter className="h-4 w-4" />
                          </a>
                        )}
                        {post.profiles.instagram_handle && (
                          <a
                            href={`https://instagram.com/${post.profiles.instagram_handle.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Instagram className="h-4 w-4" />
                          </a>
                        )}
                        {post.profiles.tiktok_handle && (
                          <a
                            href={`https://www.tiktok.com/@${post.profiles.tiktok_handle.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Music2 className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </footer>

              {/* Delete dialog */}
              <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently remove the post.
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
            <div className="py-20 text-center space-y-4">
              <p className="text-muted-foreground">Post not found</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                Go back
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
