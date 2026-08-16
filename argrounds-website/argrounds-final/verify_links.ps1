$ErrorActionPreference = "Stop"
$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -Recurse | Where-Object { $_.FullName -notmatch "node_modules|supabase" }

$brokenLinks = @()
$checkedLinks = 0
$totalFiles = $htmlFiles.Count

Write-Host "Checking $($totalFiles) HTML files for internal links..."

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $matches = [regex]::Matches($content, 'href="([^"]+)"')
    
    foreach ($match in $matches) {
        $href = $match.Groups[1].Value
        
        # Skip external links, mailto, tel, sms, and empty links
        if ($href -match "^http" -or $href -match "^mailto:" -or $href -match "^tel:" -or $href -match "^sms:" -or $href -eq "") {
            continue
        }
        
        # Skip intra-page anchors
        if ($href -match "^#") {
            continue
        }

        $checkedLinks++
        
        # Resolve path
        $targetPath = ""
        if ($href.StartsWith("/")) {
            # Absolute to root
            $targetPath = Join-Path -Path (Get-Location).Path -ChildPath $href.TrimStart("/")
        } else {
            # Relative to current file
            $targetPath = Join-Path -Path $file.DirectoryName -ChildPath $href
        }

        # Handle directory links (append index.html)
        if ($href.EndsWith("/")) {
            $targetPath = Join-Path -Path $targetPath -ChildPath "index.html"
        }

        # Check if file exists
        if (-not (Test-Path -Path $targetPath)) {
            $brokenLinks += [PSCustomObject]@{
                File = $file.FullName.Replace((Get-Location).Path + "\", "")
                Href = $href
                Target = $targetPath
            }
        }
    }
}

Write-Host "Checked $checkedLinks internal links."
if ($brokenLinks.Count -gt 0) {
    Write-Host "FOUND $($brokenLinks.Count) BROKEN LINKS:" -ForegroundColor Red
    $brokenLinks | Format-Table -AutoSize
} else {
    Write-Host "SUCCESS: No broken links found!" -ForegroundColor Green
}
