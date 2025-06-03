-- Database Views for Dashboard Statistics
-- These views pre-aggregate data for better performance on the Dashboard

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
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_signups_week,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_signups_month,
  COUNT(CASE WHEN last_sign_in_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as active_today
FROM auth.users;

-- =====================================================
-- DAILY ACTIVITY TRENDS VIEW
-- =====================================================
CREATE OR REPLACE VIEW daily_activity_trends AS
SELECT 
  date_trunc('day', created_at) as activity_date,
  'artwork' as activity_type,
  COUNT(*) as count
FROM artworks 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date_trunc('day', created_at)

UNION ALL

SELECT 
  date_trunc('day', created_at) as activity_date,
  'tag' as activity_type,
  COUNT(*) as count
FROM tags 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date_trunc('day', created_at)

UNION ALL

SELECT 
  date_trunc('day', created_at) as activity_date,
  'user' as activity_type,
  COUNT(*) as count
FROM auth.users 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date_trunc('day', created_at)

ORDER BY activity_date DESC;

-- =====================================================
-- ARTWORK NFC STATUS SUMMARY VIEW
-- =====================================================
CREATE OR REPLACE VIEW artwork_nfc_summary AS
SELECT 
  a.id,
  a.title,
  a.artist,
  a.created_at,
  a.tag_id,
  t.active as tag_active,
  t.read_write_count,
  t.expiration_date,
  CASE 
    WHEN a.tag_id IS NOT NULL AND t.active = true THEN 'attached'
    WHEN a.tag_id IS NOT NULL AND t.active = false THEN 'detached'
    ELSE 'no_nfc'
  END as nfc_status
FROM artworks a
LEFT JOIN tags t ON a.tag_id = t.id;

-- =====================================================
-- MONTHLY STATISTICS SUMMARY VIEW
-- =====================================================
CREATE OR REPLACE VIEW monthly_stats_summary AS
SELECT 
  date_trunc('month', generate_series(
    CURRENT_DATE - INTERVAL '12 months',
    CURRENT_DATE,
    INTERVAL '1 month'
  )) as month,
  
  COALESCE(artwork_counts.artworks_created, 0) as artworks_created,
  COALESCE(tag_counts.tags_created, 0) as tags_created,
  COALESCE(user_counts.users_created, 0) as users_created
  
FROM generate_series(
  CURRENT_DATE - INTERVAL '12 months',
  CURRENT_DATE,
  INTERVAL '1 month'
) as months

LEFT JOIN (
  SELECT 
    date_trunc('month', created_at) as month,
    COUNT(*) as artworks_created
  FROM artworks
  WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY date_trunc('month', created_at)
) artwork_counts ON months = artwork_counts.month

LEFT JOIN (
  SELECT 
    date_trunc('month', created_at) as month,
    COUNT(*) as tags_created
  FROM tags
  WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY date_trunc('month', created_at)
) tag_counts ON months = tag_counts.month

LEFT JOIN (
  SELECT 
    date_trunc('month', created_at) as month,
    COUNT(*) as users_created
  FROM auth.users
  WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY date_trunc('month', created_at)
) user_counts ON months = user_counts.month

ORDER BY month DESC;

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
-- GRANT PERMISSIONS (if needed)
-- =====================================================
-- Grant access to authenticated users
GRANT SELECT ON artwork_stats TO authenticated;
GRANT SELECT ON nfc_stats TO authenticated;
GRANT SELECT ON user_stats TO authenticated;
GRANT SELECT ON daily_activity_trends TO authenticated;
GRANT SELECT ON artwork_nfc_summary TO authenticated;
GRANT SELECT ON monthly_stats_summary TO authenticated;
GRANT SELECT ON system_performance_metrics TO authenticated;

-- Grant access to service role (for server-side operations)
GRANT SELECT ON artwork_stats TO service_role;
GRANT SELECT ON nfc_stats TO service_role;
GRANT SELECT ON user_stats TO service_role;
GRANT SELECT ON daily_activity_trends TO service_role;
GRANT SELECT ON artwork_nfc_summary TO service_role;
GRANT SELECT ON monthly_stats_summary TO service_role;
GRANT SELECT ON system_performance_metrics TO service_role;