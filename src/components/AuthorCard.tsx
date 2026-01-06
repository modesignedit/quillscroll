import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Globe2, Twitter, Instagram, Music2 } from 'lucide-react';

interface AuthorCardProps {
  authorId: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  websiteUrl?: string | null;
  twitterHandle?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  compact?: boolean;
}

export function AuthorCard({
  authorId,
  displayName,
  avatarUrl,
  bio,
  websiteUrl,
  twitterHandle,
  instagramHandle,
  tiktokHandle,
  compact = false,
}: AuthorCardProps) {
  const hasSocialLinks = websiteUrl || twitterHandle || instagramHandle || tiktokHandle;

  if (compact) {
    return (
      <Link
        to={`/author/${authorId}`}
        className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-2 py-1 transition hover:border-primary/40 hover:bg-muted/60"
        onClick={(e) => e.stopPropagation()}
      >
        <Avatar className="h-5 w-5 border border-border/60">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName} />
          ) : (
            <AvatarFallback className="bg-primary/10 text-[0.55rem] font-medium uppercase">
              {displayName.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
        <span className="text-[0.7rem] font-medium text-muted-foreground group-hover:text-foreground">
          {displayName}
        </span>
        {hasSocialLinks && (
          <div className="flex items-center gap-0.5 text-muted-foreground/60">
            {websiteUrl && <Globe2 className="h-2.5 w-2.5" />}
            {twitterHandle && <Twitter className="h-2.5 w-2.5" />}
            {instagramHandle && <Instagram className="h-2.5 w-2.5" />}
            {tiktokHandle && <Music2 className="h-2.5 w-2.5" />}
          </div>
        )}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/40 p-3">
      <div className="flex items-center gap-3">
        <Link to={`/author/${authorId}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-10 w-10 border border-border/60 shadow-sm transition hover:ring-2 hover:ring-primary/30">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-xs font-medium uppercase">
                {displayName.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1 space-y-0.5">
          <Link
            to={`/author/${authorId}`}
            onClick={(e) => e.stopPropagation()}
            className="block truncate text-sm font-semibold tracking-tight hover:text-primary"
          >
            {displayName}
          </Link>
          {bio && (
            <p className="line-clamp-2 text-[0.7rem] text-muted-foreground">
              {bio}
            </p>
          )}
        </div>
      </div>

      {hasSocialLinks && (
        <div className="flex flex-wrap gap-1.5">
          {websiteUrl && (
            <a
              href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
            >
              <Globe2 className="h-3 w-3" />
              <span>Website</span>
            </a>
          )}
          {twitterHandle && (
            <a
              href={`https://twitter.com/${twitterHandle.replace(/^@/, '')}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
            >
              <Twitter className="h-3 w-3" />
              <span>@{twitterHandle.replace(/^@/, '')}</span>
            </a>
          )}
          {instagramHandle && (
            <a
              href={`https://instagram.com/${instagramHandle.replace(/^@/, '')}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
            >
              <Instagram className="h-3 w-3" />
              <span>@{instagramHandle.replace(/^@/, '')}</span>
            </a>
          )}
          {tiktokHandle && (
            <a
              href={`https://www.tiktok.com/@${tiktokHandle.replace(/^@/, '')}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
            >
              <Music2 className="h-3 w-3" />
              <span>@{tiktokHandle.replace(/^@/, '')}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
