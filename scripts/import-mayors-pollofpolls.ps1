$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$path = Join-Path $repo 'dist/data/municipalities.json'
$municipalities = Get-Content $path -Raw | ConvertFrom-Json
$html = (Invoke-WebRequest -UseBasicParsing 'https://www.pollofpolls.no/?cmd=Kommunestyre&do=ordforere&sort=knavn').Content
$partyMap = @{ 'Ap'='Ap'; 'H'='H'; 'Frp'='FrP'; 'SV'='SV'; 'Sp'='Sp'; 'KrF'='KrF'; 'V'='V'; 'MDG'='MDG'; 'R'='R'; 'A'='Andre' }
$seen = @{}
foreach ($row in [regex]::Matches($html, '(?is)<tr>(.*?)</tr>')) {
  $cells = @([regex]::Matches($row.Groups[1].Value, '(?is)<td[^>]*>(.*?)</td>') | ForEach-Object {
    [System.Net.WebUtility]::HtmlDecode(($_.Groups[1].Value -replace '<[^>]+>', '')).Trim()
  })
  if ($cells.Count -lt 4 -or $cells[0] -notmatch '^\d{3,4}$') { continue }
  $id = '{0:D4}' -f [int]$cells[0]
  if ($seen.ContainsKey($id)) { continue }
  $party = $partyMap[$cells[3]]
  if (-not $party) { continue }
  $seen[$id] = $true
  $m = $municipalities | Where-Object id -eq $id
  if ($m) {
    $m.mayor = $cells[2]
    $m.party = $party
    $m.source = 'https://www.pollofpolls.no/?cmd=Kommunestyre&do=ordforere&sort=knavn'
    $m.note = $null
  }
}
$municipalities | ConvertTo-Json -Depth 8 | Set-Content $path -Encoding utf8
Write-Output "Imported $($seen.Count) mayor records."
