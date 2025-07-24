@echo off
REM ====== ビルド開始 ======
echo [1/4] npm run build
npm run build
if %errorlevel% neq 0 (
  echo ビルド失敗
  pause
  exit /b %errorlevel%
)
REM ====== 変更をgitに追加 ======
echo [2/4] git add .
git add .
REM ====== コミット ======
echo [3/4] git commit
set /p msg="コミットメッセージを入力してください（例: auto: デプロイ）: "
git commit -m "%msg%"
REM ====== プッシュ ======
echo [4/4] git push
git push
echo ====== デプロイ完了 ======
pause 