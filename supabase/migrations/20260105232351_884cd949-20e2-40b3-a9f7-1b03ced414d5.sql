-- Allow admins to view all firecrawl usage logs
CREATE POLICY "Admins can view all usage logs"
  ON public.firecrawl_usage_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));