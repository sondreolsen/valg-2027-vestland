$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$municipalities = Get-Content (Join-Path $repo 'dist/data/municipalities.json') -Raw | ConvertFrom-Json
$results = [ordered]@{}
foreach ($m in $municipalities) {
    $url = "https://www.pollofpolls.no/?cmd=Kommunestyre&do=visvalg&valg=2023&id=$($m.id)"
    $html = (Invoke-WebRequest -UseBasicParsing $url).Content
    if ($html -notmatch ('Enkeltresultat ' + [regex]::Escape($m.name))) { throw "Wrong municipality: $($m.id)" }
    $rows = @()
    foreach ($match in [regex]::Matches($html, '(?s)<tr>\s*<th><a href="\?cmd=Partier&amp;parti=([^"&]+)">.*?</tr>')) {
        $party = $match.Groups[1].Value
        if ($party -eq 'Frp') { $party = 'FrP' }
        if ($party -eq 'A') { $party = 'Andre' }
        $cells = [regex]::Matches($match.Value, '(?s)<td[^>]*>(.*?)</td>')
        if ($cells.Count -ne 8) { throw "Unexpected result columns: $($m.id) $party" }
        $percent = [double]::Parse($cells[4].Groups[1].Value.Replace(',','.'), [cultureinfo]::InvariantCulture)
        $seats = [int]$cells[6].Groups[1].Value
        $rows += [pscustomobject]@{party=$party;percent=$percent;seats=$seats}
    }
    $totalMatch = [regex]::Match($html, '(?s)<td>Mandater</td>\s*<td[^>]*>(\d+)</td>')
    if ($rows.Count -ne 10 -or !$totalMatch.Success) { throw "Incomplete result: $($m.id)" }
    $totalSeats = [int]$totalMatch.Groups[1].Value
    if (($rows | Measure-Object seats -Sum).Sum -ne $totalSeats) { throw "Seat mismatch: $($m.id)" }
    if ([Math]::Abs(($rows | Measure-Object percent -Sum).Sum - 100) -gt 0.6) { throw "Percentage mismatch: $($m.id)" }
    $results[$m.id] = [ordered]@{name=$m.name;source=$url;totalSeats=$totalSeats;results=$rows}
}
if ($results.Count -ne 43) { throw 'Expected all 43 municipalities' }
$results | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $repo 'dist/data/elections-2023.json') -Encoding utf8
Write-Output "Validated $($results.Count) municipalities, including percentages and seat totals."
