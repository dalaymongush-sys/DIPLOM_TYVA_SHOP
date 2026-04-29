@echo off
echo Запуск сервера...
start cmd /k "cd server && npm run dev"

timeout /t 3 > nul

echo Запуск клиента...
start cmd /k "cd client && npm run dev"

timeout /t 5 > nul

echo Открытие браузера...
start http://localhost:5173

echo Готово
exit