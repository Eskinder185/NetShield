# Windows PowerShell: start API (embedded H2, no Docker needed) and web dev server in two windows.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not $env:JAVA_HOME) { Write-Warning 'Set JAVA_HOME to a JDK 17+ before running.' }
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root/services/api'; mvn spring-boot:run '-Dspring-boot.run.profiles=h2'"
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root/apps/web'; npm install; npm run dev"
Write-Host 'API: http://127.0.0.1:8080  Web: http://127.0.0.1:5173'
