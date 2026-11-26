# Creates a Medusa Admin user in the shop's database.
# Asks for the email and a hidden password; nothing is saved to disk.
# Run from the repo root:  & .\scripts\create-admin.ps1
$ErrorActionPreference = "Stop"
$backend = Join-Path $PSScriptRoot "..\backend\apps\backend"

Write-Host ""
Write-Host "Create your Aj Desk Admin login" -ForegroundColor Cyan
Write-Host "Sign in afterwards at https://aj-desk-accessories-store.vercel.app/app"
Write-Host ""

$email = Read-Host "Admin email"
if ($email -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { throw "That doesn't look like an email address." }

function Read-Plain([string]$prompt) {
  $secure = Read-Host $prompt -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

$password = Read-Plain "Password (min. 12 characters, hidden)"
if ($password.Length -lt 12) { throw "Please use at least 12 characters." }
$confirm = Read-Plain "Type the password again"
if ($password -ne $confirm) { throw "The passwords don't match. Run the script again." }

Write-Host ""
Write-Host "Creating the user (takes about a minute)..." -ForegroundColor Cyan
Push-Location $backend
try {
  npx medusa user -e $email -p $password
  if ($LASTEXITCODE -ne 0) { throw "Medusa could not create the user (see the message above)." }
  Write-Host ""
  Write-Host "Done. Sign in at https://aj-desk-accessories-store.vercel.app/app with $email" -ForegroundColor Green
} finally {
  Pop-Location
  $password = $null; $confirm = $null
}
