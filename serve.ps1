# Servidor local mínimo para probar la app sin instalar nada:
#   powershell -ExecutionPolicy Bypass -File serve.ps1
# y abre http://localhost:8080 en el navegador.
param([int]$Port = 8080)

$root = $PSScriptRoot
$types = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"; ".css" = "text/css; charset=utf-8"
  ".json" = "application/json"; ".webmanifest" = "application/manifest+json"; ".png" = "image/png"; ".svg" = "image/svg+xml"
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Momentum en http://localhost:$Port  (Ctrl+C para detener)"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
    if ($path -eq "") { $path = "index.html" }
    $file = [IO.Path]::GetFullPath((Join-Path $root $path))
    $res = $ctx.Response
    $res.Headers.Add("Access-Control-Allow-Origin", "*")
    $res.Headers.Add("Cache-Control", "no-store")
    if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
      $ext = [IO.Path]::GetExtension($file)
      $res.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" })
      $bytes = [IO.File]::ReadAllBytes($file)
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
    }
    $res.Close()
  }
} finally {
  $listener.Stop()
}
