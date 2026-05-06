$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -Recurse | Where-Object { $_.FullName -notmatch "node_modules|supabase" }
foreach ($f in $htmlFiles) {
    $content = Get-Content -Path $f.FullName -Encoding UTF8 -Raw
    $newContent = $content -replace "â€™", "'"
    $newContent = $newContent -replace "â€”", "—"
    $newContent = $newContent -replace "Ã¢â‚¬â€", "—"
    $newContent = $newContent -replace "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â", "—"
    $newContent = $newContent -replace "â€“", "-"
    $newContent = $newContent -replace "Ã¢â‚¬Å“", "-"
    
    $newContent = $newContent -replace 'href="#quote"', 'href="/quote.html"'
    $newContent = $newContent -replace 'href="index.html" class="brand"', 'href="/" class="brand"'
    $newContent = $newContent -replace 'href="\.\./index.html" class="brand"', 'href="/" class="brand"'
    
    if ($content -cne $newContent) {
        Set-Content -Path $f.FullName -Value $newContent -NoNewline -Encoding UTF8
        Write-Host "Updated $($f.FullName)"
    }
}
