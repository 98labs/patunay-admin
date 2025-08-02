-- Apply database views for dashboard statistics
-- Run this script in your Supabase SQL editor

-- =====================================================
-- ARTWORK STATISTICS VIEW
-- =====================================================
CREATE OR REPLACE VIEW artwork_stats AS
SELECT 
  COUNT(*) as total_artworks,
  COUNT(tag_id) as artworks_with_nfc,
  COUNT(*) - COUNT(tag_id) as artworks_without_nfc,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recently_added_week,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recently_added_month,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as recently_added_today
FROM artworks;

-- =====================================================
-- NFC TAG STATISTICS VIEW
-- =====================================================
CREATE OR REPLACE VIEW nfc_stats AS
SELECT 
  COUNT(*) as total_tags,
  COUNT(CASE WHEN active = true THEN 1 END) as active_tags,
  COUNT(CASE WHEN active = false THEN 1 END) as inactive_tags,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as tags_created_week,
  AVG(read_write_count) as avg_read_write_count,
  SUM(read_write_count) as total_operations
FROM tags;

-- =====================================================
-- USER STATISTICS VIEW
-- =====================================================
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as active_users,
  COUNT(CASE WHEN last_sign_in_at IS NULL THEN 1 END) as inactive_users,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_signups_week,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_signups_month,
  COUNT(CASE WHEN last_sign_in_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as active_today
FROM auth.users;

-- =====================================================
-- SYSTEM PERFORMANCE METRICS VIEW (Mock data for demo)
-- =====================================================
CREATE OR REPLACE VIEW system_performance_metrics AS
SELECT 
  'storage' as metric_type,
  2.5 as current_value,
  10.0 as max_value,
  'GB' as unit,
  25.0 as percentage,
  CURRENT_TIMESTAMP as last_updated

UNION ALL

SELECT 
  'response_time' as metric_type,
  245.0 as current_value,
  1000.0 as max_value,
  'ms' as unit,
  24.5 as percentage,
  CURRENT_TIMESTAMP as last_updated

UNION ALL

SELECT 
  'uptime' as metric_type,
  99.8 as current_value,
  100.0 as max_value,
  '%' as unit,
  99.8 as percentage,
  CURRENT_TIMESTAMP as last_updated;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Grant access to authenticated users
GRANT SELECT ON artwork_stats TO authenticated;
GRANT SELECT ON nfc_stats TO authenticated;
GRANT SELECT ON user_stats TO authenticated;
GRANT SELECT ON system_performance_metrics TO authenticated;

-- Grant access to service role (for server-side operations)
GRANT SELECT ON artwork_stats TO service_role;
GRANT SELECT ON nfc_stats TO service_role;
GRANT SELECT ON user_stats TO service_role;
GRANT SELECT ON system_performance_metrics TO service_role;

-- Verify views were created successfully
SELECT 'artwork_stats' as view_name, EXISTS (SELECT FROM pg_views WHERE viewname = 'artwork_stats') as exists
UNION ALL
SELECT 'nfc_stats', EXISTS (SELECT FROM pg_views WHERE viewname = 'nfc_stats')
UNION ALL
SELECT 'user_stats', EXISTS (SELECT FROM pg_views WHERE viewname = 'user_stats')
UNION ALL
SELECT 'system_performance_metrics', EXISTS (SELECT FROM pg_views WHERE viewname = 'system_performance_metrics');