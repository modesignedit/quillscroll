import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Zap, Heart, ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

const signupSchema = loginSchema.extend({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be 50 characters or less'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Reset Google loading state when user returns to window (e.g., after closing OAuth popup)
  useEffect(() => {
    const handleFocus = () => {
      if (isGoogleLoading) {
        setIsGoogleLoading(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isGoogleLoading]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect');
      const target = redirect && redirect !== '/auth' ? redirect : '/dashboard';
      navigate(target, { replace: true });
    }
  }, [user, navigate, searchParams]);

  const handleLogin = async (data: LoginFormData) => {
    const { error } = await signIn(data.email, data.password);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Oops! Something went wrong',
        description:
          error.message || 'Double-check your email and password.',
      });
      return;
    }

    const redirect = searchParams.get('redirect');
    const target = redirect && redirect !== '/auth' ? redirect : '/dashboard';
    navigate(target, { replace: true });
  };

  const handleSignup = async (data: SignupFormData) => {
    const { error } = await signUp(data.email, data.password, data.displayName);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Couldn\'t create your account',
        description: error.message || 'Try a different email maybe?',
      });
      return;
    }

    toast({
      title: 'You\'re all set! 🎉',
      description: 'Sign in to start your journey.',
    });

    setActiveTab('login');
    signupForm.reset();
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Google sign-in failed',
        description: error.message || 'Please try again.',
      });
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Unable to send reset email',
        description: error.message || 'Please try again.',
      });
      return;
    }

    setResetEmailSent(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    forgotPasswordForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Main card */}
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          {/* Gradient accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent-foreground to-primary" />
          
          {showForgotPassword ? (
            // Forgot Password View
            <div className="px-8 py-10">
              <button
                onClick={handleBackToLogin}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>

              {resetEmailSent ? (
                // Email Sent Success State
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Mail className="h-8 w-8" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Check your inbox! 📬</h2>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                    We've sent you a password reset link. Click it to create a new password.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={handleBackToLogin}
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                // Forgot Password Form
                <>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center mb-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
                        <Zap className="h-7 w-7" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Forgot your password?</h2>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                      No worries! Enter your email and we'll send you a reset link.
                    </p>
                  </div>

                  <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@email.com"
                        className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                        {...forgotPasswordForm.register('email')}
                      />
                      {forgotPasswordForm.formState.errors.email && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <span>⚠️</span> {forgotPasswordForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                      disabled={forgotPasswordForm.formState.isSubmitting}
                    >
                      {forgotPasswordForm.formState.isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        'Send Reset Link →'
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          ) : (
            // Main Login/Signup View
            <>
              {/* Header */}
              <div className="px-8 pt-10 pb-6 text-center">
                <div className="inline-flex items-center justify-center gap-2 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
                    <Zap className="h-7 w-7" />
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                  {activeTab === 'login' ? 'Welcome back!' : 'Join the crew'}
                </h1>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  {activeTab === 'login' 
                    ? 'Ready to pick up where you left off? Let\'s go!' 
                    : 'Create your account and start sharing your story.'}
                </p>
              </div>

              {/* Content */}
              <div className="px-8 pb-10">
                {/* Social Login */}
                <div className="mb-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-border/50 bg-background/50 hover:bg-background hover:border-border transition-all gap-3 font-medium"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <Sparkles className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    Continue with Google
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
                  <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-2xl bg-muted/50 p-1">
                    <TabsTrigger 
                      value="login" 
                      className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-md text-sm font-medium transition-all"
                    >
                      Sign in
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-md text-sm font-medium transition-all"
                    >
                      Create account
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-0">
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@email.com"
                          className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                          {...loginForm.register('email')}
                        />
                        {loginForm.formState.errors.email && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <span>⚠️</span> {loginForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                          {...loginForm.register('password')}
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <span>⚠️</span> {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                        disabled={loginForm.formState.isSubmitting}
                      >
                        {loginForm.formState.isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 animate-spin" />
                            Signing in...
                          </span>
                        ) : (
                          'Let\'s go →'
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-0">
                    <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-sm font-medium">What should we call you?</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Your name"
                          className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                          {...signupForm.register('displayName')}
                        />
                        {signupForm.formState.errors.displayName && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <span>⚠️</span> {signupForm.formState.errors.displayName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@email.com"
                          className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                          {...signupForm.register('email')}
                        />
                        {signupForm.formState.errors.email && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <span>⚠️</span> {signupForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium">Create a password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                          {...signupForm.register('password')}
                        />
                        {signupForm.formState.errors.password && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <span>⚠️</span> {signupForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                        disabled={signupForm.formState.isSubmitting}
                      >
                        {signupForm.formState.isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 animate-spin" />
                            Creating magic...
                          </span>
                        ) : (
                          'Create my account →'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-border/30 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    Made with <Heart className="h-3 w-3 text-destructive fill-destructive" /> for creators like you
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
