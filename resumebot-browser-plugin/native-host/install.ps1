# ResumeBot 1Password host installer for Windows
# Usage: .\install.ps1 <extension_id> <account_name> [vault_id]
# If arguments are omitted, the script prompts for them.
#
# Chrome on Windows locates native hosts through the registry key
#   HKCU\Software\Google\Chrome\NativeMessagingHosts\<host name>
# whose (Default) value is the PATH TO A MANIFEST JSON FILE. The manifest's
# "path" must be an executable, so we write run-host.cmd (pinning the
# absolute node.exe path, since Chrome does not inherit your shell PATH).

param(
    [Parameter(Mandatory=$false)] [string]$ExtensionId,
    [Parameter(Mandatory=$false)] [string]$AccountName,
    [Parameter(Mandatory=$false)] [string]$VaultId = ""
)

if (-not $ExtensionId) { $ExtensionId = Read-Host "Enter the Chrome extension ID" }
if (-not $AccountName) { $AccountName = Read-Host "Enter your 1Password account name (as shown in the app sidebar)" }

if (-not $ExtensionId) { Write-Error "Extension ID cannot be empty"; exit 1 }
if (-not $AccountName) { Write-Error "Account name cannot be empty"; exit 1 }

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$hostJsPath = Join-Path $scriptDir "host.js"
$launcher   = Join-Path $scriptDir "run-host.cmd"
$manifest   = Join-Path $scriptDir "com.resumebot.op.json"
$configPath = Join-Path $scriptDir "config.json"

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) { Write-Error "node.exe not found on PATH. Install Node.js 18+ first."; exit 1 }
$nodeExe = $nodeCmd.Source

if (-not (Test-Path (Join-Path $scriptDir "node_modules\@1password\sdk")) -and -not (Test-Path (Join-Path $scriptDir "..\node_modules\@1password\sdk"))) {
    Write-Host "Note: @1password/sdk is not installed yet. Run: cd `"$scriptDir`"; npm install"
}

# Files are written without a BOM: Chrome and Node both reject a BOM at the
# start of JSON, and Windows PowerShell 5.1's -Encoding UTF8 adds one.
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Launcher: Chrome executes this; it execs node on host.js.
[IO.File]::WriteAllText($launcher, "@echo off`r`n`"$nodeExe`" `"$hostJsPath`"`r`n", $utf8NoBom)

# Manifest file (JSON). ConvertTo-Json escapes the backslashes in the path.
$manifestObj = [ordered]@{
    name            = "com.resumebot.op"
    description     = "ResumeBot 1Password host"
    path            = $launcher
    type            = "stdio"
    allowed_origins = @("chrome-extension://$ExtensionId/")
}
[IO.File]::WriteAllText($manifest, ($manifestObj | ConvertTo-Json), $utf8NoBom)

# Registry: (Default) = path to the manifest file.
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.resumebot.op"
if (-not (Test-Path $registryPath)) { New-Item -Path $registryPath -Force | Out-Null }
Set-ItemProperty -Path $registryPath -Name "(Default)" -Value $manifest

$configObj = [ordered]@{
    accountName = $AccountName
    vaultId     = $VaultId
    extensionId = $ExtensionId
}
[IO.File]::WriteAllText($configPath, ($configObj | ConvertTo-Json), $utf8NoBom)

Write-Host "Installation successful:"
Write-Host "  Launcher written to: $launcher (node: $nodeExe)"
Write-Host "  Manifest written to: $manifest"
Write-Host "  Registry key:        $registryPath -> manifest"
Write-Host "  Config written to:   $configPath"
Write-Host ""
Write-Host "Prerequisites (cannot be automated):"
Write-Host "  1. Install the 1Password desktop app (https://1password.com/downloads/)"
Write-Host "  2. 1Password Settings -> Developer -> enable ""Integrate with other apps"""
Write-Host "  3. For biometric approval: Settings -> Security -> enable Windows Hello"
Write-Host ""
Write-Host "Restart Chrome so it picks up the new host manifest."
