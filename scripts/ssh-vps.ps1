# SSH to Hostinger VPS (reads paths from .env)
# Usage: .\scripts\ssh-vps.ps1
#        .\scripts\ssh-vps.ps1 -Tunnel

param(
    [switch]$Tunnel
)

$envFile = (Resolve-Path (Join-Path $PSScriptRoot "..\.env")).Path
$vars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $parts = $_ -split '=', 2
    $vars[$parts[0].Trim()] = $parts[1].Trim()
}

$host_ = $vars['SSH_VPS_HOST']
$user = $vars['SSH_VPS_USER']
$key = $vars['SSH_KEY_PATH']

if (-not $host_ -or -not $user -or -not $key) {
    Write-Error "Set SSH_VPS_HOST, SSH_VPS_USER, SSH_KEY_PATH in .env"
    exit 1
}

if (-not (Test-Path $key)) {
    Write-Host "SSH private key not found: $key" -ForegroundColor Yellow
    Write-Host "Download from Hostinger hPanel -> VPS -> SSH Keys -> $($vars['SSH_HOSTINGER_NAME'])"
    Write-Host "Save as: $key"
    exit 1
}

$sshArgs = @("-i", $key, "${user}@${host_}")
if ($Tunnel) {
    $sshArgs = @("-i", $key, "-L", "6543:127.0.0.1:6543", "${user}@${host_}")
    Write-Host "Tunnel: localhost:6543 -> VPS:6543 (keep this window open)" -ForegroundColor Cyan
}

Write-Host "Connecting: ssh $($sshArgs -join ' ')" -ForegroundColor Green
ssh @sshArgs
