import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  excerpt: z.string().max(300, 'Excerpt too long').optional(),
  content_markdown: z.string().min(10, 'Content must be at least 10 characters'),
});

type PostFormData = z.infer<typeof postSchema>;

export default function PostEditor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const isEditMode = !!id;

  const { data: existingPost } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('author_id', user!.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEditMode && !!user,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
  });

  useEffect(() => {
    if (existingPost) {
      setValue('title', existingPost.title);
      setValue('excerpt', existingPost.excerpt || '');
      setValue('content_markdown', existingPost.content_markdown);
    }
  }, [existingPost, setValue]);

  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const saveMutation = useMutation({
    mutationFn: async (data: PostFormData & { is_published: boolean }) => {
      const slug = createSlug(data.title);
      const postData = {
        title: data.title,
        excerpt: data.excerpt || null,
        content_markdown: data.content_markdown,
        slug,
        author_id: user!.id,
        is_published: data.is_published,
        published_at: data.is_published ? new Date().toISOString() : null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('posts').insert([postData]);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success(
        variables.is_published
          ? 'Post published successfully!'
          : 'Post saved as draft'
      );
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save post');
    },
  });

  const onSubmit = (data: PostFormData, isPublished: boolean) => {
    saveMutation.mutate({ ...data, is_published: isPublished });
  };

  const currentContent = watch('content_markdown');

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>

          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Give your post a great title..."
                className="text-2xl font-bold"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (optional)</Label>
              <Textarea
                id="excerpt"
                placeholder="A brief summary of your post..."
                rows={2}
                {...register('excerpt')}
              />
              {errors.excerpt && (
                <p className="text-sm text-destructive">{errors.excerpt.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="write" className="mt-4">
                  <Textarea
                    placeholder="Write your post in Markdown..."
                    rows={20}
                    className="font-mono"
                    {...register('content_markdown')}
                  />
                  {errors.content_markdown && (
                    <p className="text-sm text-destructive mt-2">
                      {errors.content_markdown.message}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="prose prose-lg dark:prose-invert max-w-none">
                        <ReactMarkdown>{currentContent || '*No content yet*'}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit((data) => onSubmit(data, false))}
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={handleSubmit((data) => onSubmit(data, true))}
                disabled={isSubmitting}
              >
                Publish
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
