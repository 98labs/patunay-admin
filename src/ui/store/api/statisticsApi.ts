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
      query: (request) => ({
        supabaseOperation: async () => {
          const timeRange = request?.timeRange;
          const now = new Date();
          const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          // Get artwork statistics
          let artworkQuery = supabase.from('artworks').select('tag_id, created_at');
          if (timeRange) {
            artworkQuery = artworkQuery
              .gte('created_at', timeRange.start)
              .lte('created_at', timeRange.end);
          }
          const { data: artworks, error: artworkError } = await artworkQuery;
          if (artworkError) throw artworkError;

          // Get user statistics
          const { data: users, error: userError } = await supabase
            .from('users')
            .select('is_active, created_at');
          if (userError) throw userError;

          // Mock NFC statistics (would come from NFC operation logs)
          const nfcStats = {
            totalTags: artworks?.filter(a => a.tag_id).length || 0,
            activeTags: artworks?.filter(a => a.tag_id).length || 0,
            successfulOperations: 150, // Mock data
            failedOperations: 12, // Mock data
            operationsToday: 8, // Mock data
          };

          // Mock system statistics
          const systemStats = {
            storage: {
              used: 2.5, // GB
              total: 10, // GB
              percentage: 25,
            },
            performance: {
              avgResponseTime: 245, // ms
              uptime: 99.8, // percentage
            },
          };

          return {
            artworks: {
              total: artworks?.length || 0,
              withNfc: artworks?.filter(a => a.tag_id).length || 0,
              withoutNfc: artworks?.filter(a => !a.tag_id).length || 0,
              recentlyAdded: artworks?.filter(a => new Date(a.created_at) > lastWeek).length || 0,
            },
            nfc: nfcStats,
            users: {
              total: users?.length || 0,
              active: users?.filter(u => u.is_active).length || 0,
              recentSignups: users?.filter(u => new Date(u.created_at) > lastWeek).length || 0,
            },
            system: systemStats,
          };
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
            .from('users')
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
              timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
              user: 'admin@patunay.com',
              action: 'CREATE',
              resource: 'Artwork',
              details: 'Created new artwork "Sunset Valley"',
            },
            {
              id: '2',
              timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              user: 'user@patunay.com',
              action: 'READ',
              resource: 'NFC Tag',
              details: 'Scanned NFC tag ABC123',
            },
            // Add more mock data...
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
  useLazyGetDashboardStatsQuery,
  useLazyGetTrendDataQuery,
} = statisticsApi;