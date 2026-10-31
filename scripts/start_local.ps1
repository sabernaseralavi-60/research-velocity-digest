# Starts the local dashboard: refreshes the database snapshot from GitHub, then serves http://localhost:4173.
# Run by the Startup shortcut (see install_autostart.ps1) or by hand. Safe to run twice.
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$port = if ($env:PORT) { $env:PORT } else { '4173' }
$log = Join-Path $root 'output\local_server.log'
New-Item -ItemType Directory -Force (Join-Path $root 'output') | Out-Null

"[$(Get-Date -Format s)] sync" | Out-File $log -Append -Encoding utf8
node scripts/sync_db.mjs 2>&1 | Out-File $log -Append -Encoding utf8

$listening = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
if ($listening) { "[$(Get-Date -Format s)] already running on port $port" | Out-File $log -Append -Encoding utf8; exit 0 }

if (-not (Test-Path (Join-Path $root 'node_modules'))) { npm ci 2>&1 | Out-File $log -Append -Encoding utf8 }
if (-not (Test-Path (Join-Path $root 'dist\index.html'))) { npm run build 2>&1 | Out-File $log -Append -Encoding utf8 }

$env:SQLITE_PATH = Join-Path $root 'output\research_velocity.db'
$env:PORT = $port
Start-Process -FilePath (Join-Path $root 'node_modules\.bin\tsx.cmd') -ArgumentList 'server/dev.ts' `
  -WorkingDirectory $root -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $root 'output\server.out.log') -RedirectStandardError (Join-Path $root 'output\server.err.log')
"[$(Get-Date -Format s)] server started on port $port" | Out-File $log -Append -Encoding utf8
