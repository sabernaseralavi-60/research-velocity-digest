# Adds / removes a Windows Startup shortcut that runs start_local.ps1 at every login (no admin rights needed).
#   powershell -File scripts\install_autostart.ps1            install
#   powershell -File scripts\install_autostart.ps1 -Remove    remove
param([switch]$Remove)
$startup = [Environment]::GetFolderPath('Startup')
$lnk = Join-Path $startup 'AI Research Velocity Digest.lnk'
if ($Remove) { Remove-Item $lnk -ErrorAction SilentlyContinue; Write-Host "removed $lnk"; exit 0 }
$script = Join-Path $PSScriptRoot 'start_local.ps1'
$sh = New-Object -ComObject WScript.Shell
$s = $sh.CreateShortcut($lnk)
$s.TargetPath = 'powershell.exe'
$s.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`""
$s.WorkingDirectory = Split-Path -Parent $PSScriptRoot
$s.Save()
Write-Host "installed $lnk"
