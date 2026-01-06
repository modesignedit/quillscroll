import { useState } from 'react';
import { Twitter, Linkedin, Link2, Check, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
interface ShareButtonsProps {
  title: string;
  url?: string;
}
export function ShareButtons({
  title,
  url
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copied to clipboard'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy link',
        variant: 'destructive'
      });
    }
  };
  const shareOnTwitter = () => {
    const text = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`, '_blank', 'noopener,noreferrer');
  };
  const shareOnLinkedIn = () => {
    const encodedUrl = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank', 'noopener,noreferrer');
  };
  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${title} ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };
  const shareViaEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`Check out this post: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Share
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={shareOnTwitter}
          className="h-9 w-9 rounded-full text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:shadow-md"
          aria-label="Share on Twitter"
        >
          <Twitter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={shareOnLinkedIn}
          className="h-9 w-9 rounded-full text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:shadow-md"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={shareOnWhatsApp}
          className="h-9 w-9 rounded-full text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:shadow-md"
          aria-label="Share on WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={shareViaEmail}
          className="h-9 w-9 rounded-full text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-primary/10 hover:text-primary hover:shadow-md"
          aria-label="Share via Email"
        >
          <Mail className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyLink}
          className={`h-9 w-9 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md ${
            copied
              ? 'bg-green-500/10 text-green-500'
              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
          }`}
          aria-label="Copy link"
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}