$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$municipalities = Get-Content (Join-Path $repo 'dist/data/municipalities.json') -Raw | ConvertFrom-Json
$results = [ordered]@{}
$map = @{ 'A'='Ap'; 'H'='H'; 'FRP'='FrP'; 'SP'='Sp'; 'SV'='SV'; 'V'='V'; 'MDG'='MDG'; 'RØDT'='R'; 'KRF'='KrF' }
$largeMunicipalityNames = @('Oslo','Bergen','Trondheim','Stavanger','Bærum','Kristiansand','Drammen','Asker','Lillestrøm','Fredrikstad','Sandnes','Tromsø','Sandefjord','Nordre Follo','Sarpsborg','Tønsberg','Ålesund','Skien','Bodø','Moss','Lørenskog','Larvik','Indre Østfold','Arendal','Ullensaker','Karmøy','Øygarden','Haugesund','Porsgrunn','Ringsaker')
$largeMunicipalityIds = @{}
foreach ($municipality in $municipalities) {
    if ($largeMunicipalityNames -contains [string]$municipality.name) { $largeMunicipalityIds[[string]$municipality.id] = $true }
}
foreach ($m in $municipalities) {
    $url = "https://valgresultat.no/api/2023/ko/$($m.countyCode)/$($m.id)"
    try {
        $tempFile = Join-Path $env:TEMP ("valg-api-$($m.id).json")
        & curl.exe -L --max-time 20 -sS -o $tempFile $url
        $json = (Get-Content -LiteralPath $tempFile -Raw -Encoding utf8) | ConvertFrom-Json
        Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
        $aggregated = [ordered]@{}
        foreach ($parti in $json.partier) {
            $code = [string]$parti.id.partikode
            $name = [string]$parti.id.navn
            # The API includes one or more summary rows named Andre/Andre2 in
            # addition to the real party and local-list rows. Skip all of
            # those summaries so local lists are not double-counted.
            if ($code -match '^Andre' -or $name -match '^Andre' -or $name -eq 'Blanke') { continue }
            $party = if ($map.ContainsKey($code)) { $map[$code] } else { $name }
            if ($largeMunicipalityIds.ContainsKey([string]$m.id) -and -not $map.ContainsKey($code)) { $party = 'Andre' }
            if (-not $aggregated.Contains($party)) { $aggregated[$party] = [ordered]@{ percent = 0.0; seats = 0 } }
            $aggregated[$party].percent += [double]$parti.stemmer.resultat.prosent
            $aggregated[$party].seats += [int]$parti.mandater.resultat.antall
        }
        $rows = @($aggregated.GetEnumerator() | ForEach-Object { [ordered]@{ party=$_.Key; percent=[math]::Round($_.Value.percent, 2); seats=$_.Value.seats } })
        $results[$m.id] = [ordered]@{ name=$m.name; source=$url; totalSeats=[int]$json.mandater.antall; results=$rows }
        Write-Output "Imported $($m.id) $($m.name)"
    } catch {
        Write-Warning "Failed $($m.id) $($m.name): $($_.Exception.Message)"
    }
}
$results | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $repo 'dist/data/elections-2023.json') -Encoding utf8
Write-Output "Saved $($results.Count) municipality results."

