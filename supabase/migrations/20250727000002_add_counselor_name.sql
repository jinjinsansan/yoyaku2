-- counselorsテーブルにnameカラムを追加

-- nameカラムを追加
ALTER TABLE counselors ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- 既存データのnameを更新
UPDATE counselors 
SET name = CASE 
  WHEN bio LIKE '%代表%' THEN 'NAMIDAサポート協会代表'
  WHEN bio LIKE '%マスター管理者%' THEN 'マスター管理者'
  ELSE 'カウンセラー'
END
WHERE name IS NULL;

-- nameカラムをNOT NULLに設定
ALTER TABLE counselors ALTER COLUMN name SET NOT NULL; 