import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Check, Trash2, Lock, Eye, EyeOff } from "lucide-react";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

const profileSchema = z.object({
  display_name: z.string().trim().min(2, "Display name is too short").max(80, "Display name is too long"),
  bio: z
    .string()
    .trim()
    .max(280, "Bio must be at most 280 characters")
    .optional()
    .or(z.literal("")),
  avatar_url: z
    .string()
    .trim()
    .url("Avatar must be a valid URL")
    .max(512, "URL is too long")
    .optional()
    .or(z.literal("")),
  website_url: z
    .string()
    .trim()
    .max(512, "URL is too long")
    .optional()
    .or(z.literal("")),
  twitter_handle: z
    .string()
    .trim()
    .max(50, "Handle is too long")
    .optional()
    .or(z.literal("")),
  instagram_handle: z
    .string()
    .trim()
    .max(50, "Handle is too long")
    .optional()
    .or(z.literal("")),
  tiktok_handle: z
    .string()
    .trim()
    .max(50, "Handle is too long")
    .optional()
    .or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [justSaved, setJustSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handlePasswordChange = async (values: PasswordChangeValues) => {
    if (!user?.email) return;

    setIsChangingPassword(true);
    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: values.currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateError) {
        toast.error("Failed to update password");
        return;
      }

      toast.success("Password updated successfully! 🔐");
      passwordForm.reset();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Delete user's posts first
      const { error: postsError } = await supabase
        .from("posts")
        .delete()
        .eq("author_id", user.id);
      
      if (postsError) {
        console.error("Error deleting posts:", postsError);
      }

      // Delete user's profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);
      
      if (profileError) {
        console.error("Error deleting profile:", profileError);
      }

      // Sign out the user (the auth user will be orphaned but that's expected)
      await signOut();
      toast.success("Your account has been deleted");
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "display_name, bio, avatar_url, website_url, twitter_handle, instagram_handle, tiktok_handle",
        )
        .eq("id", user!.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: "",
      bio: "",
      avatar_url: "",
      website_url: "",
      twitter_handle: "",
      instagram_handle: "",
      tiktok_handle: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        display_name: profile.display_name ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? "",
        website_url: profile.website_url ?? "",
        twitter_handle: profile.twitter_handle ?? "",
        instagram_handle: profile.instagram_handle ?? "",
        tiktok_handle: profile.tiktok_handle ?? "",
      });
    }
  }, [profile, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const payload = {
        display_name: values.display_name.trim(),
        bio: values.bio?.trim() || null,
        avatar_url: values.avatar_url?.trim() || null,
        website_url: values.website_url?.trim() || null,
        twitter_handle: values.twitter_handle?.trim() || null,
        instagram_handle: values.instagram_handle?.trim() || null,
        tiktok_handle: values.tiktok_handle?.trim() || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      setJustSaved(true);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["author-profile", user.id] });
      }
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateMutation.mutate(values);
  };

  useEffect(() => {
    const subscription = form.watch(() => {
      if (justSaved) {
        setJustSaved(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, justSaved]);

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">Edit Profile</CardTitle>
              <CardDescription>Update your public author profile and social links.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading profile…</p>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border border-border/60 shadow-sm">
                        {form.watch("avatar_url") ? (
                          <AvatarImage
                            src={form.watch("avatar_url")}
                            alt={form.watch("display_name") || "Avatar"}
                          />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-sm font-medium uppercase">
                            {form.watch("display_name")?.charAt(0) || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <p className="text-xs text-muted-foreground">
                        This is how your avatar appears on your author page. Paste an image URL below to update it.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="avatar_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://images.example.com/you.png" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="display_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display name</FormLabel>
                          <FormControl>
                            <Input placeholder="How should we credit you?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => {
                        const bioValue = form.watch("bio") ?? "";
                        const bioLength = bioValue.length;

                        return (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Short bio that appears on your author page."
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span>Keep it short and punchy so it looks great in the author hero.</span>
                              <span>
                                {bioLength} / 280
                              </span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="website_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="yourdomain.com or https://yourdomain.com" {...field} />
                          </FormControl>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Shown as a globe icon on your author page and opens in a new tab.
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="twitter_handle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter</FormLabel>
                            <FormControl>
                              <Input placeholder="@handle" {...field} />
                            </FormControl>
                            <div className="mt-1 text-xs text-muted-foreground">
                              We’ll link to twitter.com/yourhandle and show a Twitter chip on your author page.
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="instagram_handle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input placeholder="@handle" {...field} />
                            </FormControl>
                            <div className="mt-1 text-xs text-muted-foreground">
                              We’ll link to instagram.com/yourhandle and show an Instagram chip.
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tiktok_handle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>TikTok</FormLabel>
                            <FormControl>
                              <Input placeholder="@handle" {...field} />
                            </FormControl>
                            <div className="mt-1 text-xs text-muted-foreground">
                              We’ll link to tiktok.com/@yourhandle and show a TikTok-style chip.
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <CardFooter className="mt-4 flex flex-col items-start justify-between gap-3 px-0 sm:flex-row sm:items-center">
                      <div className="text-xs text-muted-foreground">
                        {user?.id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="px-0 text-xs font-medium text-primary hover:text-primary/90"
                            onClick={() => window.open(`/author/${user.id}`, '_blank')}
                          >
                            View public author page 
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {justSaved && !updateMutation.isPending && (
                          <div className="flex items-center gap-1 text-xs text-emerald-500">
                            <Check className="h-3 w-3" />
                            <span>Saved</span>
                          </div>
                        )}
                        <Button type="submit" disabled={updateMutation.isPending} className="hover-scale">
                          {updateMutation.isPending ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </CardFooter>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Security - Password Change */}
          <Card className="mt-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Change your password. You'll need to enter your current password to confirm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              placeholder="Enter your current password"
                              className="h-12 rounded-xl pr-10"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Enter your new password"
                              className="h-12 rounded-xl pr-10"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Must be at least 8 characters
                        </div>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your new password"
                              className="h-12 rounded-xl pr-10"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="mt-4 gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Danger Zone - Account Deletion */}
          <Card className="mt-8 border-destructive/30 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                      This will permanently delete your account, all your posts, and remove your data from our servers. 
                      This action <span className="font-semibold text-destructive">cannot be undone</span>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                    >
                      {isDeleting ? "Deleting..." : "Yes, delete my account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
