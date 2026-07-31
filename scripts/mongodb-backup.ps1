param(
    [Parameter(Mandatory = $true)]
    [string]$OutputDirectory
)

$ErrorActionPreference = "Stop"

if (-not $env:MONGO_URL) {
    throw "MONGO_URL doit être défini dans l'environnement."
}
if (-not $env:DB_NAME) {
    throw "DB_NAME doit être défini dans l'environnement."
}

$resolvedParent = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $resolvedParent | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archive = Join-Path $resolvedParent "apa-connect-$timestamp.archive.gz"

& mongodump `
    --uri="$env:MONGO_URL" `
    --db="$env:DB_NAME" `
    --archive="$archive" `
    --gzip

if ($LASTEXITCODE -ne 0) {
    throw "La sauvegarde MongoDB a échoué."
}

$hash = Get-FileHash -Algorithm SHA256 -LiteralPath $archive
$metadata = [PSCustomObject]@{
    created_at = (Get-Date).ToUniversalTime().ToString("o")
    database = $env:DB_NAME
    archive = [System.IO.Path]::GetFileName($archive)
    sha256 = $hash.Hash
}
$metadata | ConvertTo-Json | Set-Content -Encoding UTF8 "$archive.json"

Write-Output "Sauvegarde créée : $archive"
Write-Output "Empreinte SHA-256 : $($hash.Hash)"
