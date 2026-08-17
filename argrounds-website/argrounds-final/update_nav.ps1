$nav_old = '(?s)<ul id="nav-menu" class="nav-menu">.*?</ul>'
$nav_new = '<ul id="nav-menu" class="nav-menu">
          <li><a href="/">Home</a></li>
          <li><a href="/services/">Services</a></li>
          <li><a href="/about.html">About</a></li>
          <li><a href="/contact.html">Contact</a></li>
          <li><a href="/quote.html" class="nav-cta">Free Quote</a></li>
        </ul>'

Get-ChildItem -Path "." -Filter *.html -Recurse | ForEach-Object {
    $content = Get-Content -Path $_.FullName -Raw
    $newContent = [regex]::Replace($content, $nav_old, $nav_new)
    if ($content -cne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline -Encoding UTF8
        Write-Host "Updated $($_.FullName)"
    }
}
