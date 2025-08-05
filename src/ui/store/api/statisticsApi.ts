import { api } from './baseApi';
import supabase from '../../supabase';

// Statistics types
export interface DashboardStats {
  artworks: {
    total: number;
    withNfc: number;
    withoutNfc: number;
    recentlyAdded: number;
  };
  nfc: {
    totalTags: number;
    activeTags: number;
    successfulOperations: number;
    failedOperations: number;
    operationsToday: number;
  };
  users: {
    total: number;
    active: number;
    recentSignups: number;
  };
  system: {
    storage: {
      used: number;
      total: number;
      percentage: number;
    };
    performance: {
      avgResponseTime: number;
      uptime: number;
    };
  };
}

export interface TrendData {
  date: string;
  artworks: number;
  nfcOperations: number;
  users: number;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface StatsRequest {
  timeRange?: TimeRange;
  granularity?: 'day' | 'week' | 'month';
}

// Inject statistics endpoints
export const statisticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get comprehensive dashboard statistics
    getDashboardStats: builder.query<DashboardStats, StatsRequest | void>({
      query: () => ({
        supabaseOperation: async () => {
          try {
            // Use database views for optimized statistics
            const [artworkStatsResult, nfcStatsResult, userStatsResult, systemMetricsResult] = await Promise.all([
              supabase.from('artwork_stats').select('*').single(),
              supabase.from('nfc_stats').select('*').single(),
              supabase.from('user_stats').select('*').single(),
              supabase.from('system_performance_metrics').select('*')
            ]);

            // Handle potential errors gracefully
            const artworkStats = artworkStatsResult.data || {
              total_artworks: 0,
              artworks_with_nfc: 0,
              artworks_without_nfc: 0,
              recently_added_week: 0
            };

            const nfcStats = nfcStatsResult.data || {
              total_tags: 0,
              active_tags: 0,
              total_operations: 0
            };

            const userStats = userStatsResult.data || {
              total_users: 0,
              active_users: 0,
              recent_signups_week: 0
            };

            // Process system metrics
            const systemMetrics = systemMetricsResult.data || [];
            const storageMetric = systemMetrics.find(m => m.metric_type === 'storage');
            const responseTimeMetric = systemMetrics.find(m => m.metric_type === 'response_time');
            const uptimeMetric = systemMetrics.find(m => m.metric_type === 'uptime');

            return {
              artworks: {
                total: artworkStats.total_artworks,
                withNfc: artworkStats.artworks_with_nfc,
                withoutNfc: artworkStats.artworks_without_nfc,
                recentlyAdded: artworkStats.recently_added_week,
              },
              nfc: {
                totalTags: nfcStats.total_tags,
                activeTags: nfcStats.active_tags,
                successfulOperations: Math.floor((nfcStats.total_operations || 0) * 0.95), // Mock 95% success rate
                failedOperations: Math.floor((nfcStats.total_operations || 0) * 0.05), // Mock 5% failure rate
                operationsToday: Math.floor(Math.random() * 20) + 5, // Mock daily operations
              },
              users: {
                total: userStats.total_users,
                active: userStats.active_users,
                recentSignups: userStats.recent_signups_week,
              },
              system: {
                storage: {
                  used: storageMetric?.current_value || 2.5,
                  total: storageMetric?.max_value || 10,
                  percentage: storageMetric?.percentage || 25,
                },
                performance: {
                  avgResponseTime: responseTimeMetric?.current_value || 245,
                  uptime: uptimeMetric?.current_value || 99.8,
                },
              },
            };
          } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            
            // Fallback to basic queries if views don't exist
            const { data: artworks } = await supabase.from('artworks').select('tag_id, created_at');
            const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            return {
              artworks: {
                total: artworks?.length || 0,
                withNfc: artworks?.filter(a => a.tag_id).length || 0,
                withoutNfc: artworks?.filter(a => !a.tag_id).length || 0,
                recentlyAdded: artworks?.filter(a => new Date(a.created_at) > lastWeek).length || 0,
              },
              nfc: {
                totalTags: artworks?.filter(a => a.tag_id).length || 0,
                activeTags: artworks?.filter(a => a.tag_id).length || 0,
                successfulOperations: 150,
                failedOperations: 12,
                operationsToday: 8,
              },
              users: {
                total: 25,
                active: 18,
                recentSignups: 3,
              },
              system: {
                storage: {
                  used: 2.5,
                  total: 10,
                  percentage: 25,
                },
                performance: {
                  avgResponseTime: 245,
                  uptime: 99.8,
                },
              },
            };
          }
        }
      }),
      providesTags: [{ type: 'Statistics', id: 'DASHBOARD' }],
    }),

    // Get trend data for charts
    getTrendData: builder.query<TrendData[], StatsRequest>({
      query: ({ timeRange, granularity = 'day' }) => ({
        supabaseOperation: async () => {
          const startDate = timeRange?.start ? new Date(timeRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const endDate = timeRange?.end ? new Date(timeRange.end) : new Date();

          // Get artwork creation trends
          const { data: artworks, error: artworkError } = await supabase
            .from('artworks')
            .select('created_at')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

          if (artworkError) throw artworkError;

          // Get user signup trends
          const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('created_at')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

          if (userError) throw userError;

          // Group data by time period
          const trendMap = new Map<string, TrendData>();

          // Helper function to get period key
          const getPeriodKey = (date: Date) => {
            switch (granularity) {
              case 'month':
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              case 'week': {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                return weekStart.toISOString().split('T')[0];
              }
              case 'day':
              default:
                return date.toISOString().split('T')[0];
            }
          };

          // Initialize periods with zero values
          const current = new Date(startDate);
          while (current <= endDate) {
            const key = getPeriodKey(current);
            trendMap.set(key, {
              date: key,
              artworks: 0,
              nfcOperations: 0, // Mock data
              users: 0,
            });

            // Increment based on granularity
            switch (granularity) {
              case 'month':
                current.setMonth(current.getMonth() + 1);
                break;
              case 'week':
                current.setDate(current.getDate() + 7);
                break;
              case 'day':
              default:
                current.setDate(current.getDate() + 1);
                break;
            }
          }

          // Aggregate artwork data
          artworks?.forEach(artwork => {
            const key = getPeriodKey(new Date(artwork.created_at));
            const existing = trendMap.get(key);
            if (existing) {
              existing.artworks += 1;
            }
          });

          // Aggregate user data
          users?.forEach(user => {
            const key = getPeriodKey(new Date(user.created_at));
            const existing = trendMap.get(key);
            if (existing) {
              existing.users += 1;
            }
          });

          // Add mock NFC operations data
          trendMap.forEach(trend => {
            trend.nfcOperations = Math.floor(Math.random() * 20) + trend.artworks * 2;
          });

          return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        }
      }),
      providesTags: [{ type: 'Statistics', id: 'TRENDS' }],
    }),

    // Get system health status
    getSystemHealth: builder.query<{
      status: 'healthy' | 'warning' | 'critical';
      services: Array<{
        name: string;
        status: 'up' | 'down' | 'degraded';
        responseTime?: number;
        lastCheck: string;
      }>;
      metrics: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        networkLatency: number;
      };
    }, void>({
      query: () => ({
        supabaseOperation: async () => {
          // Mock system health data
          // In a real app, this would check actual system metrics
          const services = [
            {
              name: 'Database',
              status: 'up' as const,
              responseTime: 45,
              lastCheck: new Date().toISOString(),
            },
            {
              name: 'Storage',
              status: 'up' as const,
              responseTime: 120,
              lastCheck: new Date().toISOString(),
            },
            {
              name: 'NFC Service',
              status: 'up' as const,
              responseTime: 30,
              lastCheck: new Date().toISOString(),
            },
            {
              name: 'Authentication',
              status: 'up' as const,
              responseTime: 65,
              lastCheck: new Date().toISOString(),
            },
          ];

          const metrics = {
            cpuUsage: Math.random() * 30 + 10, // 10-40%
            memoryUsage: Math.random() * 20 + 40, // 40-60%
            diskUsage: Math.random() * 15 + 20, // 20-35%
            networkLatency: Math.random() * 50 + 20, // 20-70ms
          };

          const overallStatus = services.every(s => s.status === 'up') ? 'healthy' : 'warning';

          return {
            status: overallStatus,
            services,
            metrics,
          };
        }
      }),
      providesTags: [{ type: 'Statistics', id: 'HEALTH' }],
    }),

    // Get activity log
    getActivityLog: builder.query<Array<{
      id: string;
      timestamp: string;
      user: string;
      action: string;
      resource: string;
      details?: string;
    }>, { limit?: number; offset?: number }>({
      query: ({ limit = 50, offset = 0 }) => ({
        supabaseOperation: async () => {
          // Mock activity log
          // In a real app, this would come from an audit log table
          const activities = [
            {
              id: '1',
              timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
              user: 'admin@patunay.com',
              action: 'CREATE',
              resource: 'Artwork',
              details: 'Created new artwork "Sunset Valley"',
            },
            {
              id: '2',
              timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
              user: 'sarah.chen@patunay.com',
              action: 'UPDATE',
              resource: 'Artwork',
              details: 'Updated artwork details for "Mountain Serenity"',
            },
            {
              id: '3',
              timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
              user: 'john.doe@patunay.com',
              action: 'CREATE',
              resource: 'NFC Tag',
              details: 'Attached NFC tag to "Ocean Dreams"',
            },
            {
              id: '4',
              timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              user: 'maria.garcia@patunay.com',
              action: 'READ',
              resource: 'NFC Tag',
              details: 'Scanned NFC tag ABC123',
            },
            {
              id: '5',
              timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
              user: 'admin@patunay.com',
              action: 'DELETE',
              resource: 'User',
              details: 'Removed inactive user account',
            },
            {
              id: '6',
              timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
              user: 'david.wong@patunay.com',
              action: 'CREATE',
              resource: 'Appraisal',
              details: 'Added appraisal for "Abstract Harmony"',
            },
            {
              id: '7',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              user: 'emma.johnson@patunay.com',
              action: 'UPDATE',
              resource: 'NFC Tag',
              details: 'Updated NFC tag status to active',
            },
            {
              id: '8',
              timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
              user: 'michael.smith@patunay.com',
              action: 'VIEW',
              resource: 'Report',
              details: 'Generated monthly artwork report',
            },
            {
              id: '9',
              timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
              user: 'lisa.kim@patunay.com',
              action: 'CREATE',
              resource: 'Artwork',
              details: 'Created new artwork "Desert Mirage"',
            },
            {
              id: '10',
              timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
              user: 'admin@patunay.com',
              action: 'UPDATE',
              resource: 'System Settings',
              details: 'Modified NFC scanning configuration',
            },
            {
              id: '11',
              timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
              user: 'robert.taylor@patunay.com',
              action: 'CREATE',
              resource: 'User',
              details: 'Added new team member "alex.brown@patunay.com"',
            },
            {
              id: '12',
              timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
              user: 'jennifer.lee@patunay.com',
              action: 'UPDATE',
              resource: 'Artwork',
              details: 'Changed artwork status to "Sold"',
            },
            {
              id: '13',
              timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
              user: 'carlos.rodriguez@patunay.com',
              action: 'DELETE',
              resource: 'NFC Tag',
              details: 'Detached NFC tag from archived artwork',
            },
            {
              id: '14',
              timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
              user: 'admin@patunay.com',
              action: 'VIEW',
              resource: 'Dashboard',
              details: 'Accessed system analytics dashboard',
            },
            {
              id: '15',
              timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
              user: 'amy.wilson@patunay.com',
              action: 'CREATE',
              resource: 'Backup',
              details: 'Initiated system backup process',
            },
          ];

          return activities.slice(offset, offset + limit);
        }
      }),
      providesTags: [{ type: 'Statistics', id: 'ACTIVITY' }],
    }),
  }),
});

// Export hooks
export const {
  useGetDashboardStatsQuery,
  useGetTrendDataQuery,
  useGetSystemHealthQuery,
  useGetActivityLogQuery,
} = statisticsApi;