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
import { Sparkles, Zap, Heart } from 'lucide-react';

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

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
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
                    <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
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
        </div>
      </div>
    </div>
  );
}
