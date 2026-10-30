$ErrorActionPreference = 'Stop'

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
  throw 'Docker Desktop is required to run the local Supabase stack.'
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw 'Docker is installed but its daemon is not running. Start Docker Desktop and rerun this script.'
}

Invoke-SupabaseCli start

Invoke-SupabaseCli db reset

$statusOutput = Invoke-SupabaseCli status --output env

$localSettings = @{}
$statusText = $statusOutput -join "`n"
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
if (-not $apiUrl) { $apiUrl = $localSettings['SUPABASE_URL'] }
$publicKey = $localSettings['ANON_KEY']
if (-not $publicKey) { $publicKey = $localSettings['PUBLISHABLE_KEY'] }
if (-not $apiUrl -or -not $publicKey) {
  throw 'Supabase status did not provide API_URL and ANON_KEY/PUBLISHABLE_KEY.'
}

$env:INTEGRATION_SUPABASE_URL = $apiUrl
$env:INTEGRATION_SUPABASE_PUBLISHABLE_KEY = $publicKey

npx vitest run --config vitest.integration.config.mts
exit $LASTEXITCODE
