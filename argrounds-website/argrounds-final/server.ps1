$port = 8080
$root = Get-Location

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Listening on http://localhost:$port/"
Write-Host "Serving files from $root"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $url = $request.Url.LocalPath
    if ($url -eq "/") { $url = "/index.html" }
    
    # Handle directory requests
    $filePath = Join-Path $root $url
    if (Test-Path $filePath -PathType Container) {
        $filePath = Join-Path $filePath "index.html"
    }

    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = "text/plain"
        switch ($ext) {
            ".html" { $contentType = "text/html" }
            ".css"  { $contentType = "text/css" }
            ".js"   { $contentType = "application/javascript" }
            ".svg"  { $contentType = "image/svg+xml" }
            ".png"  { $contentType = "image/png" }
            ".jpg"  { $contentType = "image/jpeg" }
            ".json" { $contentType = "application/json" }
        }

        $response.ContentType = $contentType
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
        $response.StatusCode = 200
        Write-Host "200 GET $url"
    } else {
        $response.StatusCode = 404
        Write-Host "404 GET $url" -ForegroundColor Red
    }

    $response.Close()
}
