import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RefreshCw, Trash2, BarChart3, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface UsageLog {
  id: string;
  user_id: string;
  function_name: string;
  request_url: string | null;
  request_query: string | null;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

interface UserStats {
  user_id: string;
  email?: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  last_request: string;
}

export default function AdminFirecrawlDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    };

    checkAdminRole();
  }, [user]);

  // Fetch usage logs (admin only via service role in edge function)
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["firecrawl-usage-logs"],
    queryFn: async () => {
      // For admin view, we need to query directly with RLS bypass
      // Since we can't do that from client, we'll create an edge function
      // For now, let's use the client query which will work for logs the user can see
      const { data, error } = await supabase
        .from("firecrawl_usage_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as UsageLog[];
    },
    enabled: isAdmin === true,
  });

  // Calculate stats
  const stats = logs ? {
    totalRequests: logs.length,
    successfulRequests: logs.filter(l => l.success).length,
    failedRequests: logs.filter(l => !l.success).length,
    byFunction: logs.reduce((acc, log) => {
      acc[log.function_name] = (acc[log.function_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    uniqueUsers: new Set(logs.map(l => l.user_id)).size,
  } : null;

  // Get user stats
  const userStats: UserStats[] = logs ? Object.values(
    logs.reduce((acc, log) => {
      if (!acc[log.user_id]) {
        acc[log.user_id] = {
          user_id: log.user_id,
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          last_request: log.created_at,
        };
      }
      acc[log.user_id].total_requests++;
      if (log.success) {
        acc[log.user_id].successful_requests++;
      } else {
        acc[log.user_id].failed_requests++;
      }
      if (new Date(log.created_at) > new Date(acc[log.user_id].last_request)) {
        acc[log.user_id].last_request = log.created_at;
      }
      return acc;
    }, {} as Record<string, UserStats>)
  ).sort((a, b) => b.total_requests - a.total_requests) : [];

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("cleanup-firecrawl-logs");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Cleanup complete",
        description: data.message || "Old logs have been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["firecrawl-usage-logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cleanup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isAdmin === null) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-12">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You need admin privileges to view this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/dashboard")} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Firecrawl Usage Dashboard</h1>
            <p className="text-muted-foreground">Monitor API usage and manage logs</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetchLogs()}
              disabled={logsLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${logsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="destructive"
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cleanup Old Logs
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRequests}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalRequests > 0 
                    ? Math.round((stats.successfulRequests / stats.totalRequests) * 100)
                    : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Requests</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.failedRequests}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Function breakdown */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Requests by Function</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byFunction).map(([fn, count]) => (
                  <Badge key={fn} variant="secondary" className="text-sm py-1 px-3">
                    {fn}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="logs">
          <TabsList>
            <TabsTrigger value="logs">Recent Logs</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent API Calls</CardTitle>
                <CardDescription>Last 100 Firecrawl API requests</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : logs && logs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Function</TableHead>
                          <TableHead>URL/Query</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.function_name}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {log.request_url || log.request_query || "-"}
                            </TableCell>
                            <TableCell>
                              {log.success ? (
                                <Badge variant="default" className="bg-green-500">
                                  {log.status_code || "OK"}
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  {log.status_code || "Error"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.user_id.slice(0, 8)}...
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No logs found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage by User</CardTitle>
                <CardDescription>Aggregated stats per user</CardDescription>
              </CardHeader>
              <CardContent>
                {userStats.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Total Requests</TableHead>
                        <TableHead>Successful</TableHead>
                        <TableHead>Failed</TableHead>
                        <TableHead>Last Request</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userStats.map((stat) => (
                        <TableRow key={stat.user_id}>
                          <TableCell className="font-mono text-xs">
                            {stat.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>{stat.total_requests}</TableCell>
                          <TableCell className="text-green-600">{stat.successful_requests}</TableCell>
                          <TableCell className="text-destructive">{stat.failed_requests}</TableCell>
                          <TableCell>
                            {format(new Date(stat.last_request), "MMM d, HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No user data found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
