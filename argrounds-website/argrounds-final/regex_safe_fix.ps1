$emDash = [char]0x2014
$enDash = [char]0x2013
$apos = [char]0x0027

$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -Recurse | Where-Object { $_.FullName -notmatch "node_modules|supabase" }
foreach ($f in $htmlFiles) {
    $content = Get-Content -Path $f.FullName -Encoding UTF8 -Raw
    
    $newContent = $content -replace "We Don.{1,5}t Leave", "We Don${apos}t Leave"
    $newContent = $newContent -replace "make it right .{1,10} free", "make it right $emDash free"
    $newContent = $newContent -replace "crew .{1,10} not a", "crew $emDash not a"
    $newContent = $newContent -replace "hours .{1,10} usually", "hours $emDash usually"
    $newContent = $newContent -replace "Maintenance .{1,10} Pressure", "Maintenance $emDash Pressure"
    $newContent = $newContent -replace "brand new .{1,10} fast", "brand new $emDash fast"
    $newContent = $newContent -replace "together .{1,10} best", "together $emDash best"
    $newContent = $newContent -replace "option .{1,10} no obligation", "option $emDash no obligation"
    $newContent = $newContent -replace "Driveway .{1,10} Little Rock", "Driveway $emDash Little Rock"
    $newContent = $newContent -replace "Walkway .{1,10} North", "Walkway $emDash North"
    $newContent = $newContent -replace "Driveway .{1,10} Sherwood", "Driveway $emDash Sherwood"
    $newContent = $newContent -replace "quote .{1,10} transparent", "quote $emDash transparent"
    $newContent = $newContent -replace "different .{1,10} driveway size", "different $emDash driveway size"
    $newContent = $newContent -replace "1.{1,5}2 hours", "1-2 hours"
    $newContent = $newContent -replace "30.{1,5}60 minutes", "30-60 minutes"
    $newContent = $newContent -replace "choice .{1,10} we${apos}ll", "choice $emDash we${apos}ll"
    $newContent = $newContent -replace "sit .{1,10} you${apos}ll", "sit $emDash you${apos}ll"
    $newContent = $newContent -replace "right .{1,10} no excuses", "right $emDash no excuses"
    $newContent = $newContent -replace "Not sure .{1,10} need", "Not sure $emDash need"
    $newContent = $newContent -replace "dirt.{1,10}it${apos}s likely", "dirt${emDash}it${apos}s likely"
    $newContent = $newContent -replace "everything else.{1,10}including", "everything else${emDash}including"
    $newContent = $newContent -replace "grime.{1,10}meaning we don${apos}t", "grime${emDash}meaning we don${apos}t"
    $newContent = $newContent -replace "needs.{1,10}like removing", "needs${emDash}like removing"
    $newContent = $newContent -replace "Washing.{1,10}a method", "Washing${emDash}a method"
    $newContent = $newContent -replace "value=`"unsure`">.{1,10} Choose", "value=`"unsure`">$emDash Choose"
    $newContent = $newContent -replace "Choose a service .{1,10}</option>", "Choose a service $emDash</option>"
    $newContent = $newContent -replace "value=`"`">.{1,10} Select", "value=`"`">$emDash Select"
    $newContent = $newContent -replace "Select a size .{1,10}</option>", "Select a size $emDash</option>"
    $newContent = $newContent -replace "value=`"`">.{1,10} Any", "value=`"`">$emDash Any"
    $newContent = $newContent -replace "Any time works .{1,10}</option>", "Any time works $emDash</option>"
    $newContent = $newContent -replace "\(8am.{1,5}12pm\)", "(8am${enDash}12pm)"
    $newContent = $newContent -replace "\(12pm.{1,5}5pm\)", "(12pm${enDash}5pm)"
    $newContent = $newContent -replace "\(5pm.{1,5}7pm\)", "(5pm${enDash}7pm)"
    
    # Fix the brand icon links if any remain
    $newContent = $newContent -replace 'href="index.html" class="brand"', 'href="/" class="brand"'
    
    if ($content -cne $newContent) {
        Set-Content -Path $f.FullName -Value $newContent -NoNewline -Encoding UTF8
        Write-Host "Updated $($f.FullName)"
    }
}
