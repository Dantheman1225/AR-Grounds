$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -Recurse | Where-Object { $_.FullName -notmatch "node_modules|supabase" }
foreach ($f in $htmlFiles) {
    $content = Get-Content -Path $f.FullName -Encoding UTF8 -Raw
    
    $newContent = $content -replace "We Don.{1,5}t Leave", "We Don't Leave"
    $newContent = $newContent -replace "make it right .{1,10} free", "make it right — free"
    $newContent = $newContent -replace "crew .{1,10} not a", "crew — not a"
    $newContent = $newContent -replace "hours .{1,10} usually", "hours — usually"
    $newContent = $newContent -replace "Maintenance .{1,10} Pressure", "Maintenance — Pressure"
    $newContent = $newContent -replace "brand new .{1,10} fast", "brand new — fast"
    $newContent = $newContent -replace "together .{1,10} best", "together — best"
    $newContent = $newContent -replace "option .{1,10} no obligation", "option — no obligation"
    $newContent = $newContent -replace "Driveway .{1,10} Little Rock", "Driveway — Little Rock"
    $newContent = $newContent -replace "Walkway .{1,10} North", "Walkway — North"
    $newContent = $newContent -replace "Driveway .{1,10} Sherwood", "Driveway — Sherwood"
    $newContent = $newContent -replace "quote .{1,10} transparent", "quote — transparent"
    $newContent = $newContent -replace "different .{1,10} driveway size", "different — driveway size"
    $newContent = $newContent -replace "1.{1,5}2 hours", "1-2 hours"
    $newContent = $newContent -replace "30.{1,5}60 minutes", "30-60 minutes"
    $newContent = $newContent -replace "choice .{1,10} we'll", "choice — we'll"
    $newContent = $newContent -replace "sit .{1,10} you'll", "sit — you'll"
    $newContent = $newContent -replace "right .{1,10} no excuses", "right — no excuses"
    $newContent = $newContent -replace "Not sure .{1,10} need", "Not sure — need"
    $newContent = $newContent -replace "dirt.{1,10}it's likely", "dirt—it's likely"
    $newContent = $newContent -replace "everything else.{1,10}including", "everything else—including"
    $newContent = $newContent -replace "grime.{1,10}meaning we don't", "grime—meaning we don't"
    $newContent = $newContent -replace "needs.{1,10}like removing", "needs—like removing"
    $newContent = $newContent -replace "Washing.{1,10}a method", "Washing—a method"
    $newContent = $newContent -replace "value.{1,10}Choose", "value">— Choose"
    $newContent = $newContent -replace "Choose a service .{1,10}</option>", "Choose a service —</option>"
    $newContent = $newContent -replace "value.{1,10}Select", "value">— Select"
    $newContent = $newContent -replace "Select a size .{1,10}</option>", "Select a size —</option>"
    $newContent = $newContent -replace "value.{1,10}Any", "value">— Any"
    $newContent = $newContent -replace "Any time works .{1,10}</option>", "Any time works —</option>"
    $newContent = $newContent -replace "\(8am.{1,5}12pm\)", "(8am–12pm)"
    $newContent = $newContent -replace "\(12pm.{1,5}5pm\)", "(12pm–5pm)"
    $newContent = $newContent -replace "\(5pm.{1,5}7pm\)", "(5pm–7pm)"
    
    if ($content -cne $newContent) {
        Set-Content -Path $f.FullName -Value $newContent -NoNewline -Encoding UTF8
        Write-Host "Updated $($f.FullName)"
    }
}
