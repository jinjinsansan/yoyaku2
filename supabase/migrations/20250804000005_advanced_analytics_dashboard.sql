-- 高度な分析ダッシュボード

-- リアルタイムKPI集計テーブル
CREATE TABLE realtime_kpi_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_hour INTEGER NOT NULL DEFAULT EXTRACT(HOUR FROM CURRENT_TIME),
  
  -- 全体統計
  total_active_bookings INTEGER DEFAULT 0,
  total_revenue_today DECIMAL(10,2) DEFAULT 0,
  average_session_rating DECIMAL(3,2) DEFAULT 0,
  total_completed_sessions_today INTEGER DEFAULT 0,
  total_cancelled_sessions_today INTEGER DEFAULT 0,
  
  -- ユーザー行動メトリクス
  new_user_registrations INTEGER DEFAULT 0,
  active_users_last_hour INTEGER DEFAULT 0,
  booking_conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- カウンセラー稼働率
  active_counselors INTEGER DEFAULT 0,
  total_available_slots INTEGER DEFAULT 0,
  occupied_slots INTEGER DEFAULT 0,
  counselor_utilization_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー行動分析テーブル
CREATE TABLE user_behavior_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id UUID DEFAULT gen_random_uuid(),
  
  -- セッション情報
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  page_views INTEGER DEFAULT 1,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- ユーザーアクション
  counselor_searches INTEGER DEFAULT 0,
  counselor_profile_views INTEGER DEFAULT 0,
  booking_attempts INTEGER DEFAULT 0,
  successful_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  
  -- 検索・フィルター使用
  search_filters_used JSONB DEFAULT '{}',
  preferred_specializations TEXT[],
  preferred_time_slots TEXT[],
  
  -- デバイス・ブラウザ情報
  user_agent TEXT,
  device_type VARCHAR(20) DEFAULT 'unknown',
  browser_type VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 収益予測データテーブル
CREATE TABLE revenue_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID REFERENCES counselors(id),
  prediction_date DATE NOT NULL,
  prediction_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  
  -- 予測値
  predicted_revenue DECIMAL(10,2) NOT NULL,
  predicted_bookings INTEGER NOT NULL,
  confidence_level DECIMAL(5,2) DEFAULT 0.5, -- 0.0-1.0
  
  -- 予測に使用した要因
  historical_trend_factor DECIMAL(5,4) DEFAULT 1.0,
  seasonal_factor DECIMAL(5,4) DEFAULT 1.0,
  market_trend_factor DECIMAL(5,4) DEFAULT 1.0,
  counselor_performance_factor DECIMAL(5,4) DEFAULT 1.0,
  
  -- 実績値（後で更新）
  actual_revenue DECIMAL(10,2),
  actual_bookings INTEGER,
  prediction_accuracy DECIMAL(5,2), -- 予測精度
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- カウンセラー稼働率分析ビュー
CREATE VIEW counselor_utilization_analysis AS
SELECT 
  c.id as counselor_id,
  c.user_id,
  u.name as counselor_name,
  
  -- 今日の稼働率
  COUNT(DISTINCT CASE 
    WHEN a.date = CURRENT_DATE AND a.is_available = true 
    THEN a.time_slot END) as available_slots_today,
  COUNT(DISTINCT CASE 
    WHEN b.scheduled_at::DATE = CURRENT_DATE AND b.status IN ('confirmed', 'completed')
    THEN b.id END) as booked_slots_today,
    
  -- 今週の稼働率
  COUNT(DISTINCT CASE 
    WHEN a.date >= DATE_TRUNC('week', CURRENT_DATE) 
    AND a.date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
    AND a.is_available = true 
    THEN CONCAT(a.date, '-', a.time_slot) END) as available_slots_week,
  COUNT(DISTINCT CASE 
    WHEN b.scheduled_at >= DATE_TRUNC('week', CURRENT_DATE)
    AND b.scheduled_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
    AND b.status IN ('confirmed', 'completed')
    THEN b.id END) as booked_slots_week,
    
  -- 今月の稼働率
  COUNT(DISTINCT CASE 
    WHEN a.date >= DATE_TRUNC('month', CURRENT_DATE) 
    AND a.date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    AND a.is_available = true 
    THEN CONCAT(a.date, '-', a.time_slot) END) as available_slots_month,
  COUNT(DISTINCT CASE 
    WHEN b.scheduled_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND b.scheduled_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    AND b.status IN ('confirmed', 'completed')
    THEN b.id END) as booked_slots_month,
    
  -- 平均レスポンス時間
  AVG(EXTRACT(EPOCH FROM (b.created_at - b.created_at))) as avg_response_time_seconds,
  
  -- 直近のアクティビティ
  MAX(b.created_at) as last_booking_time,
  MAX(a.updated_at) as last_availability_update
  
FROM counselors c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN availability a ON c.id = a.counselor_id
LEFT JOIN bookings b ON c.id = b.counselor_id
GROUP BY c.id, c.user_id, u.name;

-- ユーザー行動パターン分析ビュー
CREATE VIEW user_behavior_patterns AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  
  -- セッション統計
  COUNT(DISTINCT uba.session_id) as total_sessions,
  AVG(uba.time_spent_seconds) as avg_session_duration,
  SUM(uba.page_views) as total_page_views,
  
  -- 検索・予約行動
  SUM(uba.counselor_searches) as total_searches,
  SUM(uba.counselor_profile_views) as total_profile_views,
  SUM(uba.booking_attempts) as total_booking_attempts,
  SUM(uba.successful_bookings) as total_successful_bookings,
  
  -- コンバージョン率
  CASE WHEN SUM(uba.booking_attempts) > 0 THEN
    (SUM(uba.successful_bookings)::DECIMAL / SUM(uba.booking_attempts)) * 100
  ELSE 0 END as booking_conversion_rate,
  
  -- 好みの傾向
  MODE() WITHIN GROUP (ORDER BY unnest(uba.preferred_specializations)) as most_preferred_specialization,
  MODE() WITHIN GROUP (ORDER BY unnest(uba.preferred_time_slots)) as most_preferred_time_slot,
  
  -- デバイス傾向
  MODE() WITHIN GROUP (ORDER BY uba.device_type) as primary_device_type,
  
  -- 最終アクティビティ
  MAX(uba.session_start) as last_activity,
  
  -- アクティビティレベル
  CASE 
    WHEN MAX(uba.session_start) > CURRENT_DATE - INTERVAL '7 days' THEN 'active'
    WHEN MAX(uba.session_start) > CURRENT_DATE - INTERVAL '30 days' THEN 'inactive'
    ELSE 'dormant'
  END as activity_level
  
FROM users u
LEFT JOIN user_behavior_analytics uba ON u.id = uba.user_id
WHERE u.role = 'client'
GROUP BY u.id, u.name, u.email;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_realtime_kpi_date_hour ON realtime_kpi_metrics(metric_date, metric_hour);
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_session ON user_behavior_analytics(user_id, session_start);
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_counselor_date ON revenue_predictions(counselor_id, prediction_date);
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_period ON revenue_predictions(prediction_period, prediction_date);

-- リアルタイムKPI更新関数
CREATE OR REPLACE FUNCTION update_realtime_kpi()
RETURNS VOID AS $$
DECLARE
  current_hour INTEGER := EXTRACT(HOUR FROM CURRENT_TIME);
  current_date DATE := CURRENT_DATE;
BEGIN
  -- 既存のレコードがあるかチェック
  IF EXISTS (SELECT 1 FROM realtime_kpi_metrics WHERE metric_date = current_date AND metric_hour = current_hour) THEN
    -- 更新
    UPDATE realtime_kpi_metrics SET
      total_active_bookings = (
        SELECT COUNT(*) FROM bookings 
        WHERE status = 'confirmed' AND scheduled_at::DATE = current_date
      ),
      total_revenue_today = (
        SELECT COALESCE(SUM(amount), 0) FROM bookings 
        WHERE status = 'completed' AND scheduled_at::DATE = current_date
      ),
      average_session_rating = (
        SELECT COALESCE(AVG(rating), 0) FROM reviews 
        WHERE created_at::DATE = current_date
      ),
      total_completed_sessions_today = (
        SELECT COUNT(*) FROM bookings 
        WHERE status = 'completed' AND scheduled_at::DATE = current_date
      ),
      total_cancelled_sessions_today = (
        SELECT COUNT(*) FROM bookings 
        WHERE status = 'cancelled' AND updated_at::DATE = current_date
      ),
      new_user_registrations = (
        SELECT COUNT(*) FROM users 
        WHERE created_at::DATE = current_date
      ),
      active_users_last_hour = (
        SELECT COUNT(DISTINCT user_id) FROM user_behavior_analytics 
        WHERE session_start >= NOW() - INTERVAL '1 hour'
      ),
      active_counselors = (
        SELECT COUNT(DISTINCT c.id) FROM counselors c
        JOIN availability a ON c.id = a.counselor_id
        WHERE a.date = current_date AND a.is_available = true
      ),
      updated_at = NOW()
    WHERE metric_date = current_date AND metric_hour = current_hour;
  ELSE
    -- 新規挿入
    INSERT INTO realtime_kpi_metrics (
      metric_date, metric_hour,
      total_active_bookings, total_revenue_today, average_session_rating,
      total_completed_sessions_today, total_cancelled_sessions_today,
      new_user_registrations, active_users_last_hour, active_counselors
    ) VALUES (
      current_date, current_hour,
      (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND scheduled_at::DATE = current_date),
      (SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE status = 'completed' AND scheduled_at::DATE = current_date),
      (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE created_at::DATE = current_date),
      (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND scheduled_at::DATE = current_date),
      (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled' AND updated_at::DATE = current_date),
      (SELECT COUNT(*) FROM users WHERE created_at::DATE = current_date),
      (SELECT COUNT(DISTINCT user_id) FROM user_behavior_analytics WHERE session_start >= NOW() - INTERVAL '1 hour'),
      (SELECT COUNT(DISTINCT c.id) FROM counselors c JOIN availability a ON c.id = a.counselor_id WHERE a.date = current_date AND a.is_available = true)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 収益予測計算関数
CREATE OR REPLACE FUNCTION calculate_revenue_prediction(
  p_counselor_id UUID,
  p_prediction_period VARCHAR(20),
  p_periods_ahead INTEGER DEFAULT 1
)
RETURNS TABLE (
  prediction_date DATE,
  predicted_revenue DECIMAL(10,2),
  predicted_bookings INTEGER,
  confidence_level DECIMAL(5,2)
) AS $$
DECLARE
  historical_data RECORD;
  seasonal_factor DECIMAL(5,4) := 1.0;
  trend_factor DECIMAL(5,4) := 1.0;
  base_date DATE;
BEGIN
  -- 予測期間の開始日を設定
  CASE p_prediction_period
    WHEN 'daily' THEN base_date := CURRENT_DATE + (p_periods_ahead || ' days')::INTERVAL;
    WHEN 'weekly' THEN base_date := DATE_TRUNC('week', CURRENT_DATE) + (p_periods_ahead || ' weeks')::INTERVAL;
    WHEN 'monthly' THEN base_date := DATE_TRUNC('month', CURRENT_DATE) + (p_periods_ahead || ' months')::INTERVAL;
    WHEN 'quarterly' THEN base_date := DATE_TRUNC('quarter', CURRENT_DATE) + (p_periods_ahead * 3 || ' months')::INTERVAL;
    ELSE base_date := CURRENT_DATE + INTERVAL '1 day';
  END CASE;

  -- 過去データから傾向を分析
  SELECT 
    AVG(amount) as avg_revenue_per_booking,
    COUNT(*) as avg_bookings_per_period,
    STDDEV(amount) as revenue_volatility
  INTO historical_data
  FROM bookings b
  WHERE b.counselor_id = p_counselor_id
    AND b.status = 'completed'
    AND b.scheduled_at >= CURRENT_DATE - INTERVAL '6 months';

  -- 季節性ファクターの計算（簡易版）
  IF EXTRACT(MONTH FROM base_date) IN (12, 1, 2) THEN
    seasonal_factor := 0.9; -- 冬季は需要減
  ELSIF EXTRACT(MONTH FROM base_date) IN (4, 5, 9, 10) THEN
    seasonal_factor := 1.1; -- 春秋は需要増
  END IF;

  -- トレンドファクターの計算（過去3ヶ月の成長率）
  SELECT 
    CASE WHEN prev.avg_amount > 0 THEN
      GREATEST(0.5, LEAST(2.0, curr.avg_amount / prev.avg_amount))
    ELSE 1.0 END
  INTO trend_factor
  FROM (
    SELECT AVG(amount) as avg_amount
    FROM bookings 
    WHERE counselor_id = p_counselor_id 
      AND status = 'completed'
      AND scheduled_at >= CURRENT_DATE - INTERVAL '3 months'
  ) curr
  CROSS JOIN (
    SELECT AVG(amount) as avg_amount
    FROM bookings 
    WHERE counselor_id = p_counselor_id 
      AND status = 'completed'
      AND scheduled_at >= CURRENT_DATE - INTERVAL '6 months'
      AND scheduled_at < CURRENT_DATE - INTERVAL '3 months'
  ) prev;

  -- 予測値を返す
  RETURN QUERY SELECT 
    base_date as prediction_date,
    ROUND(
      (historical_data.avg_revenue_per_booking * historical_data.avg_bookings_per_period * seasonal_factor * trend_factor),
      2
    ) as predicted_revenue,
    ROUND(historical_data.avg_bookings_per_period * seasonal_factor * trend_factor)::INTEGER as predicted_bookings,
    CASE 
      WHEN historical_data.revenue_volatility IS NULL OR historical_data.revenue_volatility = 0 THEN 0.5
      ELSE GREATEST(0.1, LEAST(0.95, 1.0 - (historical_data.revenue_volatility / historical_data.avg_revenue_per_booking)))
    END as confidence_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー行動トラッキング関数
CREATE OR REPLACE FUNCTION track_user_behavior(
  p_user_id UUID,
  p_session_id UUID,
  p_action VARCHAR(50),
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  -- セッションレコードの更新または作成
  INSERT INTO user_behavior_analytics (
    user_id, session_id, session_start,
    counselor_searches, counselor_profile_views, booking_attempts, successful_bookings
  ) VALUES (
    p_user_id, p_session_id, NOW(),
    CASE WHEN p_action = 'counselor_search' THEN 1 ELSE 0 END,
    CASE WHEN p_action = 'profile_view' THEN 1 ELSE 0 END,
    CASE WHEN p_action = 'booking_attempt' THEN 1 ELSE 0 END,
    CASE WHEN p_action = 'booking_success' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, session_id) DO UPDATE SET
    counselor_searches = user_behavior_analytics.counselor_searches + 
      CASE WHEN p_action = 'counselor_search' THEN 1 ELSE 0 END,
    counselor_profile_views = user_behavior_analytics.counselor_profile_views + 
      CASE WHEN p_action = 'profile_view' THEN 1 ELSE 0 END,
    booking_attempts = user_behavior_analytics.booking_attempts + 
      CASE WHEN p_action = 'booking_attempt' THEN 1 ELSE 0 END,
    successful_bookings = user_behavior_analytics.successful_bookings + 
      CASE WHEN p_action = 'booking_success' THEN 1 ELSE 0 END,
    session_end = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLSポリシー
ALTER TABLE realtime_kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_predictions ENABLE ROW LEVEL SECURITY;

-- 管理者のみがKPI メトリクスを閲覧可能
CREATE POLICY "Admin can view KPI metrics" ON realtime_kpi_metrics FOR SELECT
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ユーザーは自分の行動データのみ閲覧可能
CREATE POLICY "Users can view own behavior data" ON user_behavior_analytics FOR SELECT
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- カウンセラーは自分の収益予測のみ閲覧可能
CREATE POLICY "Counselors can view own predictions" ON revenue_predictions FOR SELECT
USING (
  counselor_id IN (SELECT id FROM counselors WHERE user_id = auth.uid()) 
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 自動KPI更新トリガー（1時間ごと）
-- Note: 実際の本番環境では cron job や外部スケジューラーを使用
CREATE OR REPLACE FUNCTION trigger_kpi_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_realtime_kpi();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 予約作成時にKPIを更新
CREATE TRIGGER update_kpi_on_booking
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_kpi_update();