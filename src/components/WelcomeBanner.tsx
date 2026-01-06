import { useState, useEffect } from "react";
import { X, Zap, ArrowRight, Sparkles } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6 sm:p-8 mb-8 shadow-xl">
      {/* Animated background blobs */}
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 blur-3xl animate-pulse" />
      <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-gradient-to-tr from-accent/30 to-accent/5 blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute right-1/4 top-1/2 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
      
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-all duration-200"
        aria-label="Dismiss welcome banner"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Content */}
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
            <Zap className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">Hey there! 👋</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                New
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Welcome to Pulse! Ready to share your story with the world? Check out our quick guide to get started.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 sm:shrink-0">
          {gettingStartedSlug ? (
            <Button asChild size="lg" className="rounded-xl gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Link to={`/post/${gettingStartedSlug}`}>
                Let's go
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="rounded-xl gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Link to="/auth">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="lg" 
            onClick={handleDismiss}
            className="rounded-xl hover:bg-background/60"
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}
