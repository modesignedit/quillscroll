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

const GETTING_STARTED_POST = {
  title: 'Getting Started with Pulse in 5 Minutes',
  slug: 'getting-started-with-pulse-in-5-minutes',
  excerpt:
    'New to Pulse? A quick tour of how to set up your profile, write your first post, and use the AI helpers in under five minutes.',
  category: 'Guides',
  tags: ['onboarding', 'getting-started'],
  content_markdown:
    '# Getting Started with Pulse in 5 Minutes\n\nWelcome to **Pulse** — a quill-and-scroll home for modern creators.\n\nThis short guide walks you through your first five minutes on Pulse so you can:\n- Set up your creator profile\n- Write and polish your first post\n- Publish and share your work\n\n---\n\n## 1. Sign up and land on your dashboard\n\n1. Go to the Pulse homepage and choose to sign up or start writing.\n2. Create your account and you\'ll land on your dashboard.\n3. From here you can see your posts, drafts, and a quick overview of your writing.\n\n---\n\n## 2. Set up your creator profile (2 minutes)\n\nYour profile is your public author page — the link you\'ll share when people ask where to read your work.\n\n1. Open your profile or settings page.\n2. Add a display name, a short bio, and an avatar image.\n3. Optionally add your website or social links.\n\nNow you have a simple, shareable home for your writing.\n\n---\n\n## 3. Draft your first post (2 minutes)\n\n1. From the dashboard, click **New Post** or **Start writing**.\n2. Give your post a working title and start typing in the editor.\n3. Write a quick note about what you want to use Pulse for, or a short reflection that\'s on your mind.\n\nDon\'t overthink it — this first post is just to feel the writing flow.\n\n---\n\n## 4. Use AI to polish title and summary (1 minute)\n\nPulse includes a small AI helper to make your post easier to share.\n\n- After drafting, use the AI option in the editor to suggest a title and short summary.\n- Keep what you like, edit what you don\'t, or ignore it entirely.\n\nThink of it as a friendly assistant, not a replacement for your voice.\n\n---\n\n## 5. Preview, publish, and share\n\n1. Preview your post to see how it will look to readers.\n2. When you\'re ready, publish it.\n3. Visit your author profile and copy the link to share with a friend or on social.\n\n---\n\n## What to explore next\n\n- Write a second post from a tweet, note, or idea you\'ve saved.\n- Experiment with categories and tags to group your writing.\n- Update your profile as your writing identity evolves.\n\nPulse is designed to be a calm, focused space for your words. Whenever you have something to say, open a new post and start typing. Happy writing.',
} as const;

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

  const { data: gettingStartedExisting, error: gettingStartedError } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', GETTING_STARTED_POST.slug)
    .eq('author_id', authorId)
    .limit(1);

  if (existingError) {
    console.error('Error checking existing demo posts:', existingError);
  }

  if (gettingStartedError) {
    console.error('Error checking getting started post:', gettingStartedError);
  }

  const hadDemoPosts = !!existing && existing.length > 0;
  const hadGettingStartedPost = !!gettingStartedExisting && gettingStartedExisting.length > 0;

  const now = new Date().toISOString();

  if (!hadDemoPosts) {
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
  }

  if (!hadGettingStartedPost) {
    const { error: gettingStartedInsertError } = await supabase.from('posts').insert([
      {
        author_id: authorId,
        title: GETTING_STARTED_POST.title,
        slug: GETTING_STARTED_POST.slug,
        content_markdown: GETTING_STARTED_POST.content_markdown,
        excerpt: GETTING_STARTED_POST.excerpt,
        is_published: true,
        published_at: now,
        tags: [...GETTING_STARTED_POST.tags],
        category: GETTING_STARTED_POST.category,
      },
    ]);

    if (gettingStartedInsertError) {
      console.error('Error inserting getting started guide post:', gettingStartedInsertError);
    }
  }

  return { alreadySeeded: hadDemoPosts && hadGettingStartedPost };
}
