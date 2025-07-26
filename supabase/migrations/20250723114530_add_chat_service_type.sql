/*
  # サービスタイプに「chat」を追加

  チャット機能のためのサービスタイプを追加します
*/

-- 既存のENUMに「chat」を追加
ALTER TYPE service_type ADD VALUE 'chat'; 