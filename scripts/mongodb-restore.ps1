param(
    [Parameter(Mandatory = $true)]
    [string]$Archive,

    [Parameter(Mandatory = $true)]
    [string]$TargetDatabase,

    [switch]$ConfirmRestore
)

$ErrorActionPreference = "Stop"

if (-not $ConfirmRestore) {
    throw "Ajoutez -ConfirmRestore après avoir vérifié la cible et la sauvegarde."
}
if (-not $env:MONGO_URL -or -not $env:DB_NAME) {
    throw "MONGO_URL et DB_NAME doivent être définis dans l'environnement."
}
if (-not (Test-Path -LiteralPath $Archive -PathType Leaf)) {
    throw "Archive introuvable : $Archive"
}
if ($TargetDatabase -notmatch '^[A-Za-z0-9_-]+$') {
    throw "Le nom de la base cible contient des caractères non autorisés."
}
if ($TargetDatabase -eq $env:DB_NAME) {
    throw "La restauration directe dans la base source est interdite. Utilisez une base cible distincte."
}

$resolvedArchive = (Resolve-Path -LiteralPath $Archive).Path

& mongorestore `
    --uri="$env:MONGO_URL" `
    --archive="$resolvedArchive" `
    --gzip `
    --nsFrom="$env:DB_NAME.*" `
    --nsTo="$TargetDatabase.*"

if ($LASTEXITCODE -ne 0) {
    throw "La restauration MongoDB a échoué."
}

Write-Output "Restauration terminée dans la base : $TargetDatabase"
