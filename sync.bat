@echo off
cd /d "%~dp0"

echo [Step 1] Adding changes...
git add .

echo [Step 2] Committing...
git commit -m "update_from_moss"

echo [Step 3] Syncing to Cloud...
:: 强制覆盖，确保本地最新
git push -f origin main

echo.
echo ========================================
echo  SUCCESS! Your site is updating.
echo ========================================
pause