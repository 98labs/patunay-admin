import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PageHeader, 
  StatsCard, 
  ActivityFeed, 
  SimpleChart,
  Loading 
} from "@components";
import { 
  useGetDashboardStatsQuery, 
  useGetActivityLogQuery 
} from '../../store/api/statisticsApi';
import { useAuthV2 as useAuth } from '../../hooks/useAuthV2';

const Dashboard = () => {
  const { isSuperUser } = useAuth();

  // Fetch dashboard data
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useGetDashboardStatsQuery();

  const { 
    data: activities, 
    isLoading: activitiesLoading 
  } = useGetActivityLogQuery({ limit: 10 });

  if (statsLoading) {
    return <Loading fullScreen={false} />;
  }

  if (statsError) {
    return (
      <div className="container mx-auto px-4">
        <PageHeader name="Dashboard" />
        <div className="alert alert-error">
          <span>Error loading dashboard data. Please try again.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <PageHeader name="Dashboard" />
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/dashboard/artworks" className="block">
          <StatsCard
            title="Total Artworks"
            value={stats?.artworks.total || 0}
            subtitle={`${stats?.artworks.recentlyAdded || 0} added this week`}
            trend={{
              value: 12,
              isPositive: true
            }}
            variant="primary"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            className="hover:scale-105 transition-transform"
          />
        </Link>

        <StatsCard
          title="NFC Attached"
          value={stats?.artworks.withNfc || 0}
          subtitle={`${stats?.nfc.activeTags || 0} active tags`}
          trend={{
            value: 8,
            isPositive: true
          }}
          variant="success"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          }
        />

        <StatsCard
          title="No NFC"
          value={stats?.artworks.withoutNfc || 0}
          subtitle="Artworks without tags"
          variant="warning"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />

        <StatsCard
          title="Active Users"
          value={stats?.users.active || 0}
          subtitle={`${stats?.users.recentSignups || 0} new this week`}
          trend={{
            value: 5,
            isPositive: true
          }}
          variant="accent"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NFC Operations Stats */}
        <div className="space-y-4">
          <StatsCard
            title="NFC Operations Today"
            value={stats?.nfc.operationsToday || 0}
            subtitle={`${stats?.nfc.successfulOperations || 0} successful, ${stats?.nfc.failedOperations || 0} failed`}
            variant="secondary"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          
          {/* Weekly Activity */}
          <SimpleChart
            type="bar"
            title="Weekly Activity Overview"
            data={[
              { label: 'Mon', value: Math.floor(Math.random() * 10) + 5 },
              { label: 'Tue', value: Math.floor(Math.random() * 10) + 5 },
              { label: 'Wed', value: Math.floor(Math.random() * 10) + 5 },
              { label: 'Thu', value: Math.floor(Math.random() * 10) + 5 },
              { label: 'Fri', value: Math.floor(Math.random() * 10) + 5 },
              { label: 'Sat', value: Math.floor(Math.random() * 10) + 5 },
              { label: 'Sun', value: Math.floor(Math.random() * 10) + 5 },
            ]}
            height={250}
          />
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          {activitiesLoading ? (
            <div className="bg-base-100 border border-base-300 rounded-lg p-6">
              <Loading fullScreen={false} />
            </div>
          ) : (
            <ActivityFeed activities={activities || []} />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-base-100 border border-base-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-base-content mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/dashboard/artworks/register"
            className="btn btn-primary btn-outline"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Artwork
          </Link>
          <Link
            to="/dashboard/admin/nfc-tags"
            className="btn btn-secondary btn-outline"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            Manage NFC
          </Link>
          <Link
            to="/dashboard/artworks"
            className="btn btn-accent btn-outline"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Artworks
          </Link>
          <Link
            to="/dashboard/admin/users"
            className="btn btn-info btn-outline"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Manage Team
          </Link>
        </div>
      </div>

      {/* Debug Section for Super Users */}
      {isSuperUser && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-warning">Super User Debug Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                to="/dashboard/super-admin"
                className="btn btn-primary"
              >
                Super Admin Dashboard
              </Link>
              <Link 
                to="/dashboard/super-admin/users"
                className="btn btn-secondary"
              >
                Super Admin Users List
              </Link>
              <button 
                onClick={() => {
                  console.log('Testing Super Admin Users route...');
                  window.location.href = '/dashboard/super-admin/users';
                }}
                className="btn btn-accent"
              >
                Force Navigate to Super Users
              </button>
              <div className="text-sm">
                <p>Is Super User: {isSuperUser ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
