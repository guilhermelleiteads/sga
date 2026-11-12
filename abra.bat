@echo off
setlocal

set "APP_DIR=%~dp0"

if /I "%~1"=="api" goto run_api
if /I "%~1"=="telemetria" goto run_telemetria
if /I "%~1"=="frontend" goto run_frontend

call :ensure_service 3001 "SGA API (3001)" api beck_end
if errorlevel 1 goto api_failed

netstat -ano | findstr /R /C:":3002 .*LISTENING" >nul
if errorlevel 1 (
	start "Telemetria API e Node-RED" /D "%APP_DIR%back_end_telemetria" "%ComSpec%" /k call "%~f0" telemetria
	echo Backend de telemetria iniciado em uma janela separada.
)

call :ensure_service 3000 "Frontend (3000)" frontend font_end
if errorlevel 1 goto frontend_failed

echo Aguardando o frontend iniciar...
for /L %%I in (1,1,60) do (
	curl.exe --silent --fail http://localhost:3000/ >nul 2>nul
	if not errorlevel 1 goto open_browser
	timeout /t 2 /nobreak >nul
)

echo O frontend nao respondeu em 120 segundos. Verifique a janela Frontend (3000).
pause
exit /b 1

:ensure_service
netstat -ano | findstr /R /C:":%~1 .*LISTENING" >nul
if not errorlevel 1 exit /b 0
start "%~2" /D "%APP_DIR%%~4" "%ComSpec%" /k call "%~f0" %~3
call :wait_port %~1
exit /b %errorlevel%

:wait_port
for /L %%I in (1,1,60) do (
	netstat -ano | findstr /R /C:":%~1 .*LISTENING" >nul
	if not errorlevel 1 exit /b 0
	timeout /t 2 /nobreak >nul
)
exit /b 1

:open_browser
start "" "http://localhost:3000/"
exit /b 0

:api_failed
echo A API principal nao respondeu na porta 3001. Verifique a janela SGA API (3001).
pause
exit /b 1

:frontend_failed
echo O frontend nao respondeu na porta 3000. Verifique a janela Frontend (3000).
pause
exit /b 1

:run_api
cd /d "%APP_DIR%beck_end"
if not exist node_modules (
	call npm.cmd ci --include=dev
	if errorlevel 1 (
		echo Falha ao instalar as dependencias da API.
		pause
		exit /b 1
	)
)
call npm.cmd start
exit /b

:run_telemetria
cd /d "%APP_DIR%back_end_telemetria"
if not exist node_modules (
	call npm.cmd ci
	if errorlevel 1 (
		echo Falha ao instalar as dependencias do backend de telemetria.
		pause
		exit /b 1
	)
)
if not exist "%APP_DIR%back_end_telemetria\.env" if exist "%APP_DIR%beck_end\.env" set "DOTENV_CONFIG_PATH=%APP_DIR%beck_end\.env"
call npm.cmd start
exit /b

:run_frontend
cd /d "%APP_DIR%font_end"
if not exist node_modules (
	call npm.cmd ci
	if errorlevel 1 (
		echo Falha ao instalar as dependencias do frontend.
		pause
		exit /b 1
	)
)
set "BROWSER=none"
call npm.cmd start
exit /b