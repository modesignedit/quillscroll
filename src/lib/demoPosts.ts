import { supabase } from '@/integrations/supabase/client';
import { firecrawlApi } from '@/lib/api/firecrawl';

export type DemoPostSource = {
  url: string;
  tags: string[];
  category: string;
};

const DEMO_POST_SOURCES: DemoPostSource[] = [
  {
    url: 'https://lovable.dev/blog/introducing-lovable',
    tags: ['product', 'launch'],
    category: 'Lovable Demo',
  },
  {
    url: 'https://lovable.dev/blog/building-apps-with-ai',
    tags: ['ai', 'builder'],
    category: 'AI',
  },
  {
    url: 'https://lovable.dev/blog/designing-with-ai',
    tags: ['design', 'ai'],
    category: 'Design',
  },
  {
    url: 'https://lovable.dev/blog/developer-experience',
    tags: ['developer', 'dx'],
    category: 'Engineering',
  },
  {
    url: 'https://lovable.dev/blog/product-updates-q4',
    tags: ['updates'],
    category: 'Updates',
  },
  {
    url: 'https://lovable.dev/blog/customer-stories',
    tags: ['stories'],
    category: 'Stories',
  },
  {
    url: 'https://lovable.dev/blog/future-of-building',
    tags: ['future', 'vision'],
    category: 'Lovable Demo',
  },
];

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

export function buildExcerpt(markdown?: string, summary?: string, maxLength = 220): string | null {
  const source =
    summary ||
    markdown
      ?.split('\n')
      .find((line) => line.trim().length > 40 && !line.trim().startsWith('#'));

  if (!source) return null;

  const plain = source.replace(/[#*_`>]/g, '').trim();
  if (plain.length <= maxLength) return plain;

  return plain.slice(0, maxLength).trimEnd() + '…';
}

export async function seedLovableDemoPosts(authorId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('posts')
    .select('id')
    .like('slug', 'lovable-demo-%')
    .eq('author_id', authorId)
    .limit(1);

  if (existingError) {
    console.error('Error checking existing demo posts:', existingError);
  }

  if (existing && existing.length > 0) {
    return { alreadySeeded: true };
  }

  const now = new Date().toISOString();

  for (const [index, source] of DEMO_POST_SOURCES.entries()) {
    try {
      const scrape = await firecrawlApi.scrape(source.url, {
        formats: ['markdown', 'summary'],
        onlyMainContent: true,
      });

      if (!scrape.success) {
        console.error('Scrape failed for', source.url, scrape.error);
        continue;
      }

      const root = (scrape as any).data || scrape;

      const markdown = root.markdown as string | undefined;
      const summary = root.summary as string | undefined;
      const metadata = (root as any).metadata || {};

      const title: string = metadata.title || `Lovable Demo Post ${index + 1}`;
      const slug = `lovable-demo-${generateSlug(title)}`;

      const excerpt = buildExcerpt(markdown, summary) ?? summary ?? null;

      const { error: insertError } = await supabase.from('posts').insert({
        author_id: authorId,
        title,
        slug,
        content_markdown: markdown || summary || '# Demo Post',
        excerpt,
        is_published: true,
        published_at: now,
        tags: source.tags,
        category: source.category,
      });

      if (insertError) {
        console.error('Error inserting demo post:', insertError, { title });
      }
    } catch (error) {
      console.error('Error seeding demo post from', source.url, error);
    }
  }

  return { alreadySeeded: false };
}
