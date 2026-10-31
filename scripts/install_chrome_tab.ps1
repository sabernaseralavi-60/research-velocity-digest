# Makes the dashboard one of the tabs Chrome opens when started from your Desktop Chrome shortcut(s).
# It only appends the URL to the shortcut's arguments (Chrome settings and profile are untouched), so it is
# added next to your normal startup tabs. -Remove undoes it.
#   powershell -File scripts\install_chrome_tab.ps1 [-Remove] [-Url http://localhost:4791]
param([switch]$Remove, [string]$Url = 'http://localhost:4791')
$sh = New-Object -ComObject WScript.Shell
$dirs = @([Environment]::GetFolderPath('Desktop'), "$env:APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar", "$env:APPDATA\Microsoft\Windows\Start Menu\Programs")
foreach ($d in $dirs) {
  if (-not (Test-Path $d)) { continue }
  Get-ChildItem $d -Filter *.lnk -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    $s = $sh.CreateShortcut($_.FullName)
    if ($s.TargetPath -notmatch 'chrome\.exe$') { return }
    $args0 = $s.Arguments
    $has = $args0 -match [regex]::Escape($Url)
    if ($Remove -and $has) { $s.Arguments = ($args0 -replace [regex]::Escape($Url), '').Trim(); $s.Save(); "removed from $($_.Name)" }
    elseif (-not $Remove -and -not $has) { $s.Arguments = ("$args0 $Url").Trim(); $s.Save(); "added to $($_.Name): $($s.Arguments)" }
  }
}
