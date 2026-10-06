$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$path = Join-Path $repo 'dist/data/municipalities.json'
$municipalities = Get-Content $path -Raw | ConvertFrom-Json
$html = (Invoke-WebRequest -UseBasicParsing 'https://no.wikipedia.org/wiki/Liste_over_ordf%C3%B8rere_i_Norge_2023%E2%80%932027').Content
$partyMap = @{ 'Ap'='Ap'; 'H'='H'; 'Frp'='FrP'; 'SV'='SV'; 'Sp'='Sp'; 'KrF'='KrF'; 'V'='V'; 'MDG'='MDG'; 'R'='R' }
$updated = 0
foreach ($row in [regex]::Matches($html, '(?is)<tr[^>]*>(.*?)</tr>')) {
  $cells = @([regex]::Matches($row.Groups[1].Value, '(?is)<td[^>]*>(.*?)</td>') | ForEach-Object {
    $raw = [regex]::Replace($_.Groups[1].Value, '(?is)<br[^>]*>', '|')
    [System.Net.WebUtility]::HtmlDecode(($raw -replace '<[^>]+>', '')).Trim()
  })
  if ($cells.Count -lt 6 -or $cells[0] -notmatch '^\d{3,4}$') { continue }
  $id = '{0:D4}' -f [int]$cells[0]
  if ($id -eq '4618') { continue }
  $mayor = (($cells[4] -split '\|') | ForEach-Object { ($_ -replace '\s*\([^)]*\)\s*$', '').Trim() } | Where-Object { $_ } | Select-Object -Last 1)
  $partyText = (($cells[5] -split '\|') | ForEach-Object { ($_ -replace '\s*\([^)]*\)\s*$', '').Trim() } | Where-Object { $_ } | Select-Object -Last 1)
  $party = if ($partyMap.ContainsKey($partyText)) { $partyMap[$partyText] } else { 'Andre' }
  $m = $municipalities | Where-Object id -eq $id
  if ($m) {
    $m.mayor = $mayor
    $m.party = $party
    $m.source = 'https://no.wikipedia.org/wiki/Liste_over_ordf%C3%B8rere_i_Norge_2023%E2%80%932027'
    $m.note = $null
    $updated++
  }
}
$municipalities | ConvertTo-Json -Depth 8 | Set-Content $path -Encoding utf8
Write-Output "Updated $updated mayor records from Wikipedia; Ullensvang was preserved."
