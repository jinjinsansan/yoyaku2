-- クライアント管理システム

-- セッションノート（カウンセリング記録）
CREATE TABLE session_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ NOT NULL,
  session_duration_minutes INTEGER NOT NULL DEFAULT 60,
  
  -- セッション詳細
  session_type TEXT CHECK (session_type IN ('initial', 'regular', 'followup', 'emergency', 'group')),
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10), -- 1-10スケール
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),
  
  -- ノート内容
  session_summary TEXT NOT NULL, -- セッション概要
  key_topics TEXT[], -- 主要なトピック
  client_goals TEXT[], -- クライアントの目標
  progress_notes TEXT, -- 進捗メモ
  homework_assigned TEXT, -- 宿題・課題
  next_session_focus TEXT, -- 次回セッションの焦点
  
  -- 評価とフラグ
  session_effectiveness INTEGER CHECK (session_effectiveness >= 1 AND session_effectiveness <= 5), -- 1-5スケール
  requires_followup BOOLEAN DEFAULT false,
  crisis_flag BOOLEAN DEFAULT false,
  confidential_notes TEXT, -- 機密メモ（カウンセラーのみ表示）
  
  -- タイムスタンプ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 制約
  UNIQUE(booking_id) -- 1予約につき1つのセッションノート
);

-- クライアント進捗追跡
CREATE TABLE client_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  
  -- 進捗情報
  assessment_date DATE NOT NULL,
  overall_progress INTEGER CHECK (overall_progress >= 1 AND overall_progress <= 10), -- 1-10スケール
  goal_achievement TEXT[], -- 達成した目標
  current_challenges TEXT[], -- 現在の課題
  strengths_identified TEXT[], -- 発見された強み
  
  -- 具体的な評価項目
  anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
  depression_level INTEGER CHECK (depression_level >= 1 AND depression_level <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  social_functioning INTEGER CHECK (social_functioning >= 1 AND social_functioning <= 10),
  work_performance INTEGER CHECK (work_performance >= 1 AND work_performance <= 10),
  
  -- コメント
  progress_summary TEXT,
  recommendations TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 次回セッション準備メモ
CREATE TABLE next_session_prep (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  last_session_note_id UUID REFERENCES session_notes(id) ON DELETE SET NULL,
  
  -- 準備内容
  topics_to_explore TEXT[], -- 探求すべきトピック
  techniques_to_use TEXT[], -- 使用予定の技法
  materials_needed TEXT[], -- 必要な資料
  homework_review TEXT, -- 宿題の確認事項
  
  -- セッション計画
  session_objectives TEXT[], -- セッション目標
  estimated_duration INTEGER DEFAULT 60, -- 予想所要時間（分）
  special_considerations TEXT, -- 特別な配慮事項
  
  -- フラグ
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
  requires_specialist_referral BOOLEAN DEFAULT false,
  needs_additional_resources BOOLEAN DEFAULT false,
  
  -- メモ
  counselor_notes TEXT,
  preparation_status TEXT DEFAULT 'pending' CHECK (preparation_status IN ('pending', 'in_progress', 'completed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 1クライアント・1カウンセラーペアにつき1つの準備メモ
  UNIQUE(client_id, counselor_id)
);

-- クライアント・カウンセラー関係性管理
CREATE TABLE client_counselor_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  
  -- 関係性情報
  relationship_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  relationship_status TEXT DEFAULT 'active' CHECK (relationship_status IN ('active', 'paused', 'completed', 'transferred')),
  total_sessions INTEGER DEFAULT 0,
  
  -- クライアント基本情報（初回時に記録）
  initial_concerns TEXT[],
  treatment_goals TEXT[],
  preferred_communication_style TEXT,
  cultural_considerations TEXT,
  emergency_contact_info JSONB,
  
  -- 治療計画
  treatment_approach TEXT[], -- 治療アプローチ
  session_frequency TEXT DEFAULT 'weekly' CHECK (session_frequency IN ('weekly', 'biweekly', 'monthly', 'as_needed')),
  estimated_treatment_length TEXT,
  
  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_id, counselor_id)
);

-- インデックス作成
CREATE INDEX idx_session_notes_counselor_id ON session_notes(counselor_id);
CREATE INDEX idx_session_notes_client_id ON session_notes(client_id);
CREATE INDEX idx_session_notes_session_date ON session_notes(session_date);
CREATE INDEX idx_session_notes_booking_id ON session_notes(booking_id);

CREATE INDEX idx_client_progress_counselor_id ON client_progress(counselor_id);
CREATE INDEX idx_client_progress_client_id ON client_progress(client_id);
CREATE INDEX idx_client_progress_assessment_date ON client_progress(assessment_date);

CREATE INDEX idx_next_session_prep_counselor_id ON next_session_prep(counselor_id);
CREATE INDEX idx_next_session_prep_client_id ON next_session_prep(client_id);
CREATE INDEX idx_next_session_prep_priority ON next_session_prep(priority_level);

CREATE INDEX idx_client_counselor_relationships_counselor_id ON client_counselor_relationships(counselor_id);
CREATE INDEX idx_client_counselor_relationships_client_id ON client_counselor_relationships(client_id);
CREATE INDEX idx_client_counselor_relationships_status ON client_counselor_relationships(relationship_status);

-- RLSポリシー有効化
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_session_prep ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_counselor_relationships ENABLE ROW LEVEL SECURITY;

-- セッションノートのポリシー
CREATE POLICY "Counselors can manage their own session notes" ON session_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE counselors.id = counselor_id 
      AND counselors.user_id = auth.uid()
    )
  );

-- クライアント進捗のポリシー
CREATE POLICY "Counselors can manage their clients' progress" ON client_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE counselors.id = counselor_id 
      AND counselors.user_id = auth.uid()
    )
  );

-- 次回セッション準備のポリシー
CREATE POLICY "Counselors can manage their session prep" ON next_session_prep
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE counselors.id = counselor_id 
      AND counselors.user_id = auth.uid()
    )
  );

-- クライアント関係性のポリシー
CREATE POLICY "Counselors can manage their client relationships" ON client_counselor_relationships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE counselors.id = counselor_id 
      AND counselors.user_id = auth.uid()
    )
  );

-- クライアントは自分の情報のみ参照可能（セッションノートは除く）
CREATE POLICY "Clients can view their own progress" ON client_progress
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can view their own relationships" ON client_counselor_relationships
  FOR SELECT USING (client_id = auth.uid());

-- トリガー関数：updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER update_session_notes_updated_at 
  BEFORE UPDATE ON session_notes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_progress_updated_at 
  BEFORE UPDATE ON client_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_next_session_prep_updated_at 
  BEFORE UPDATE ON next_session_prep 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_counselor_relationships_updated_at 
  BEFORE UPDATE ON client_counselor_relationships 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ビュー：クライアント概要（カウンセラー用）
CREATE VIEW counselor_client_overview AS
SELECT 
  ccr.id as relationship_id,
  ccr.counselor_id,
  ccr.client_id,
  u.name as client_name,
  u.email as client_email,
  ccr.relationship_start_date,
  ccr.relationship_status,
  ccr.total_sessions,
  ccr.initial_concerns,
  ccr.treatment_goals,
  ccr.session_frequency,
  
  -- 最新の進捗情報
  cp.overall_progress,
  cp.assessment_date as last_progress_date,
  cp.anxiety_level,
  cp.depression_level,
  cp.stress_level,
  
  -- 最新のセッション情報
  sn.session_date as last_session_date,
  sn.mood_after as last_session_mood,
  sn.next_session_focus,
  
  -- 次回準備情報
  nsp.priority_level as next_session_priority,
  nsp.preparation_status
  
FROM client_counselor_relationships ccr
LEFT JOIN users u ON ccr.client_id = u.id
LEFT JOIN LATERAL (
  SELECT * FROM client_progress 
  WHERE client_id = ccr.client_id AND counselor_id = ccr.counselor_id 
  ORDER BY assessment_date DESC LIMIT 1
) cp ON true
LEFT JOIN LATERAL (
  SELECT * FROM session_notes 
  WHERE client_id = ccr.client_id AND counselor_id = ccr.counselor_id 
  ORDER BY session_date DESC LIMIT 1
) sn ON true
LEFT JOIN next_session_prep nsp ON (
  nsp.client_id = ccr.client_id AND nsp.counselor_id = ccr.counselor_id
);

-- 関数：セッション完了時の総セッション数更新
CREATE OR REPLACE FUNCTION update_total_sessions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE client_counselor_relationships 
  SET total_sessions = (
    SELECT COUNT(*) 
    FROM session_notes 
    WHERE client_id = NEW.client_id AND counselor_id = NEW.counselor_id
  )
  WHERE client_id = NEW.client_id AND counselor_id = NEW.counselor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー：セッションノート作成時に総セッション数を更新
CREATE TRIGGER update_total_sessions_trigger
  AFTER INSERT ON session_notes
  FOR EACH ROW EXECUTE FUNCTION update_total_sessions();