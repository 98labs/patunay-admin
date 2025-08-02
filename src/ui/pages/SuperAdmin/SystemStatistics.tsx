import React, { useState, useEffect, useMemo } from "react";
import { PageHeader, Loading, SimpleChart, DataTable } from "@components";
import { ColumnDef } from '@tanstack/react-table';
import { useAuthV2 as useAuth } from '../../hooks/useAuthV2';
import { useNavigate } from "react-router-dom";
import supabase from "../../supabase";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface SystemStats {
  totalUsers: number;
  totalOrganizations: number;
  totalArtworks: number;
  totalAppraisals: number;
  totalNfcTags: number;
  activeUsers: number;
  usersByRole: { role: string; count: number }[];
  recentActivity: { date: string; count: number }[];
  organizationStats: { name: string; artworks: number; users: number }[];
}

const SystemStatistics = () => {
  const navigate = useNavigate();
  const { isSuperUser } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30); // Last 30 days by default

  // Column definitions for organizations table
  const organizationColumns: ColumnDef<any>[] = useMemo(() => [
    {
      header: 'Rank',
      id: 'rank',
      cell: ({ row }) => {
        const idx = row.index;
        return (
          <div className={`badge ${idx < 3 ? 'badge-primary' : 'badge-ghost'}`}>
            #{idx + 1}
          </div>
        );
      },
    },
    {
      header: 'Organization',
      accessorKey: 'name',
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as string}</span>
      ),
    },
    {
      header: 'Artworks',
      accessorKey: 'artworks',
      cell: ({ getValue, row }) => {
        const artworks = getValue() as number;
        const maxArtworks = Math.max(...(stats?.organizationStats || []).map(o => o.artworks));
        return (
          <div className="flex items-center gap-2">
            <span>{artworks}</span>
            <progress 
              className="progress progress-primary w-20" 
              value={artworks} 
              max={maxArtworks}
            />
          </div>
        );
      },
    },
    {
      header: 'Users',
      accessorKey: 'users',
    },
    {
      header: 'Avg per User',
      id: 'average',
      cell: ({ row }) => {
        const artworks = row.original.artworks;
        const users = row.original.users;
        const avg = users > 0 ? (artworks / users).toFixed(1) : '0';
        return <span>{avg}</span>;
      },
    },
  ], [stats?.organizationStats]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch total users by role
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('role, is_active');

        if (usersError) throw usersError;

        // Count users by role
        const usersByRole = usersData?.reduce((acc: any[], user) => {
          const existingRole = acc.find(r => r.role === user.role);
          if (existingRole) {
            existingRole.count++;
          } else {
            acc.push({ role: user.role || 'unknown', count: 1 });
          }
          return acc;
        }, []) || [];

        const activeUsers = usersData?.filter(u => u.is_active).length || 0;

        // Fetch organizations count
        const { count: orgCount, error: orgError } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true });

        if (orgError) throw orgError;

        // Fetch artworks count
        const { count: artworkCount, error: artworkError } = await supabase
          .from('artworks')
          .select('*', { count: 'exact', head: true });

        if (artworkError) throw artworkError;

        // Fetch appraisals count
        const { count: appraisalCount, error: appraisalError } = await supabase
          .from('artwork_appraisal')
          .select('*', { count: 'exact', head: true });

        if (appraisalError) throw appraisalError;

        // Fetch NFC tags count
        const { count: tagCount, error: tagError } = await supabase
          .from('tags')
          .select('*', { count: 'exact', head: true });

        if (tagError) throw tagError;

        // Fetch organization statistics
        const { data: orgs, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name');

        if (orgsError) throw orgsError;

        // Get stats for each organization
        const organizationStats = await Promise.all(
          (orgs || []).map(async (org) => {
            // Count artworks
            const { count: artworkCount } = await supabase
              .from('artworks')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', org.id);

            // Count users
            const { count: userCount } = await supabase
              .from('organization_users')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', org.id);

            return {
              name: org.name,
              artworks: artworkCount || 0,
              users: userCount || 0
            };
          })
        );

        // Generate activity data for the last N days
        const recentActivity = [];
        for (let i = dateRange - 1; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dateStr = format(date, 'yyyy-MM-dd');
          
          // Count artworks created on this date
          const { count } = await supabase
            .from('artworks')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay(date).toISOString())
            .lt('created_at', endOfDay(date).toISOString());

          recentActivity.push({
            date: dateStr,
            count: count || 0
          });
        }

        setStats({
          totalUsers: usersData?.length || 0,
          totalOrganizations: orgCount || 0,
          totalArtworks: artworkCount || 0,
          totalAppraisals: appraisalCount || 0,
          totalNfcTags: tagCount || 0,
          activeUsers,
          usersByRole,
          recentActivity,
          organizationStats: organizationStats.sort((a, b) => b.artworks - a.artworks).slice(0, 10)
        });
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    if (isSuperUser) {
      fetchStats();
    }
  }, [isSuperUser, dateRange]);

  if (isLoading) {
    return <Loading fullScreen={false} />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="System Statistics"
          subtitle="System-wide analytics and insights"
        />
        <div className="alert alert-error">
          <span>Error loading statistics: {error}</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Prepare chart data for SimpleChart component
  const roleChartData = (stats.usersByRole || []).map((r, index) => ({
    label: r.role.charAt(0).toUpperCase() + r.role.slice(1),
    value: r.count,
    color: [
      'hsl(var(--p))',   // primary (blue)
      'hsl(var(--s))',   // secondary (green)
      'hsl(var(--a))',   // accent (yellow)
      'hsl(var(--e))',   // error (red)
      'hsl(var(--w))',   // warning (purple)
      'hsl(var(--in))',  // info (pink)
    ][index % 6]
  }));

  const activityChartData = (stats.recentActivity || []).slice(-7).map(a => ({
    label: format(new Date(a.date), 'MMM d'),
    value: a.count
  }));

  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Statistics"
        subtitle="System-wide analytics and insights"
        action={
          <div className="flex gap-2">
            <select 
              className="select select-bordered select-sm"
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => window.location.reload()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="stat-title">Total Users</div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-desc">{stats.activeUsers} active</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="stat-title">Organizations</div>
            <div className="stat-value">{stats.totalOrganizations}</div>
            <div className="stat-desc">Active organizations</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-accent">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="stat-title">Artworks</div>
            <div className="stat-value">{stats.totalArtworks}</div>
            <div className="stat-desc">Total registered</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-warning">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-title">Appraisals</div>
            <div className="stat-value">{stats.totalAppraisals}</div>
            <div className="stat-desc">Completed appraisals</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-info">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <div className="stat-title">NFC Tags</div>
            <div className="stat-value">{stats.totalNfcTags}</div>
            <div className="stat-desc">Total issued</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Users by Role</h2>
            <SimpleChart
              type="donut"
              data={roleChartData}
              height={300}
            />
          </div>
        </div>

        {/* Activity Chart */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Artwork Registration Activity</h2>
            <SimpleChart
              type="bar"
              data={activityChartData}
              height={300}
            />
          </div>
        </div>
      </div>

      {/* Top Organizations Table */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title mb-4">Top Organizations by Artworks</h2>
          <DataTable
            columns={organizationColumns}
            data={stats.organizationStats || []}
            enablePagination={false}
            enableSorting={false}
            emptyMessage="No organizations found"
          />
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-lg">User Distribution</h3>
            <div className="space-y-2">
              {(stats.usersByRole || []).map((role) => (
                <div key={role.role} className="flex justify-between items-center">
                  <span className="capitalize">{role.role}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{role.count}</span>
                    <span className="text-sm text-base-content/60">
                      ({((role.count / stats.totalUsers) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-lg">System Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>User Activity Rate</span>
                <div className="badge badge-success">
                  {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Avg Artworks/Org</span>
                <div className="badge badge-info">
                  {(stats.totalArtworks / Math.max(stats.totalOrganizations, 1)).toFixed(1)}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Appraisal Rate</span>
                <div className="badge badge-warning">
                  {((stats.totalAppraisals / Math.max(stats.totalArtworks, 1)) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-lg">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                className="btn btn-sm btn-block btn-outline"
                onClick={() => navigate('/dashboard/super-admin/users')}
              >
                Manage Super Users
              </button>
              <button 
                className="btn btn-sm btn-block btn-outline"
                onClick={() => navigate('/dashboard/super-admin/organizations')}
              >
                Manage Organizations
              </button>
              <button 
                className="btn btn-sm btn-block btn-outline"
                onClick={() => navigate('/dashboard/admin/users')}
              >
                View All Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatistics;