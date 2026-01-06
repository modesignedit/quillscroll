import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface WelcomeBannerProps {
  gettingStartedSlug?: string;
}

const STORAGE_KEY = "pulse_welcome_dismissed";

export function WelcomeBanner({ gettingStartedSlug }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 mb-8">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-xl" />
      
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Dismiss welcome banner"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Welcome to Pulse!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              New here? Check out our getting started guide to learn how to create and publish your first post.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          {gettingStartedSlug ? (
            <Button asChild size="sm" className="gap-1.5">
              <Link to={`/post/${gettingStartedSlug}`}>
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/auth">
                Sign Up to Start
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
