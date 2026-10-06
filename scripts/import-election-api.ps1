$ErrorActionPreference = 'Stop'
# Delegate both election imports to the UTF-8-safe Node script.
& node (Join-Path $PSScriptRoot 'import-election-api.mjs') @args
if ($LASTEXITCODE -ne 0) { throw 'Election import failed; see errors above.' }

