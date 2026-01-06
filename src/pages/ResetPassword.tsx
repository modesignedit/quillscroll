import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Zap, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Check if there's a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
      setIsLoading(false);
    };

    checkSession();

    // Listen for auth state changes (when user clicks reset link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Unable to reset password',
        description: error.message || 'Please try again.',
      });
      return;
    }

    setIsSuccess(true);
    
    // Sign out and redirect to login after a short delay
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate('/auth');
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isValidSession && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl p-8 text-center">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-destructive via-destructive/50 to-destructive" />
            
            <div className="inline-flex items-center justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Lock className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Invalid or expired link</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="rounded-xl"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent-foreground to-primary" />
          
          <div className="px-8 py-10">
            {isSuccess ? (
              // Success State
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Password updated! 🎉</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Your password has been reset. Redirecting you to sign in...
                </p>
              </div>
            ) : (
              // Reset Password Form
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center mb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
                      <Zap className="h-7 w-7" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Create new password</h2>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Choose a strong password to keep your account secure.
                  </p>
                </div>

                <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">New password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                      {...form.register('password')}
                    />
                    {form.formState.errors.password && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <span>⚠️</span> {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                      {...form.register('confirmPassword')}
                    />
                    {form.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <span>⚠️</span> {form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      'Reset Password →'
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
