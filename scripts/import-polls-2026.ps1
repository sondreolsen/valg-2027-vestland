$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$municipalities = Get-Content (Join-Path $repo 'dist/data/municipalities.json') -Raw | ConvertFrom-Json
$byId = @{}; foreach ($m in $municipalities) { $byId[$m.id] = $m }
$months = @{ 'januar'=1; 'februar'=2; 'mars'=3; 'april'=4; 'mai'=5; 'juni'=6; 'juli'=7; 'august'=8; 'september'=9; 'oktober'=10; 'november'=11; 'desember'=12 }
$partyKeys = @('Ap','H','FrP','SV','Sp','KrF','V','MDG','R','Andre')
$listing = (Invoke-WebRequest -UseBasicParsing 'https://www.pollofpolls.no/?cmd=Maling&filter=kommune').Content
$listingMatches = [regex]::Matches($listing, '(?is)<a href="\?cmd=Maling&amp;gallupid=(\d+)">(.*?)</a><br\s*/?>\s*([^<]*2026)')
$polls = [ordered]@{}
foreach ($match in $listingMatches) {
    $description = ($match.Groups[2].Value -replace '<[^>]+>','').Trim()
    if ($description -notmatch ',\s*kommunestyrevalg\)') { continue }
    $dateText = $match.Groups[3].Value.Trim()
    $dateMatch = [regex]::Match($dateText, '^([0-9]{1,2})\.\s+(.+)\s+2026$')
    if (-not $dateMatch.Success) { continue }
    $date = '{0:D4}-{1:D2}-{2:D2}' -f 2026,$months[$dateMatch.Groups[2].Value], [int]$dateMatch.Groups[1].Value
    $url = "https://www.pollofpolls.no/?cmd=Maling&gallupid=$($match.Groups[1].Value)"
    $html = (Invoke-WebRequest -UseBasicParsing $url).Content
    $municipalityMatch = [regex]::Match($html, 'cmd=Kommunestyre&amp;kommune=(\d+)')
    if (-not $municipalityMatch.Success) { continue }
    $id = $municipalityMatch.Groups[1].Value
    if (-not $byId.ContainsKey($id) -or $polls.Contains($id)) { continue }
    $percentMatch = [regex]::Match($html, 'Mandatfordeling&amp;do=koen&amp;Ap=([^&]+)&amp;H=([^&]+)&amp;Frp=([^&]+)&amp;SV=([^&]+)&amp;Sp=([^&]+)&amp;KrF=([^&]+)&amp;V=([^&]+)&amp;MDG=([^&]+)&amp;R=([^&]+)&amp;A=([^&]+)&amp;kommuneid=')
    if (-not $percentMatch.Success) { continue }
    $seatMatch = [regex]::Match($html, 'image-dev\.php\?type=pop_mandater_fleks&amp;[^"'']+')
    $values = [ordered]@{}; $seats = [ordered]@{}
    for ($i=0; $i -lt $partyKeys.Count; $i++) { $values[$partyKeys[$i]] = [double]::Parse($percentMatch.Groups[$i+1].Value.Replace(',','.'), [cultureinfo]::InvariantCulture) }
    if ($seatMatch.Success) {
        $seatText = $seatMatch.Value
        foreach ($key in @('Ap','H','Frp','SV','Sp','KrF','V','MDG','R','A')) {
            $seat = [regex]::Match($seatText, "&amp;$key=(\d+)")
            $mapped = if ($key -eq 'Frp') { 'FrP' } elseif ($key -eq 'A') { 'Andre' } else { $key }
            $seats[$mapped] = if ($seat.Success) { [int]$seat.Groups[1].Value } else { 0 }
        }
    }
    $client = ($description -replace '\s*\([^)]*\)\s*$','').Trim()
    $polls[$id] = [ordered]@{date=$date;institute='';client=$client;sample=0;fieldwork='';source=$url;values=$values;seats=$seats}
    Write-Output "Imported $id $($byId[$id].name) from poll $($match.Groups[1].Value)"
}
$polls | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $repo 'dist/data/polls.json') -Encoding utf8
Write-Output "Saved $($polls.Count) 2026 municipality polls."
