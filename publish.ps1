# Publishes this folder to GitHub (tmontes30/momentum, branch main) as ONE commit, without needing git.
# Requires GitHub CLI (gh) logged in as tmontes30:  gh auth status
# Usage:  powershell -ExecutionPolicy Bypass -File publish.ps1 -Message "what changed"
# GitHub Pages rebuilds automatically (1-5 min) -> https://cavedevz.com/momentum/
# Note: the commit REPLACES the whole repo tree with the contents of this folder (files deleted here get deleted there).
param([string]$Message = "Update")
$ErrorActionPreference = "Stop"
$gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
if (-not $gh) { $gh = "C:\Program Files\GitHub CLI\gh.exe" }
$repo = "tmontes30/momentum"
$root = $PSScriptRoot
$tmp = Join-Path $env:TEMP "momentum-publish"
New-Item -ItemType Directory -Force $tmp | Out-Null

function Api($method, $path, $body) {
  $f = Join-Path $tmp "body.json"
  [IO.File]::WriteAllText($f, ($body | ConvertTo-Json -Depth 10 -Compress), (New-Object Text.UTF8Encoding $false))
  $out = & $gh api -X $method $path --input $f
  if ($LASTEXITCODE -ne 0) { throw "gh api $method $path failed" }
  return $out | ConvertFrom-Json
}

$branch = (& $gh api "repos/$repo" | ConvertFrom-Json).default_branch
$parent = (& $gh api "repos/$repo/git/ref/heads/$branch" | ConvertFrom-Json).object.sha

$tree = @()
Get-ChildItem $root -Recurse -File | Where-Object { $_.FullName -notmatch '\\\.' } | ForEach-Object {
  $rel = $_.FullName.Substring($root.Length + 1).Replace("\", "/")
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($_.FullName))
  $blob = Api POST "repos/$repo/git/blobs" @{ content = $b64; encoding = "base64" }
  $tree += @{ path = $rel; mode = "100644"; type = "blob"; sha = $blob.sha }
  Write-Host "  + $rel"
}

$t = Api POST "repos/$repo/git/trees" @{ tree = $tree }
$c = Api POST "repos/$repo/git/commits" @{ message = $Message; tree = $t.sha; parents = @($parent) }
Api PATCH "repos/$repo/git/refs/heads/$branch" @{ sha = $c.sha; force = $false } | Out-Null
Write-Host "Commit $($c.sha.Substring(0,7)) on $branch. Pages will rebuild in a few minutes."
Remove-Item -Recurse -Force $tmp
