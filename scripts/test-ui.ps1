$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

function Invoke-SupabaseCli {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$SupabaseArgs)

  if (Get-Command supabase -ErrorAction SilentlyContinue) {
    & supabase @SupabaseArgs
  } else {
    & npx --yes supabase @SupabaseArgs
  }

  if ($LASTEXITCODE -ne 0) { throw "Supabase CLI failed: $($SupabaseArgs -join ' ')" }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker Desktop is required to run local Supabase UI tests.'
}

cmd /c 'docker info >NUL 2>&1'
if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop is not running.' }

Invoke-SupabaseCli start
Invoke-SupabaseCli db reset

$statusOutput = Invoke-SupabaseCli status --output env
$statusText = $statusOutput -join "`n"
$localSettings = @{}
if ($statusText.TrimStart().StartsWith('{')) {
  $statusJson = $statusText | ConvertFrom-Json
  foreach ($property in $statusJson.PSObject.Properties) {
    $localSettings[$property.Name] = [string]$property.Value
  }
} else {
  foreach ($line in $statusOutput) {
    if ($line -match '^([A-Z0-9_]+)=(.*)$') {
      $localSettings[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
    }
  }
}

$apiUrl = $localSettings['API_URL']
$publicKey = $localSettings['PUBLISHABLE_KEY']
if (-not $publicKey) { $publicKey = $localSettings['ANON_KEY'] }
if (-not $apiUrl -or -not $publicKey) { throw 'Could not read the local Supabase API URL and public key.' }

$env:E2E_SUPABASE_URL = $apiUrl
$env:E2E_SUPABASE_PUBLISHABLE_KEY = $publicKey
$env:NEXT_PUBLIC_SUPABASE_URL = $apiUrl
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = $publicKey

$playwrightExitCode = 1
try {
  npx playwright test
  $playwrightExitCode = $LASTEXITCODE
} finally {
  Invoke-SupabaseCli db reset
}

exit $playwrightExitCode
