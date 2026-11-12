@echo off
setlocal

set "APP_DIR=%~dp0"

if /I "%~1"=="api" goto run_api
if /I "%~1"=="frontend" goto run_frontend
if /I "%~1"=="node-red" goto run_node_red

netstat -ano | findstr /R /C:":3001 .*LISTENING" >nul
if errorlevel 1 (
	start "SGA API (3001)" /D "%APP_DIR%beck_end" "%ComSpec%" /k call "%~f0" api
	call :wait_port 3001
	if errorlevel 1 goto api_failed
)

netstat -ano | findstr /R /C:":1880 .*LISTENING" >nul
if errorlevel 1 (
	start "Node-RED (1880)" /D "%APP_DIR%beck_end" "%ComSpec%" /k call "%~f0" node-red
	call :wait_port 1880
	if errorlevel 1 goto node_red_failed
)

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if errorlevel 1 (
	start "Frontend (3000)" /D "%APP_DIR%font_end" "%ComSpec%" /k call "%~f0" frontend
)

echo Aguardando o frontend iniciar...
for /L %%I in (1,1,60) do (
	curl.exe --silent --fail http://localhost:3000/ >nul 2>nul
	if not errorlevel 1 goto open_browser
	timeout /t 2 /nobreak >nul
)

echo O frontend nao respondeu em 120 segundos. Verifique a janela Frontend (3000).
pause
exit /b 1

:open_browser
start "" "http://localhost:3000/"
exit /b 0

:wait_port
for /L %%I in (1,1,60) do (
	netstat -ano | findstr /R /C:":%~1 .*LISTENING" >nul
	if not errorlevel 1 exit /b 0
	timeout /t 2 /nobreak >nul
)
exit /b 1

:api_failed
echo A API nao respondeu na porta 3001. Verifique a janela SGA API (3001).
pause
exit /b 1

:node_red_failed
echo O Node-RED nao respondeu na porta 1880. Verifique a janela Node-RED (1880).
pause
exit /b 1

:run_api
if not exist node_modules (
	call npm.cmd install
	if errorlevel 1 (
		echo Falha ao instalar as dependencias da API.
		pause
		exit /b 1
	)
)
call npm.cmd start
exit /b

:run_node_red
if not exist node_modules (
	call npm.cmd install
	if errorlevel 1 (
		echo Falha ao instalar as dependencias do Node-RED.
		pause
		exit /b 1
	)
)
call npm.cmd run node-red
exit /b

:run_frontend
if not exist node_modules (
	call npm.cmd install
	if errorlevel 1 (
		echo Falha ao instalar as dependencias do frontend.
		pause
		exit /b 1
	)
)
set "BROWSER=none"
call npm.cmd start
exit /b
