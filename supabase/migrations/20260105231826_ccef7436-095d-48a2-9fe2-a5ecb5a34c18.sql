-- Create firecrawl_usage_logs table for rate limiting and usage tracking
CREATE TABLE public.firecrawl_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  request_url text,
  request_query text,
  status_code integer,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient rate limiting queries (user + time-based lookups)
CREATE INDEX idx_firecrawl_usage_user_time 
  ON public.firecrawl_usage_logs (user_id, created_at DESC);

-- Index for analytics queries by function
CREATE INDEX idx_firecrawl_usage_function 
  ON public.firecrawl_usage_logs (function_name, created_at DESC);

-- Enable RLS
ALTER TABLE public.firecrawl_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage logs
CREATE POLICY "Users can view own usage logs"
  ON public.firecrawl_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role inserts via edge functions (bypasses RLS)
-- No INSERT policy needed for regular users