import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { firecrawlApi } from '@/lib/api/firecrawl';
import ReactMarkdown from 'react-markdown';

export default function FirecrawlTools() {
  const { toast } = useToast();

  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);

  const [mapUrl, setMapUrl] = useState('');
  const [mapLoading, setMapLoading] = useState(false);
  const [mapResult, setMapResult] = useState<any | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setScrapeLoading(true);
    setScrapeResult(null);

    try {
      const response = await firecrawlApi.scrape(scrapeUrl, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      });

      if (response.success) {
        toast({ title: 'Scrape complete', description: 'Content loaded from URL.' });
        setScrapeResult(response.data ?? response);
      } else {
        toast({
          title: 'Scrape failed',
          description: response.error || 'Unable to scrape this URL.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error scraping with Firecrawl', error);
      toast({
        title: 'Scrape error',
        description: 'There was a problem calling the Firecrawl backend.',
        variant: 'destructive',
      });
    } finally {
      setScrapeLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchResult(null);

    try {
      const response = await firecrawlApi.search(searchQuery, { limit: 5 });

      if (response.success) {
        toast({ title: 'Search complete', description: 'Results loaded from Firecrawl.' });
        setSearchResult(response.data ?? response);
      } else {
        toast({
          title: 'Search failed',
          description: response.error || 'Unable to run this search.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching with Firecrawl', error);
      toast({
        title: 'Search error',
        description: 'There was a problem calling the Firecrawl backend.',
        variant: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMap = async (e: React.FormEvent) => {
    e.preventDefault();
    setMapLoading(true);
    setMapResult(null);

    try {
      const response = await firecrawlApi.map(mapUrl, { limit: 200 });

      if (response.success) {
        toast({ title: 'Map complete', description: 'Discovered URLs from this site.' });
        setMapResult(response.data ?? response);
      } else {
        toast({
          title: 'Map failed',
          description: response.error || 'Unable to map this URL.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error mapping with Firecrawl', error);
      toast({
        title: 'Map error',
        description: 'There was a problem calling the Firecrawl backend.',
        variant: 'destructive',
      });
    } finally {
      setMapLoading(false);
    }
  };

  const resolvedScrape = scrapeResult?.data ?? scrapeResult;
  const markdownContent = resolvedScrape?.markdown ?? resolvedScrape?.data?.markdown;
  const htmlContent = resolvedScrape?.html ?? resolvedScrape?.data?.html;

  return (
    <Layout>
      <div className="container px-3 sm:px-4 py-6 md:py-10">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
              Firecrawl Tools
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
              Scrape pages, search the web, and map sites using your connected Firecrawl backend.
            </p>
          </div>

          <Tabs defaultValue="scrape" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scrape">Scrape</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>

            <TabsContent value="scrape" className="mt-4">
              <Card className="border-border/70 bg-card/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Scrape a page</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Fetch clean markdown and HTML from a single URL.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleScrape} className="space-y-3">
                    <Input
                      type="url"
                      placeholder="https://example.com/article"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                    <Button type="submit" disabled={scrapeLoading} className="h-9 text-sm">
                      {scrapeLoading ? 'Scraping…' : 'Scrape URL'}
                    </Button>
                  </form>

                  {markdownContent && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Markdown</p>
                      <div className="prose prose-sm max-w-none dark:prose-invert border border-border/60 rounded-md bg-background/60 p-3 max-h-80 overflow-auto">
                        <ReactMarkdown>{markdownContent}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {!markdownContent && htmlContent && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">HTML</p>
                      <pre className="max-h-80 overflow-auto rounded-md border border-border/60 bg-muted/60 p-3 text-[0.7rem]">
                        {htmlContent}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search" className="mt-4">
              <Card className="border-border/70 bg-card/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Search the web</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Run a Firecrawl search and optionally scrape results.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleSearch} className="space-y-3">
                    <Input
                      placeholder="Search term or question"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                    <Button type="submit" disabled={searchLoading} className="h-9 text-sm">
                      {searchLoading ? 'Searching…' : 'Search'}
                    </Button>
                  </form>

                  {searchResult && Array.isArray(searchResult?.data) && (
                    <div className="space-y-3">
                      {searchResult.data.map((item: any, index: number) => (
                        <div
                          key={item.url ?? index}
                          className="rounded-md border border-border/60 bg-background/60 p-3 space-y-1"
                        >
                          {item.title && (
                            <p className="text-sm font-medium leading-snug">
                              {item.title}
                            </p>
                          )}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary underline underline-offset-4"
                            >
                              {item.url}
                            </a>
                          )}
                          {item.description && (
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="mt-4">
              <Card className="border-border/70 bg-card/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Map a site</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Discover URLs on a domain for quick sitemap-style exploration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleMap} className="space-y-3">
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={mapUrl}
                      onChange={(e) => setMapUrl(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                    <Button type="submit" disabled={mapLoading} className="h-9 text-sm">
                      {mapLoading ? 'Mapping…' : 'Map site'}
                    </Button>
                  </form>

                  {mapResult && Array.isArray((mapResult.data ?? mapResult)?.links) && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Discovered URLs
                      </p>
                      <div className="max-h-80 overflow-auto rounded-md border border-border/60 bg-muted/60 p-3 text-[0.7rem] space-y-1">
                        {(mapResult.data ?? mapResult).links.map((link: string) => (
                          <div key={link} className="truncate">
                            {link}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
