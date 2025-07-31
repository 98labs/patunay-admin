import React, { useState, useMemo } from 'react';
import { 
  PageHeader, 
  Loading,
  StatsCard,
  SimpleChart,
  DataTable
} from '@components';
import { ColumnDef } from '@tanstack/react-table';
import { 
  useGetOrganizationStatsQuery,
  useGetOrganizationMembersQuery,
  useGetOrganizationQuery
} from '../../store/api/organizationApi';
import { 
  useGetArtworksQuery 
} from '../../store/api/artworkApi';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { UserRole } from '../../typings';

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

interface ActivityData {
  date: string;
  artworks: number;
  appraisals: number;
  members: number;
}

const OrganizationStatisticsPage: React.FC = () => {
  const { currentOrganization } = useAuth();
  const { canViewOrgStatistics, canExportData } = usePermissions();
  
  const organizationId = currentOrganization?.id || '';
  
  // State
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'artworks' | 'activity'>('overview');

  // Queries
  const { 
    data: organization, 
    isLoading: isLoadingOrg 
  } = useGetOrganizationQuery(organizationId, {
    skip: !organizationId
  });

  const { 
    data: stats, 
    isLoading: isLoadingStats,
    refetch: refetchStats 
  } = useGetOrganizationStatsQuery(organizationId, {
    skip: !organizationId || !canViewOrgStatistics
  });

  const { 
    data: members, 
    isLoading: isLoadingMembers 
  } = useGetOrganizationMembersQuery(organizationId, {
    skip: !organizationId || !canViewOrgStatistics
  });

  const { 
    data: artworksResponse, 
    isLoading: isLoadingArtworks 
  } = useGetArtworksQuery({
    page: 1,
    pageSize: 1000, // Get all for statistics
    organizationId: organizationId
  }, {
    skip: !organizationId || !canViewOrgStatistics
  });

  // Calculate time-based statistics
  const timeBasedStats = useMemo(() => {
    if (!artworksResponse?.data || !members) {
      return {
        newArtworks: 0,
        newMembers: 0,
        activeMembers: 0,
        artworkGrowth: 0,
        memberGrowth: 0
      };
    }

    let cutoffDate: Date;
    const now = new Date();
    
    switch (timeRange) {
      case 'today':
        cutoffDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        cutoffDate = startOfWeek(now);
        break;
      case 'month':
        cutoffDate = startOfMonth(now);
        break;
      case 'year':
        cutoffDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        cutoffDate = new Date(0);
    }

    const newArtworks = artworksResponse.data.filter(
      a => new Date(a.created_at) >= cutoffDate
    ).length;

    const newMembers = members.filter(
      m => new Date(m.created_at) >= cutoffDate
    ).length;

    const activeMembers = members.filter(
      m => m.user?.last_login_at && new Date(m.user.last_login_at) >= cutoffDate
    ).length;

    // Calculate growth percentages (simplified)
    const totalArtworks = artworksResponse.data.length;
    const totalMembers = members.length;
    
    const artworkGrowth = totalArtworks > 0 ? (newArtworks / totalArtworks) * 100 : 0;
    const memberGrowth = totalMembers > 0 ? (newMembers / totalMembers) * 100 : 0;

    return {
      newArtworks,
      newMembers,
      activeMembers,
      artworkGrowth,
      memberGrowth
    };
  }, [artworksResponse, members, timeRange]);

  // Prepare chart data
  const membersByRoleData = useMemo(() => {
    if (!members) return [];

    const roleCount: Record<string, number> = {};
    members.forEach(member => {
      const role = member.role || 'viewer';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    return Object.entries(roleCount).map(([role, count], index) => ({
      label: role.charAt(0).toUpperCase() + role.slice(1),
      value: count,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'][index % 6]
    }));
  }, [members]);

  const artworksByStatusData = useMemo(() => {
    if (!artworksResponse?.data) return [];

    const statusCount = {
      active: 0,
      archived: 0,
      sold: 0,
      loaned: 0
    };

    artworksResponse.data.forEach(artwork => {
      // Simplified status detection
      if (artwork.deleted_at) {
        statusCount.archived++;
      } else {
        statusCount.active++;
      }
    });

    return [
      { label: 'Active', value: statusCount.active, color: '#10B981' },
      { label: 'Archived', value: statusCount.archived, color: '#6B7280' },
      { label: 'Sold', value: statusCount.sold, color: '#F59E0B' },
      { label: 'Loaned', value: statusCount.loaned, color: '#3B82F6' }
    ].filter(item => item.value > 0);
  }, [artworksResponse]);

  // Column definitions for members table
  const memberColumns: ColumnDef<any>[] = useMemo(() => [
    {
      header: 'Name',
      accessorKey: 'user',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="avatar placeholder">
            <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
              <span className="text-xs">
                {row.original.user?.first_name?.[0]}{row.original.user?.last_name?.[0]}
              </span>
            </div>
          </div>
          <div>
            <div className="font-bold text-sm">
              {row.original.user?.first_name} {row.original.user?.last_name}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ getValue }) => (
        <span className="badge badge-sm badge-primary">{getValue() as string}</span>
      ),
    },
    {
      header: 'Joined',
      accessorKey: 'created_at',
      cell: ({ getValue }) => (
        <span className="text-sm">
          {format(new Date(getValue() as string), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: ({ getValue }) => {
        const isActive = getValue() as boolean;
        return (
          <span className={`badge badge-sm ${isActive ? 'badge-success' : 'badge-error'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
  ], []);

  // Column definitions for artworks table
  const artworkColumns: ColumnDef<any>[] = useMemo(() => [
    {
      header: 'Title',
      accessorKey: 'title',
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as string}</span>
      ),
    },
    {
      header: 'Artist',
      accessorKey: 'artist',
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: ({ getValue }) => (
        <span className="text-sm">
          {format(new Date(getValue() as string), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'deleted_at',
      cell: ({ getValue }) => {
        const isArchived = !!getValue();
        return (
          <span className={`badge badge-sm ${isArchived ? 'badge-error' : 'badge-success'}`}>
            {isArchived ? 'Archived' : 'Active'}
          </span>
        );
      },
    },
  ], []);

  // Activity timeline data (mock for now)
  const activityData: ActivityData[] = useMemo(() => {
    const data: ActivityData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MMM d');
      data.push({
        date,
        artworks: Math.floor(Math.random() * 10),
        appraisals: Math.floor(Math.random() * 5),
        members: Math.floor(Math.random() * 3)
      });
    }
    return data;
  }, []);

  const handleExportStats = () => {
    // Create CSV content
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Organization Name', organization?.name || ''],
      ['Total Members', stats?.total_users || 0],
      ['Active Members', stats?.active_users || 0],
      ['Total Artworks', stats?.total_artworks || 0],
      ['Total Appraisals', stats?.total_appraisals || 0],
      ['NFC Tags', stats?.total_nfc_tags || 0],
      ['Active NFC Tags', stats?.active_nfc_tags || 0],
      ['Export Date', format(new Date(), 'yyyy-MM-dd HH:mm:ss')]
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${organization?.name || 'organization'}-statistics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!organizationId) {
    return (
      <div className="container mx-auto px-4">
        <div className="alert alert-warning">
          <span>No organization selected. Please select an organization first.</span>
        </div>
      </div>
    );
  }

  if (!canViewOrgStatistics) {
    return (
      <div className="container mx-auto px-4">
        <div className="alert alert-error">
          <span>You don't have permission to view organization statistics.</span>
        </div>
      </div>
    );
  }

  if (isLoadingOrg || isLoadingStats) {
    return <Loading fullScreen={false} />;
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <PageHeader 
        title="Organization Statistics"
        subtitle={`Analytics for ${organization?.name}`}
        action={
          <div className="flex gap-2">
            <select
              className="select select-bordered select-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
            
            {canExportData && (
              <button 
                onClick={handleExportStats}
                className="btn btn-primary btn-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
            )}

            <button
              onClick={() => refetchStats()}
              className="btn btn-ghost btn-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="tabs tabs-boxed">
        <a 
          className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </a>
        <a 
          className={`tab ${activeTab === 'members' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members
        </a>
        <a 
          className={`tab ${activeTab === 'artworks' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('artworks')}
        >
          Artworks
        </a>
        <a 
          className={`tab ${activeTab === 'activity' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </a>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Members"
              value={stats?.total_users || 0}
              subtitle={`${stats?.active_users || 0} active`}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            
            <StatsCard
              title="Total Artworks"
              value={stats?.total_artworks || 0}
              subtitle={`+${timeBasedStats.newArtworks} this ${timeRange}`}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            
            <StatsCard
              title="Total Appraisals"
              value={stats?.total_appraisals || 0}
              subtitle="Completed appraisals"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            
            <StatsCard
              title="NFC Tags"
              value={stats?.total_nfc_tags || 0}
              subtitle={`${stats?.active_nfc_tags || 0} active`}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              }
            />
          </div>

          {/* Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-lg">Growth Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Artwork Growth</span>
                      <span className="text-sm font-semibold">+{timeBasedStats.artworkGrowth.toFixed(1)}%</span>
                    </div>
                    <progress 
                      className="progress progress-primary" 
                      value={timeBasedStats.artworkGrowth} 
                      max="100"
                    ></progress>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Member Growth</span>
                      <span className="text-sm font-semibold">+{timeBasedStats.memberGrowth.toFixed(1)}%</span>
                    </div>
                    <progress 
                      className="progress progress-secondary" 
                      value={timeBasedStats.memberGrowth} 
                      max="100"
                    ></progress>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-lg">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60">New Members</p>
                    <p className="text-2xl font-bold">{timeBasedStats.newMembers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Active Members</p>
                    <p className="text-2xl font-bold">{timeBasedStats.activeMembers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">New Artworks</p>
                    <p className="text-2xl font-bold">{timeBasedStats.newArtworks}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Recent Activity</p>
                    <p className="text-2xl font-bold">{stats?.recent_activity || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Members by Role Chart */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-lg">Members by Role</h3>
                {membersByRoleData.length > 0 ? (
                  <SimpleChart
                    data={membersByRoleData}
                    type="pie"
                    height={300}
                  />
                ) : (
                  <div className="text-center py-8 text-base-content/60">
                    No member data available
                  </div>
                )}
              </div>
            </div>

            {/* Member Activity */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-lg">Member Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span>Total Members</span>
                    <span className="font-semibold">{stats?.total_users || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span>Active Members</span>
                    <span className="font-semibold">{stats?.active_users || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span>New This Month</span>
                    <span className="font-semibold">{timeBasedStats.newMembers}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span>Activity Rate</span>
                    <span className="font-semibold">
                      {stats?.total_users ? 
                        ((stats.active_users / stats.total_users) * 100).toFixed(1) : 0
                      }%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Members */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">Recent Members</h3>
              <DataTable
                columns={memberColumns}
                data={members ? members.slice(0, 10) : []}
                enablePagination={false}
                isLoading={isLoadingMembers}
                emptyMessage="No members found"
              />
            </div>
          </div>
        </div>
      )}

      {/* Artworks Tab */}
      {activeTab === 'artworks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Artwork Status Chart */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-lg">Artworks by Status</h3>
                {artworksByStatusData.length > 0 ? (
                  <SimpleChart
                    data={artworksByStatusData}
                    type="doughnut"
                    height={300}
                  />
                ) : (
                  <div className="text-center py-8 text-base-content/60">
                    No artwork data available
                  </div>
                )}
              </div>
            </div>

            {/* Artwork Statistics */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h3 className="card-title text-lg">Artwork Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span>Total Artworks</span>
                    <span className="font-semibold">{stats?.total_artworks || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span>With Appraisals</span>
                    <span className="font-semibold">{stats?.total_appraisals || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span>Tagged Artworks</span>
                    <span className="font-semibold">{stats?.active_nfc_tags || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span>New This Month</span>
                    <span className="font-semibold">{timeBasedStats.newArtworks}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Artworks */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">Recent Artworks</h3>
              <DataTable
                columns={artworkColumns}
                data={artworksResponse?.data ? artworksResponse.data.slice(0, 10) : []}
                enablePagination={false}
                isLoading={isLoadingArtworks}
                emptyMessage="No artworks found"
              />
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Activity Timeline Chart */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="card-title text-lg">Activity Timeline (Last 30 Days)</h3>
              <SimpleChart
                data={activityData.map(d => ({
                  label: d.date,
                  value: d.artworks + d.appraisals + d.members,
                  color: '#3B82F6'
                }))}
                type="line"
                height={300}
              />
            </div>
          </div>

          {/* Activity Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h4 className="font-semibold mb-2">Recent Artwork Activity</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Created</span>
                    <span className="badge badge-sm badge-success">
                      {timeBasedStats.newArtworks}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Updated</span>
                    <span className="badge badge-sm badge-info">
                      {stats?.recent_activity || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h4 className="font-semibold mb-2">Member Activity</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Joins</span>
                    <span className="badge badge-sm badge-success">
                      {timeBasedStats.newMembers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Users</span>
                    <span className="badge badge-sm badge-info">
                      {timeBasedStats.activeMembers}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h4 className="font-semibold mb-2">System Activity</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Actions</span>
                    <span className="badge badge-sm badge-primary">
                      {stats?.recent_activity || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Per Day</span>
                    <span className="badge badge-sm">
                      {((stats?.recent_activity || 0) / 30).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationStatisticsPage;