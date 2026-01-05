import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function can be called by cron or by admins
    // When called by cron, there's no auth header - we use service role
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Optional: Check if called by admin (if auth header present)
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const userSupabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await userSupabase.auth.getUser(token);
      
      if (claimsError || !claimsData?.user) {
        console.error('Invalid authentication token:', claimsError?.message);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Check if user is admin
      const { data: roleData } = await serviceSupabase
        .from('user_roles')
        .select('role')
        .eq('user_id', claimsData.user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        console.error('User is not admin:', claimsData.user.id);
        return new Response(
          JSON.stringify({ success: false, error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      console.log('Admin triggered cleanup:', claimsData.user.id);
    } else {
      console.log('Cron job triggered cleanup');
    }

    // Delete logs older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error, count } = await serviceSupabase
      .from('firecrawl_usage_logs')
      .delete()
      .lt('created_at', thirtyDaysAgo)
      .select('id');

    if (error) {
      console.error('Error deleting old logs:', error.message);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const deletedCount = data?.length || 0;
    console.log(`Cleanup complete: deleted ${deletedCount} logs older than 30 days`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deleted ${deletedCount} logs older than 30 days`,
        deletedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error during cleanup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Cleanup failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
