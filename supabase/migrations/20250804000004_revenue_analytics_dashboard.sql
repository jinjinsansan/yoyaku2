-- 収益・統計ダッシュボード

-- 収益統計ビュー
CREATE VIEW counselor_revenue_stats AS
SELECT 
  c.id as counselor_id,
  c.user_id,
  
  -- 月別収益統計
  DATE_TRUNC('month', b.scheduled_at) as revenue_month,
  COUNT(b.id) as bookings_count,
  SUM(b.amount) as total_revenue,
  AVG(b.amount) as avg_booking_amount,
  
  -- サービス種別統計
  b.service_type,
  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
  COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
  
  -- 支払い方法統計
  b.payment_method,
  
  -- セッション時間統計
  EXTRACT(HOUR FROM b.scheduled_at) as session_hour,
  EXTRACT(DOW FROM b.scheduled_at) as session_weekday
  
FROM counselors c
LEFT JOIN bookings b ON c.id = b.counselor_id
WHERE b.scheduled_at IS NOT NULL
GROUP BY 
  c.id, c.user_id, 
  DATE_TRUNC('month', b.scheduled_at),
  b.service_type, b.payment_method,
  EXTRACT(HOUR FROM b.scheduled_at),
  EXTRACT(DOW FROM b.scheduled_at);

-- 時間帯別予約統計ビュー
CREATE VIEW counselor_time_slot_stats AS
SELECT 
  c.id as counselor_id,
  EXTRACT(HOUR FROM b.scheduled_at) as hour_of_day,
  EXTRACT(DOW FROM b.scheduled_at) as day_of_week,
  COUNT(b.id) as booking_count,
  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_count,
  AVG(b.amount) as avg_revenue_per_slot,
  
  -- 時間帯のラベル
  CASE 
    WHEN EXTRACT(HOUR FROM b.scheduled_at) BETWEEN 6 AND 11 THEN 'morning'
    WHEN EXTRACT(HOUR FROM b.scheduled_at) BETWEEN 12 AND 17 THEN 'afternoon'
    WHEN EXTRACT(HOUR FROM b.scheduled_at) BETWEEN 18 AND 22 THEN 'evening'
    ELSE 'night'
  END as time_period,
  
  -- 曜日のラベル
  CASE EXTRACT(DOW FROM b.scheduled_at)
    WHEN 0 THEN '日曜日'
    WHEN 1 THEN '月曜日'
    WHEN 2 THEN '火曜日'
    WHEN 3 THEN '水曜日'
    WHEN 4 THEN '木曜日'
    WHEN 5 THEN '金曜日'
    WHEN 6 THEN '土曜日'
  END as weekday_name

FROM counselors c
LEFT JOIN bookings b ON c.id = b.counselor_id
WHERE b.scheduled_at IS NOT NULL
  AND b.scheduled_at >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY 
  c.id,
  EXTRACT(HOUR FROM b.scheduled_at),
  EXTRACT(DOW FROM b.scheduled_at);

-- カウンセラー満足度統計ビュー
CREATE VIEW counselor_satisfaction_stats AS
SELECT 
  c.id as counselor_id,
  DATE_TRUNC('month', r.created_at) as review_month,
  
  -- レビュー統計
  COUNT(r.id) as total_reviews,
  AVG(r.rating) as avg_rating,
  COUNT(CASE WHEN r.rating >= 4 THEN 1 END) as positive_reviews,
  COUNT(CASE WHEN r.rating <= 2 THEN 1 END) as negative_reviews,
  
  -- 評価分布
  COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star_count,
  
  -- セッション効果統計（セッションノートから）
  AVG(sn.session_effectiveness) as avg_session_effectiveness,
  AVG(sn.mood_after - sn.mood_before) as avg_mood_improvement

FROM counselors c
LEFT JOIN reviews r ON c.id = r.counselor_id
LEFT JOIN session_notes sn ON c.id = sn.counselor_id 
  AND DATE_TRUNC('month', sn.session_date) = DATE_TRUNC('month', r.created_at)
WHERE r.created_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY 
  c.id,
  DATE_TRUNC('month', r.created_at);

-- カウンセラー総合統計ビュー
CREATE VIEW counselor_comprehensive_stats AS
SELECT 
  c.id as counselor_id,
  c.user_id,
  u.name as counselor_name,
  
  -- 基本統計（全期間）
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
  COUNT(DISTINCT b.user_id) as unique_clients,
  SUM(CASE WHEN b.status = 'completed' THEN b.amount ELSE 0 END) as total_revenue,
  
  -- 今月の統計
  COUNT(DISTINCT CASE 
    WHEN b.scheduled_at >= DATE_TRUNC('month', CURRENT_DATE) 
    THEN b.id END) as current_month_bookings,
  SUM(CASE 
    WHEN b.scheduled_at >= DATE_TRUNC('month', CURRENT_DATE) 
    AND b.status = 'completed' 
    THEN b.amount ELSE 0 END) as current_month_revenue,
  
  -- 先月の統計
  COUNT(DISTINCT CASE 
    WHEN b.scheduled_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
    AND b.scheduled_at < DATE_TRUNC('month', CURRENT_DATE)
    THEN b.id END) as last_month_bookings,
  SUM(CASE 
    WHEN b.scheduled_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
    AND b.scheduled_at < DATE_TRUNC('month', CURRENT_DATE)
    AND b.status = 'completed' 
    THEN b.amount ELSE 0 END) as last_month_revenue,
  
  -- 満足度統計
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as total_reviews,
  
  -- セッション効果統計
  AVG(sn.session_effectiveness) as avg_session_effectiveness,
  AVG(sn.mood_after - sn.mood_before) as avg_mood_improvement,
  
  -- 人気時間帯
  MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM b.scheduled_at)) as most_popular_hour,
  MODE() WITHIN GROUP (ORDER BY EXTRACT(DOW FROM b.scheduled_at)) as most_popular_weekday

FROM counselors c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN bookings b ON c.id = b.counselor_id
LEFT JOIN reviews r ON c.id = r.counselor_id
LEFT JOIN session_notes sn ON c.id = sn.counselor_id
GROUP BY c.id, c.user_id, u.name;

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_bookings_counselor_scheduled_at ON bookings(counselor_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status_amount ON bookings(status, amount);
CREATE INDEX IF NOT EXISTS idx_reviews_counselor_created_at ON reviews(counselor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_session_notes_counselor_session_date ON session_notes(counselor_id, session_date);

-- 関数：月別収益データ取得
CREATE OR REPLACE FUNCTION get_monthly_revenue_data(
  p_counselor_id UUID,
  p_months_back INTEGER DEFAULT 12
) RETURNS TABLE (
  month_date DATE,
  bookings_count BIGINT,
  revenue NUMERIC,
  avg_booking_amount NUMERIC,
  completed_bookings BIGINT,
  cancelled_bookings BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', b.scheduled_at)::DATE as month_date,
    COUNT(b.id) as bookings_count,
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.amount ELSE 0 END), 0) as revenue,
    COALESCE(AVG(CASE WHEN b.status = 'completed' THEN b.amount END), 0) as avg_booking_amount,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
    COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings
  FROM bookings b
  WHERE b.counselor_id = p_counselor_id
    AND b.scheduled_at >= DATE_TRUNC('month', CURRENT_DATE) - (p_months_back || ' months')::INTERVAL
    AND b.scheduled_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY DATE_TRUNC('month', b.scheduled_at)
  ORDER BY month_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数：時間帯別統計データ取得
CREATE OR REPLACE FUNCTION get_time_slot_analytics(
  p_counselor_id UUID,
  p_days_back INTEGER DEFAULT 90
) RETURNS TABLE (
  hour_of_day INTEGER,
  weekday INTEGER,
  weekday_name TEXT,
  booking_count BIGINT,
  completed_count BIGINT,
  avg_revenue NUMERIC,
  time_period TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM b.scheduled_at)::INTEGER as hour_of_day,
    EXTRACT(DOW FROM b.scheduled_at)::INTEGER as weekday,
    CASE EXTRACT(DOW FROM b.scheduled_at)
      WHEN 0 THEN '日曜日'
      WHEN 1 THEN '月曜日'
      WHEN 2 THEN '火曜日'  
      WHEN 3 THEN '水曜日'
      WHEN 4 THEN '木曜日'
      WHEN 5 THEN '金曜日'
      WHEN 6 THEN '土曜日'
    END as weekday_name,
    COUNT(b.id) as booking_count,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_count,
    COALESCE(AVG(CASE WHEN b.status = 'completed' THEN b.amount END), 0) as avg_revenue,
    CASE 
      WHEN EXTRACT(HOUR FROM b.scheduled_at) BETWEEN 6 AND 11 THEN 'morning'
      WHEN EXTRACT(HOUR FROM b.scheduled_at) BETWEEN 12 AND 17 THEN 'afternoon'
      WHEN EXTRACT(HOUR FROM b.scheduled_at) BETWEEN 18 AND 22 THEN 'evening'
      ELSE 'night'
    END as time_period
  FROM bookings b
  WHERE b.counselor_id = p_counselor_id
    AND b.scheduled_at >= CURRENT_DATE - (p_days_back || ' days')::INTERVAL
    AND b.scheduled_at IS NOT NULL
  GROUP BY 
    EXTRACT(HOUR FROM b.scheduled_at),
    EXTRACT(DOW FROM b.scheduled_at)
  ORDER BY weekday, hour_of_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数：満足度トレンドデータ取得
CREATE OR REPLACE FUNCTION get_satisfaction_trends(
  p_counselor_id UUID,
  p_months_back INTEGER DEFAULT 12
) RETURNS TABLE (
  month_date DATE,
  total_reviews BIGINT,
  avg_rating NUMERIC,
  positive_reviews BIGINT,
  negative_reviews BIGINT,
  rating_distribution JSONB,
  avg_session_effectiveness NUMERIC,
  avg_mood_improvement NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', r.created_at)::DATE as month_date,
    COUNT(r.id) as total_reviews,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(CASE WHEN r.rating >= 4 THEN 1 END) as positive_reviews,
    COUNT(CASE WHEN r.rating <= 2 THEN 1 END) as negative_reviews,
    jsonb_build_object(
      '5', COUNT(CASE WHEN r.rating = 5 THEN 1 END),
      '4', COUNT(CASE WHEN r.rating = 4 THEN 1 END),
      '3', COUNT(CASE WHEN r.rating = 3 THEN 1 END),
      '2', COUNT(CASE WHEN r.rating = 2 THEN 1 END),
      '1', COUNT(CASE WHEN r.rating = 1 THEN 1 END)
    ) as rating_distribution,
    COALESCE(AVG(sn.session_effectiveness), 0) as avg_session_effectiveness,
    COALESCE(AVG(sn.mood_after - sn.mood_before), 0) as avg_mood_improvement
  FROM reviews r
  LEFT JOIN session_notes sn ON r.counselor_id = sn.counselor_id 
    AND DATE_TRUNC('month', r.created_at) = DATE_TRUNC('month', sn.session_date)
  WHERE r.counselor_id = p_counselor_id
    AND r.created_at >= DATE_TRUNC('month', CURRENT_DATE) - (p_months_back || ' months')::INTERVAL
    AND r.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY DATE_TRUNC('month', r.created_at)
  ORDER BY month_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLSポリシー（ビューは既存のテーブルのポリシーを継承するが、関数用にも設定）
-- ビューに対しては明示的なRLSは不要（基底テーブルのRLSが適用される）

-- 統計関数用のセキュリティ確認関数
CREATE OR REPLACE FUNCTION check_counselor_access(p_counselor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM counselors 
    WHERE id = p_counselor_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数のセキュリティ強化
CREATE OR REPLACE FUNCTION get_monthly_revenue_data(
  p_counselor_id UUID,
  p_months_back INTEGER DEFAULT 12
) RETURNS TABLE (
  month_date DATE,
  bookings_count BIGINT,
  revenue NUMERIC,
  avg_booking_amount NUMERIC,
  completed_bookings BIGINT,
  cancelled_bookings BIGINT
) AS $$
BEGIN
  -- アクセス権限チェック
  IF NOT check_counselor_access(p_counselor_id) THEN
    RAISE EXCEPTION 'Access denied: You can only view your own statistics';
  END IF;

  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', b.scheduled_at)::DATE as month_date,
    COUNT(b.id) as bookings_count,
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.amount ELSE 0 END), 0) as revenue,
    COALESCE(AVG(CASE WHEN b.status = 'completed' THEN b.amount END), 0) as avg_booking_amount,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
    COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings
  FROM bookings b
  WHERE b.counselor_id = p_counselor_id
    AND b.scheduled_at >= DATE_TRUNC('month', CURRENT_DATE) - (p_months_back || ' months')::INTERVAL
    AND b.scheduled_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY DATE_TRUNC('month', b.scheduled_at)
  ORDER BY month_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;