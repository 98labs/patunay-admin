import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Tag,
  Shield,
  Activity,
  ChevronRight,
  TrendingUp,
  FileText,
  Settings,
} from 'lucide-react';
import { PageHeader, Loading } from '@components';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useNotification } from '../../hooks/useNotification';
import supabase from '../../supabase';
import { getTags } from '../../supabase/rpc/getTags';

interface AdminStats {
  users: { total: number; active: number; new: number };
  nfcTags: { total: number; attached: number; available: number };
  organizations: { total: number; active: number };
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    canManageOrgUsers,
    canManageAllUsers,
    canManageOrgNfcTags,
    canManageAllNfcTags,
    canManageOrganizations,
    isSuperUser,
  } = usePermissions();
  const { showError } = useNotification();

  const [stats, setStats] = useState<AdminStats>({
    users: { total: 0, active: 0, new: 0 },
    nfcTags: { total: 0, attached: 0, available: 0 },
    organizations: { total: 0, active: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      setLoading(true);

      // Get user stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get NFC tag stats using RPC function
      const tags = await getTags();
      const totalTags = tags.length;
      const activeTags = tags.filter(tag => tag.active).length;
      const attachedTags = tags.filter(tag => tag.artwork_id).length;

      // Get organization stats (only for super users)
      let orgStats = { total: 0, active: 0 };
      if (canManageOrganizations || isSuperUser) {
        const { count: totalOrgs } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true });

        const { count: activeOrgs } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        orgStats = { total: totalOrgs || 0, active: activeOrgs || 0 };
      }

      setStats({
        users: {
          total: totalUsers || 0,
          active: activeUsers || 0,
          new: newUsers || 0,
        },
        nfcTags: {
          total: totalTags || 0,
          attached: attachedTags || 0,
          available: activeTags || 0,
        },
        organizations: orgStats,
      });
    } catch (error) {
      showError('Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      path: '/dashboard/admin/users',
      visible: canManageOrgUsers || canManageAllUsers,
      stats: [
        { label: 'Total Users', value: stats.users.total },
        { label: 'Active', value: stats.users.active },
        { label: 'New (30d)', value: stats.users.new },
      ],
      color: 'primary',
    },
    {
      title: 'NFC Tags',
      description: 'Manage NFC tags and assignments',
      icon: Tag,
      path: '/dashboard/admin/nfc-tags',
      visible: canManageOrgNfcTags || canManageAllNfcTags,
      stats: [
        { label: 'Total Tags', value: stats.nfcTags.total },
        { label: 'Attached', value: stats.nfcTags.attached },
        { label: 'Active', value: stats.nfcTags.available },
      ],
      color: 'secondary',
    },
    {
      title: 'System Admin',
      description: 'System-wide administration',
      icon: Shield,
      path: '/dashboard/admin',
      visible: isSuperUser || canManageOrganizations || canManageAllUsers,
      stats: [
        { label: 'Organizations', value: stats.organizations.total },
        { label: 'Active Orgs', value: stats.organizations.active },
      ],
      color: 'info',
    },
  ];

  const quickActions = [
    {
      title: 'Add New User',
      icon: Users,
      onClick: () => navigate('/dashboard/admin/users'),
      visible: canManageOrgUsers || canManageAllUsers,
    },
    {
      title: 'Register NFC Tag',
      icon: Tag,
      onClick: () => navigate('/dashboard/admin/nfc-tags'),
      visible: canManageOrgNfcTags || canManageAllNfcTags,
    },
    {
      title: 'System Settings',
      icon: Settings,
      onClick: () => navigate('/dashboard/admin/settings'),
      visible: isSuperUser,
    },
    {
      title: 'View Logs',
      icon: FileText,
      onClick: () => navigate('/dashboard/admin/logs'),
      visible: isSuperUser || canManageAllUsers,
    },
  ];

  if (loading) {
    return <Loading />;
  }

  const visibleSections = adminSections.filter((section) => section.visible);
  const visibleActions = quickActions.filter((action) => action.visible);

  return (
    <div className="container mx-auto px-4">
      <PageHeader title="Administration" subtitle="Manage system settings, users, and resources" />

      {/* Overview Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm">Total Users</p>
                <p className="text-2xl font-bold">{stats.users.total}</p>
                <p className="text-success mt-1 text-xs">+{stats.users.new} new this month</p>
              </div>
              <Users className="text-primary h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm">NFC Tags</p>
                <p className="text-2xl font-bold">{stats.nfcTags.total}</p>
                <p className="text-base-content/60 mt-1 text-xs">
                  {stats.nfcTags.available} active
                </p>
              </div>
              <Tag className="text-secondary h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm">System Health</p>
                <p className="text-2xl font-bold">Good</p>
                <p className="text-success mt-1 text-xs">All systems operational</p>
              </div>
              <Activity className="text-success h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {visibleActions.length > 0 && (
        <div className="bg-base-100 border border-base-300 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-base-content mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleActions.map((action, index) => (
              <button 
                key={index} 
                onClick={action.onClick} 
                className={`btn ${
                  index === 0 ? 'btn-primary' : 
                  index === 1 ? 'btn-secondary' :
                  index === 2 ? 'btn-accent' : 'btn-info'
                } btn-outline hover:text-white`}
              >
                <action.icon className="w-5 h-5 mr-2" />
                {action.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Admin Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {visibleSections.map((section) => (
          <div
            key={section.path}
            className="card bg-base-100 cursor-pointer shadow-md transition-shadow hover:shadow-lg"
            onClick={() => navigate(section.path)}
          >
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <div className={`rounded-lg p-2 bg-${section.color}/10`}>
                      <section.icon className={`h-6 w-6 text-${section.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-base-content/60 text-sm">{section.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {section.stats.map((stat, index) => (
                      <div key={index}>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-base-content/60 text-xs">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <ChevronRight className="text-base-content/40 h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card bg-base-100 mt-8 shadow-md">
        <div className="card-body">
          <h3 className="card-title mb-4">
            <Activity className="h-5 w-5" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b py-2">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded p-2">
                  <Users className="text-primary h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-base-content/60 text-xs">2 hours ago</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-b py-2">
              <div className="flex items-center gap-3">
                <div className="bg-secondary/10 rounded p-2">
                  <Tag className="text-secondary h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">NFC tag attached to artwork</p>
                  <p className="text-base-content/60 text-xs">5 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
